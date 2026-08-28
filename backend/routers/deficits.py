from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models

def format_standard(std_val: str) -> str:
    mapping = {"VIII": "Form 1", "IX": "Form 2", "X": "Form 3", "XI": "11", "XII": "12"}
    return mapping.get(str(std_val), str(std_val))

router = APIRouter(prefix="/api/deficits", tags=["Fee Deficits"])

@router.get("")
def get_fee_deficits(
    status_filter: str = "OUTSTANDING",
    search: str = "",
    db: Session = Depends(get_db)
):
    query = db.query(models.FeeDeficit).join(models.Student)

    if status_filter and status_filter.upper() != "ALL":
        if status_filter.upper() == "OUTSTANDING":
            query = query.filter(models.FeeDeficit.status.in_([models.DeficitStatusEnum.OUTSTANDING, models.DeficitStatusEnum.PARTIALLY_CLEARED]))
        else:
            query = query.filter(models.FeeDeficit.status == status_filter.upper())

    deficits = query.order_by(models.FeeDeficit.id.desc()).all()

    result = []
    for d in deficits:
        student = d.student
        enrollment = next((e for e in student.enrollments if e.is_current), None)
        
        q = search.lower().strip() if search else ""
        matches_search = (
            not q or
            student.pay_id.lower().find(q) != -1 or
            student.name.lower().find(q) != -1 or
            (student.pupil_id and student.pupil_id.lower().find(q) != -1)
        )

        if matches_search:
            result.append({
                "id": d.id,
                "student_id": student.id,
                "pay_id": student.pay_id,
                "student_name": student.name,
                "class_name": format_standard(enrollment.standard.value) if enrollment else "Form 1",
                "section": enrollment.section.value if enrollment else "E",
                "boarding_category": student.boarding_category,
                "is_sponsored": student.is_sponsored,
                "sponsor_name": student.sponsor_name,
                "academic_year": d.academic_year,
                "term_name": d.term_name,
                "expected_amount": d.expected_amount,
                "allocated_amount": d.allocated_amount,
                "deficit_amount": d.deficit_amount,
                "status": d.status,
                "created_at": d.created_at.strftime("%Y-%m-%d %H:%M:%S") if d.created_at else None
            })

    total_outstanding_deficit = sum(r["deficit_amount"] for r in result if r["status"] == "OUTSTANDING")

    return {
        "deficits": result,
        "total_count": len(result),
        "total_outstanding_deficit": total_outstanding_deficit
    }

@router.get("/summary")
def get_deficits_summary(db: Session = Depends(get_db)):
    deficits = db.query(models.FeeDeficit).filter(
        models.FeeDeficit.status == models.DeficitStatusEnum.OUTSTANDING
    ).all()

    student_ids = set(d.student_id for d in deficits)
    total_amount = sum(d.deficit_amount for d in deficits)

    return {
        "outstanding_students_count": len(student_ids),
        "total_records_count": len(deficits),
        "total_outstanding_deficit": total_amount
    }
