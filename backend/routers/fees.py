from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import (
    Student, FeePayment, PaymentAllocation, FeeStructure,
    TermNameEnum, AuditLog, FeeExcess, FeeDeficit
)
from schemas import PaymentRecordRequest, FeePaymentSchema, StudentFeeOverview
from services.fee_service import get_or_create_fee_structure, calculate_student_fee_overview
from services.fee_allocation_engine import calculate_payment_allocation_preview, process_interactive_fee_payment
from pydantic import BaseModel
from typing import Optional
import uuid

router = APIRouter(prefix="/fees", tags=["fees"])

class InteractivePreviewRequest(BaseModel):
    student_id: int
    amount_received: float
    selected_term_names: List[str]
    academic_year: str = "2026-2027"

class InteractivePaymentRequest(BaseModel):
    student_id: int
    amount_received: float
    selected_term_names: List[str]
    payment_date: str
    payment_method: str = "CASH"
    receipt_no: Optional[str] = None
    remarks: Optional[str] = None
    user_id: Optional[int] = None
    academic_year: str = "2026-2027"
    excess_action: Optional[str] = None

@router.post("/payments/preview")
def preview_payment_allocation(req: InteractivePreviewRequest, db: Session = Depends(get_db)):
    try:
        preview = calculate_payment_allocation_preview(
            db=db,
            student_id=req.student_id,
            amount_received=req.amount_received,
            selected_term_names=req.selected_term_names,
            academic_year=req.academic_year
        )
        return preview
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/payments/interactive")
def record_interactive_payment(req: InteractivePaymentRequest, db: Session = Depends(get_db)):
    try:
        payment = process_interactive_fee_payment(
            db=db,
            student_id=req.student_id,
            amount_received=req.amount_received,
            selected_term_names=req.selected_term_names,
            payment_date=req.payment_date,
            payment_method=req.payment_method,
            receipt_no=req.receipt_no,
            remarks=req.remarks,
            user_id=req.user_id,
            academic_year=req.academic_year,
            excess_action=req.excess_action
        )
        return {
            "status": "SUCCESS",
            "payment_id": payment.id,
            "payment_no": payment.payment_no,
            "total_amount": payment.total_amount,
            "receipt_no": payment.receipt_no
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/payments", response_model=FeePaymentSchema)
def record_fee_payment(req: PaymentRecordRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if not req.terms_covered:
        raise HTTPException(status_code=400, detail="At least one term must be selected for payment.")

    # Prevent duplicate payment for already paid terms
    fee_overview = calculate_student_fee_overview(db, student, req.academic_year)
    for term_detail in fee_overview.term_details:
        try:
            term_enum_val = TermNameEnum(term_detail.term_name)
            if term_enum_val in req.terms_covered and term_detail.status == "Paid":
                raise HTTPException(
                    status_code=400,
                    detail=f"{term_detail.term_name} has already been fully paid for {student.name}. Cannot record duplicate payment for an already paid term."
                )
        except ValueError:
            pass

    structure = get_or_create_fee_structure(db, req.academic_year, student.boarding_category)

    expected_amounts = {
        TermNameEnum.TERM_1: structure.term_1_amount,
        TermNameEnum.TERM_2: structure.term_2_amount,
        TermNameEnum.TERM_3: structure.term_3_amount,
    }

    # Calculate expected total amount for selected terms
    expected_total = sum(expected_amounts[term] for term in req.terms_covered)
    total_amount = req.total_amount if (req.total_amount is not None and req.total_amount > 0) else expected_total

    # Calculate mismatch (excess or deficit) and sponsor return amount
    mismatch_amount = total_amount - expected_total
    amount_to_return_sponsor = mismatch_amount if (mismatch_amount > 0 and student.is_sponsored) else 0.0

    payment_no = f"PAY-{uuid.uuid4().hex[:8].upper()}"

    payment = FeePayment(
        payment_no=payment_no,
        student_id=student.id,
        academic_year=req.academic_year,
        payment_date=req.payment_date,
        expected_amount=expected_total,
        total_amount=total_amount,
        mismatch_amount=mismatch_amount,
        amount_to_return_sponsor=amount_to_return_sponsor,
        payment_method=req.payment_method,
        receipt_no=req.receipt_no,
        remarks=req.remarks
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    # Create allocations
    for term in req.terms_covered:
        alloc = PaymentAllocation(
            fee_payment_id=payment.id,
            term_name=term,
            allocated_amount=expected_amounts[term]
        )
        db.add(alloc)

    # Audit log
    terms_str = " + ".join([t.value for t in req.terms_covered])
    mismatch_note = f" (Mismatch: ₹{mismatch_amount:,.2f})" if mismatch_amount != 0 else ""
    db.add(AuditLog(
        action="RECORD_FEE_PAYMENT",
        entity_type="FeePayment",
        entity_id=req.receipt_no,
        details=f"Recorded ₹{total_amount:,.2f} for {student.name} ({terms_str}){mismatch_note}"
    ))
    db.commit()

    current_enr = next((e for e in student.enrollments if e.is_current), None)

    return FeePaymentSchema(
        id=payment.id,
        payment_no=payment.payment_no,
        student_id=payment.student_id,
        student_name=student.name,
        pay_id=student.pay_id,
        academic_level=current_enr.academic_level if current_enr else "Form 1",
        standard=current_enr.standard.value if (current_enr and current_enr.standard) else None,
        section=current_enr.section.value if (current_enr and current_enr.section) else None,
        boarding_category=student.boarding_category.value if student.boarding_category else None,
        is_sponsored=student.is_sponsored,
        sponsor_name=student.sponsor_name,
        academic_year=payment.academic_year,
        payment_date=payment.payment_date,
        expected_amount=payment.expected_amount,
        total_amount=payment.total_amount,
        mismatch_amount=payment.mismatch_amount,
        amount_to_return_sponsor=payment.amount_to_return_sponsor,
        payment_method=payment.payment_method,
        receipt_no=payment.receipt_no,
        remarks=payment.remarks,
        terms_covered=[t.value for t in req.terms_covered]
    )

@router.get("/transactions", response_model=List[FeePaymentSchema])
def get_all_transactions(db: Session = Depends(get_db)):
    payments = db.query(FeePayment).order_by(FeePayment.payment_date.desc(), FeePayment.id.desc()).all()
    results = []
    for p in payments:
        student = db.query(Student).filter(Student.id == p.student_id).first()
        terms_covered = [alloc.term_name.value for alloc in p.allocations]
        allocs_map = {alloc.term_name.value: alloc.allocated_amount for alloc in p.allocations}
        
        excess = db.query(FeeExcess).filter(FeeExcess.original_payment_id == p.id).first()
        cleared_defics = db.query(FeeDeficit).filter(FeeDeficit.cleared_by_payment_id == p.id).all()
        cleared_sum = sum(d.allocated_amount for d in cleared_defics)

        curr_enrollment = None
        if student:
            curr_enrollment = student.enrollments[0] if student.enrollments else None

        results.append(FeePaymentSchema(
            id=p.id,
            payment_no=p.payment_no,
            student_id=p.student_id,
            student_name=student.name if student else "Unknown",
            pay_id=student.pay_id if student else "",
            academic_level=curr_enrollment.academic_level if curr_enrollment else "",
            standard=curr_enrollment.standard.value if curr_enrollment and curr_enrollment.standard else "",
            section=curr_enrollment.section.value if curr_enrollment and curr_enrollment.section else "",
            boarding_category=student.boarding_category.value if student and student.boarding_category else "",
            is_sponsored=student.is_sponsored if student else False,
            sponsor_name=student.sponsor_name if student else None,
            academic_year=p.academic_year,
            payment_date=p.payment_date,
            total_amount=p.total_amount,
            expected_amount=p.expected_amount,
            mismatch_amount=p.mismatch_amount,
            amount_to_return_sponsor=p.amount_to_return_sponsor,
            payment_method=p.payment_method,
            receipt_no=p.receipt_no,
            recorded_by_user_id=p.recorded_by_user_id,
            remarks=p.remarks,
            terms_covered=terms_covered,
            allocations_breakdown=allocs_map,
            deficit_cleared=cleared_sum,
            fee_excess_amount=excess.excess_amount if excess else 0.0,
            excess_decision=excess.decision if excess else None,
            excess_status=excess.status.value if excess and excess.status else None,
            sponsor_return_amount=(excess.amount_to_return_sponsor or 0.0) if excess else 0.0,
            pocket_money_tx_id=excess.transfer_id if excess else None
        ))
    return results

@router.get("/payments/student/{student_id}", response_model=List[FeePaymentSchema])
def get_student_payments(student_id: int, db: Session = Depends(get_db)):
    payments = db.query(FeePayment).filter(
        FeePayment.student_id == student_id
    ).order_by(FeePayment.payment_date.desc(), FeePayment.id.desc()).all()

    student = db.query(Student).filter(Student.id == student_id).first()
    curr_enrollment = student.enrollments[0] if (student and student.enrollments) else None

    results = []
    for p in payments:
        terms_covered = [alloc.term_name.value for alloc in p.allocations]
        allocs_map = {alloc.term_name.value: alloc.allocated_amount for alloc in p.allocations}
        excess = db.query(FeeExcess).filter(FeeExcess.original_payment_id == p.id).first()
        cleared_defics = db.query(FeeDeficit).filter(FeeDeficit.cleared_by_payment_id == p.id).all()
        cleared_sum = sum(d.allocated_amount for d in cleared_defics)

        results.append(FeePaymentSchema(
            id=p.id,
            payment_no=p.payment_no,
            student_id=p.student_id,
            student_name=student.name if student else "Unknown",
            pay_id=student.pay_id if student else "",
            academic_level=curr_enrollment.academic_level if curr_enrollment else "",
            standard=curr_enrollment.standard.value if curr_enrollment and curr_enrollment.standard else "",
            section=curr_enrollment.section.value if curr_enrollment and curr_enrollment.section else "",
            boarding_category=student.boarding_category.value if student and student.boarding_category else "",
            is_sponsored=student.is_sponsored if student else False,
            sponsor_name=student.sponsor_name if student else None,
            academic_year=p.academic_year,
            payment_date=p.payment_date,
            total_amount=p.total_amount,
            expected_amount=p.expected_amount,
            mismatch_amount=p.mismatch_amount,
            amount_to_return_sponsor=p.amount_to_return_sponsor,
            payment_method=p.payment_method,
            receipt_no=p.receipt_no,
            recorded_by_user_id=p.recorded_by_user_id,
            remarks=p.remarks,
            terms_covered=terms_covered,
            allocations_breakdown=allocs_map,
            deficit_cleared=cleared_sum,
            fee_excess_amount=excess.excess_amount if excess else 0.0,
            excess_decision=excess.decision if excess else None,
            excess_status=excess.status.value if excess and excess.status else None,
            sponsor_return_amount=(excess.amount_to_return_sponsor or 0.0) if excess else 0.0,
            pocket_money_tx_id=excess.transfer_id if excess else None
        ))
    return results

@router.delete("/payments/{payment_id}")
def delete_fee_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(FeePayment).filter(FeePayment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Fee payment transaction not found")
    
    db.delete(payment)
    db.commit()
    return {"message": "Fee payment transaction deleted successfully"}
