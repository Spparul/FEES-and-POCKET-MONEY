from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models

def format_standard(std_val: str) -> str:
    mapping = {"VIII": "Form 1", "IX": "Form 2", "X": "Form 3", "XI": "11", "XII": "12"}
    return mapping.get(str(std_val), str(std_val))

router = APIRouter(prefix="/api/verification", tags=["Payment Verification"])

@router.get("/pending")
def get_pending_verifications(db: Session = Depends(get_db)):
    pending_excesses = db.query(models.FeeExcess).filter(
        models.FeeExcess.status == models.ExcessStatusEnum.PENDING_VERIFICATION
    ).all()

    result = []
    for e in pending_excesses:
        student = e.student
        enrollment = next((en for en in student.enrollments if en.is_current), None)
        orig_payment = db.query(models.FeePayment).filter(models.FeePayment.id == e.original_payment_id).first()

        result.append({
            "excess_id": e.id,
            "student_id": student.id,
            "pay_id": student.pay_id,
            "student_name": student.name,
            "class_name": format_standard(enrollment.standard.value) if enrollment else "Form 1",
            "section": enrollment.section.value if enrollment else "E",
            "boarding_category": student.boarding_category,
            "is_sponsored": student.is_sponsored,
            "sponsor_name": student.sponsor_name,
            "payment_no": orig_payment.payment_no if orig_payment else "-",
            "payment_date": orig_payment.payment_date if orig_payment else "-",
            "amount_received": e.amount_received,
            "fees_allocated": e.fees_allocated,
            "unallocated_excess": e.excess_amount,
            "status": e.status,
            "reason_for_review": "SPONSORED STUDENT PAYMENT MISMATCH" if student.is_sponsored else "AMBIGUOUS EXCESS PAYMENT",
            "created_at": e.created_at.strftime("%Y-%m-%d %H:%M:%S") if e.created_at else None
        })

    return {
        "pending_verifications": result,
        "total_count": len(result)
    }
