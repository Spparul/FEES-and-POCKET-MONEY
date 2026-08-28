from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Student, AcademicEnrollment, BoardingCategoryEnum, StudentStatusEnum
from schemas import StudentSchema, StudentPocketProfileData
from services.pocket_money_service import calculate_pocket_money_summary
from routers.pocket_money import get_student_pocket_transactions

router = APIRouter(prefix="/students", tags=["students"])

@router.get("", response_model=List[StudentSchema])
def get_students(
    search: Optional[str] = None,
    boarding_category: Optional[BoardingCategoryEnum] = None,
    status: Optional[StudentStatusEnum] = None,
    academic_level: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Student)

    if status:
        query = query.filter(Student.status == status)
    else:
        query = query.filter(Student.status == StudentStatusEnum.ACTIVE)

    if boarding_category:
        query = query.filter(Student.boarding_category == boarding_category)

    students = query.all()
    results = []

    for s in students:
        curr_enr = next((e for e in s.enrollments if e.is_current), None)
        level_str = curr_enr.academic_level if curr_enr else "Form 1"
        std_val = curr_enr.standard if curr_enr else None
        sec_val = curr_enr.section if curr_enr else None

        if academic_level and level_str != academic_level:
            continue

        if search:
            q = search.lower().strip()
            name_match = q in s.name.lower()
            payid_match = q in s.pay_id.lower()
            if not (name_match or payid_match):
                continue

        summary = calculate_pocket_money_summary(db, s.id)

        results.append(StudentSchema(
            id=s.id,
            pay_id=s.pay_id,
            pupil_id=s.pupil_id,
            first_name=s.first_name,
            last_name=s.last_name,
            name=s.name,
            dob=s.dob,
            admission_year=s.admission_year,
            father_name=s.father_name,
            mother_name=s.mother_name,
            contact_no=s.contact_no,
            additional_contact=s.additional_contact,
            boarding_category=s.boarding_category,
            status=s.status,
            date_of_admission=s.date_of_admission,
            academic_level=level_str,
            current_standard=std_val,
            current_section=sec_val,
            academic_year=curr_enr.academic_year if curr_enr else "2026-2027",
            is_sponsored=s.is_sponsored,
            sponsor_name=s.sponsor_name,
            current_balance=summary.current_balance
        ))

    return results

@router.get("/{student_id}", response_model=StudentPocketProfileData)
def get_student_pocket_profile(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    curr_enr = next((e for e in student.enrollments if e.is_current), None)
    summary = calculate_pocket_money_summary(db, student.id)
    transactions = get_student_pocket_transactions(student_id, db)

    student_schema = StudentSchema(
        id=student.id,
        pay_id=student.pay_id,
        pupil_id=student.pupil_id,
        first_name=student.first_name,
        last_name=student.last_name,
        name=student.name,
        dob=student.dob,
        admission_year=student.admission_year,
        father_name=student.father_name,
        mother_name=student.mother_name,
        contact_no=student.contact_no,
        additional_contact=student.additional_contact,
        boarding_category=student.boarding_category,
        status=student.status,
        date_of_admission=student.date_of_admission,
        academic_level=curr_enr.academic_level if curr_enr else "Form 1",
        current_standard=curr_enr.standard if curr_enr else None,
        current_section=curr_enr.section if curr_enr else None,
        academic_year=curr_enr.academic_year if curr_enr else "2026-2027",
        is_sponsored=student.is_sponsored,
        sponsor_name=student.sponsor_name,
        current_balance=summary.current_balance
    )

    return StudentPocketProfileData(
        student=student_schema,
        summary=summary,
        pocket_transactions=transactions
    )
