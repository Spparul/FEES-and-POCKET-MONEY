from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models

def format_standard(std_val: str) -> str:
    mapping = {"VIII": "Form 1", "IX": "Form 2", "X": "Form 3", "XI": "11", "XII": "12"}
    return mapping.get(str(std_val), str(std_val))
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/api/excesses", tags=["Fee Excesses"])

class ExcessDecisionSchema(BaseModel):
    excess_id: int
    decision: str  # "TRANSFER_TO_POCKET_MONEY", "APPLY_TO_FUTURE_FEES", "RETURN_TO_PARENT", "RETURN_TO_SPONSOR"
    approved_by: str = "Administrator"
    remarks: Optional[str] = None

@router.get("")
def get_fee_excesses(
    status_filter: str = "ALL",
    search: str = "",
    db: Session = Depends(get_db)
):
    query = db.query(models.FeeExcess).join(models.Student)

    sf = status_filter.upper() if status_filter else "ALL"
    if sf == "PENDING":
        query = query.filter(models.FeeExcess.status.in_([
            models.ExcessStatusEnum.UNALLOCATED,
            models.ExcessStatusEnum.EXCESS,
            models.ExcessStatusEnum.TAGGED_AS_EXCESS,
            models.ExcessStatusEnum.PENDING_VERIFICATION,
            models.ExcessStatusEnum.RETURN_TO_PARENT,
            models.ExcessStatusEnum.RETURN_TO_SPONSOR,
        ]))
    elif sf == "DONE":
        query = query.filter(models.FeeExcess.status.in_([
            models.ExcessStatusEnum.COMPLETED,
            models.ExcessStatusEnum.TRANSFERRED_TO_POCKET_MONEY,
            models.ExcessStatusEnum.APPROVED_FOR_POCKET_MONEY,
            models.ExcessStatusEnum.APPLIED_TO_FUTURE_FEES,
        ]))
    elif sf != "ALL":
        query = query.filter(models.FeeExcess.status == sf)

    excesses = query.order_by(models.FeeExcess.id.desc()).all()

    result = []
    for e in excesses:
        student = e.student
        enrollment = next((en for en in student.enrollments if en.is_current), None)
        orig_payment = db.query(models.FeePayment).filter(models.FeePayment.id == e.original_payment_id).first()

        q = search.lower().strip() if search else ""
        matches_search = (
            not q or
            student.pay_id.lower().find(q) != -1 or
            student.name.lower().find(q) != -1 or
            (student.pupil_id and student.pupil_id.lower().find(q) != -1)
        )

        if matches_search:
            result.append({
                "id": e.id,
                "student_id": student.id,
                "pay_id": student.pay_id,
                "student_name": student.name,
                "class_name": format_standard(enrollment.standard.value) if enrollment else "Form 1",
                "section": enrollment.section.value if enrollment else "E",
                "boarding_category": student.boarding_category,
                "is_sponsored": student.is_sponsored,
                "sponsor_name": e.sponsor_name or student.sponsor_name,
                "sponsor_type": e.sponsor_type or ("Govt Sponsor" if student.is_sponsored else None),
                "amount_to_return_sponsor": e.amount_to_return_sponsor or (e.excess_amount if e.status == models.ExcessStatusEnum.RETURN_TO_SPONSOR else 0.0),
                "approved_at": e.approved_at.strftime("%Y-%m-%d %H:%M:%S") if e.approved_at else None,
                "original_payment_id": e.original_payment_id,
                "payment_no": orig_payment.payment_no if orig_payment else "-",
                "amount_received": e.amount_received,
                "fees_allocated": e.fees_allocated,
                "excess_amount": e.excess_amount,
                "status": e.status,
                "decision": e.decision,
                "approved_by": e.approved_by,
                "transfer_id": e.transfer_id,
                "remarks": e.remarks,
                "created_at": e.created_at.strftime("%Y-%m-%d %H:%M:%S") if e.created_at else None
            })

    total_unallocated_excess = sum(r["excess_amount"] for r in result if r["status"] in ["UNALLOCATED", "PENDING_VERIFICATION"])

    return {
        "excesses": result,
        "total_count": len(result),
        "total_unallocated_excess": total_unallocated_excess
    }

@router.post("/decide")
def decide_fee_excess(data: ExcessDecisionSchema, db: Session = Depends(get_db)):
    excess = db.query(models.FeeExcess).filter(models.FeeExcess.id == data.excess_id).first()
    if not excess:
        raise HTTPException(status_code=404, detail=f"Fee Excess record #{data.excess_id} not found")

    student = db.query(models.Student).filter(models.Student.id == excess.student_id).first()
    orig_payment = db.query(models.FeePayment).filter(models.FeePayment.id == excess.original_payment_id).first()
    payment_no = orig_payment.payment_no if orig_payment else f"PAY-{excess.original_payment_id}"

    excess.decision = data.decision
    excess.approved_by = data.approved_by
    excess.approved_at = datetime.utcnow()
    excess.remarks = data.remarks or f"Decision '{data.decision}' recorded by {data.approved_by}"
    excess.updated_at = datetime.utcnow()

    sync_result = None

    if data.decision == "TRANSFER_TO_POCKET_MONEY":
        excess.status = models.ExcessStatusEnum.TRANSFERRED_TO_POCKET_MONEY
        if not excess.transfer_id:
            excess.transfer_id = f"FEX-2026-{excess.id:06d}"

        # Create local PocketMoneyTransaction so main system pocket money views reflect the transfer
        pm_tx = models.PocketMoneyTransaction(
            student_id=student.id,
            transaction_date=datetime.utcnow().strftime("%Y-%m-%d"),
            transaction_type=models.PocketMoneyTxTypeEnum.FEE_EXCESS_TRANSFER,
            amount=excess.excess_amount,
            source_or_recipient=f"Fee Excess (Payment #{payment_no})",
            receipt_ref=payment_no,
            remarks=f"Fee excess K{excess.excess_amount:,.0f} transferred to pocket money from {payment_no}"
        )
        db.add(pm_tx)

        db.commit()
    elif data.decision == "EXCESS" or data.decision == "TAG_AS_EXCESS":
        excess.status = models.ExcessStatusEnum.EXCESS
    elif data.decision == "APPLY_TO_FUTURE_FEES":
        excess.status = models.ExcessStatusEnum.APPLIED_TO_FUTURE_FEES
    elif data.decision == "RETURN_TO_PARENT":
        excess.status = models.ExcessStatusEnum.RETURN_TO_PARENT
    elif data.decision == "RETURN_TO_SPONSOR":
        excess.status = models.ExcessStatusEnum.RETURN_TO_SPONSOR
        excess.sponsor_name = student.sponsor_name or "Govt Sponsor"
        excess.sponsor_type = "Govt Sponsor"
        excess.amount_to_return_sponsor = excess.excess_amount
    elif data.decision == "COMPLETED" or data.decision == "MARK_COMPLETED":
        excess.status = models.ExcessStatusEnum.COMPLETED
        # Create official payout/refund transaction record in FeePayment table
        payout_no = f"PAYOUT-2026-{excess.id:06d}"
        existing_payout = db.query(models.FeePayment).filter(models.FeePayment.payment_no == payout_no).first()
        if not existing_payout:
            method = "SPONSOR_REFUND" if excess.decision == "RETURN_TO_SPONSOR" else ("PARENT_REFUND" if excess.decision == "RETURN_TO_PARENT" else "REFUND_PAYOUT")
            payout = models.FeePayment(
                payment_no=payout_no,
                student_id=excess.student_id,
                academic_year=orig_payment.academic_year if orig_payment else "2026-2027",
                payment_date=datetime.utcnow().strftime("%Y-%m-%d"),
                expected_amount=0.0,
                total_amount=excess.excess_amount,
                mismatch_amount=0.0,
                amount_to_return_sponsor=excess.excess_amount if excess.decision == "RETURN_TO_SPONSOR" else 0.0,
                payment_method=method,
                receipt_no=f"REF-{excess.id:06d}",
                recorded_by_user_id=None,
                remarks=f"Payout completed for {excess.decision or 'Excess Refund'}: K {excess.excess_amount:,.2f}. {data.remarks or excess.remarks or ''}"
            )
            db.add(payout)
    else:
        excess.status = models.ExcessStatusEnum.COMPLETED

    db.commit()
    db.refresh(excess)

    return {
        "status": "SUCCESS",
        "excess_id": excess.id,
        "excess_status": excess.status,
        "decision": excess.decision,
        "transfer_id": excess.transfer_id,
        "sync_result": sync_result
    }
