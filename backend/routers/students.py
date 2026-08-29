from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import (
    Student, AcademicEnrollment, SystemSettings, StudentStatusEnum,
    BoardingCategoryEnum, StandardEnum, SectionEnum, User, RoleEnum, AuditLog,
    FeePayment, PocketMoneyTransaction
)
from schemas import (
    StudentCreate, StudentUpdate, StudentResponse, StudentFeeOverview,
    PocketMoneySummary, AcademicEnrollmentSchema, FeePaymentSchema, PocketMoneyTxSchema
)
from services.fee_service import calculate_student_fee_overview
from services.pocket_money_service import calculate_pocket_money_summary
from routers.auth import verify_password
from datetime import datetime

router = APIRouter(prefix="/students", tags=["students"])

def is_lock_active(db: Session) -> bool:
    setting = db.query(SystemSettings).filter(SystemSettings.setting_key == "is_register_locked").first()
    return setting.setting_value.lower() == "true" if setting else False

def get_current_academic_year(db: Session) -> str:
    setting = db.query(SystemSettings).filter(SystemSettings.setting_key == "active_academic_year").first()
    return setting.setting_value if setting else "2026-2027"

def check_admin_authorization_if_locked(db: Session, admin_password: Optional[str]):
    if is_lock_active(db):
        if not admin_password:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Student Register is locked. Administrator authentication is required to make structural changes."
            )
        admin_users = db.query(User).filter(User.role == RoleEnum.ADMIN).all()
        verified = any(verify_password(admin_password, u.password_hash) for u in admin_users)
        if not verified:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid administrator password. Access denied."
            )

@router.get("", response_model=List[StudentResponse])
def get_students(
    standard: Optional[StandardEnum] = None,
    section: Optional[SectionEnum] = None,
    academic_level: Optional[str] = None,
    boarding_category: Optional[BoardingCategoryEnum] = None,
    admission_year: Optional[int] = None,
    is_sponsored: Optional[bool] = None,
    sponsor_type: Optional[str] = None,
    sponsor_name: Optional[str] = None,
    fee_status: Optional[str] = None,
    term: Optional[str] = None,
    search: Optional[str] = None,
    status: Optional[str] = None,
    include_inactive: bool = False,
    db: Session = Depends(get_db)
):
    acad_year = get_current_academic_year(db)
    query = db.query(Student)

    if status and status != 'ALL':
        query = query.filter(Student.status == status)
    elif not status:
        query = query.filter(Student.status == StudentStatusEnum.ACTIVE)

    if boarding_category:
        query = query.filter(Student.boarding_category == boarding_category)

    if admission_year:
        query = query.filter(Student.admission_year == admission_year)

    if is_sponsored is not None:
        b_val = is_sponsored.lower() == "true" if isinstance(is_sponsored, str) else bool(is_sponsored)
        query = query.filter(Student.is_sponsored == b_val)

    if sponsor_type:
        query = query.filter(Student.sponsor_type == sponsor_type)

    if sponsor_name:
        query = query.filter(Student.sponsor_name == sponsor_name)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (Student.name.ilike(search_pattern)) | 
            (Student.pay_id.ilike(search_pattern)) |
            (Student.admission_no.ilike(search_pattern)) |
            (Student.first_name.ilike(search_pattern)) |
            (Student.last_name.ilike(search_pattern))
        )

    students = query.all()
    results = []

    for s in students:
        # Get current enrollment
        curr_enrollment = db.query(AcademicEnrollment).filter(
            AcademicEnrollment.student_id == s.id,
            AcademicEnrollment.is_current == True
        ).first()

        # Apply academic_level, standard & section filters
        if academic_level and (not curr_enrollment or curr_enrollment.academic_level != academic_level):
            continue
        if standard and (not curr_enrollment or curr_enrollment.standard != standard):
            continue
        if section and (not curr_enrollment or curr_enrollment.section != section):
            continue

        fee_overview = calculate_student_fee_overview(db, s, acad_year)

        # Apply fee_status filter
        if fee_status:
            # Matches overall_status ("Fully Paid", "Two Terms Paid", etc.) or due_status_label ("One Term Due", etc.)
            status_match = (
                fee_overview.overall_status.lower() == fee_status.lower() or
                fee_overview.due_status_label.lower() == fee_status.lower()
            )
            if not status_match:
                continue

        # Apply term filter (e.g., "Term 1", "Term 2 Paid", "Term 3 Due")
        if term:
            term_matches = False
            term_lower = term.lower()
            for td in fee_overview.term_details:
                if term_lower in td.term_name.lower():
                    if "paid" in term_lower and td.status.lower() == "paid":
                        term_matches = True
                    elif "due" in term_lower and td.status.lower() == "due":
                        term_matches = True
                    elif term_lower == td.term_name.lower():
                        term_matches = True
            if not term_matches:
                continue

        pocket_summary = calculate_pocket_money_summary(db, s.id)

        history = db.query(AcademicEnrollment).filter(
            AcademicEnrollment.student_id == s.id
        ).order_by(AcademicEnrollment.academic_year.desc()).all()

        results.append(StudentResponse(
            id=s.id,
            admission_no=s.admission_no,
            pay_id=s.pay_id,
            pupil_id=s.pupil_id,
            first_name=s.first_name,
            last_name=s.last_name,
            name=s.name,
            dob=s.dob,
            admission_year=s.admission_year,
            father_name=s.father_name,
            contact_no=s.contact_no,
            additional_contact=s.additional_contact,
            boarding_category=s.boarding_category,
            status=s.status,
            date_of_admission=s.date_of_admission,
            academic_level=curr_enrollment.academic_level if curr_enrollment else "Form 1",
            current_standard=curr_enrollment.standard if curr_enrollment else None,
            current_section=curr_enrollment.section if curr_enrollment else None,
            academic_year=curr_enrollment.academic_year if curr_enrollment else acad_year,
            is_sponsored=s.is_sponsored,
            sponsor_type=s.sponsor_type,
            sponsor_name=s.sponsor_name,
            scholarship_type=s.scholarship_type,
            has_mismatch=s.has_mismatch,
            mismatch_amount=s.mismatch_amount,
            amount_to_return_sponsor=s.amount_to_return_sponsor,
            fee_overview=fee_overview,
            pocket_money=pocket_summary,
            enrollment_history=history
        ))

    return results

@router.get("/{student_id}")
def get_student_profile(student_id: int, db: Session = Depends(get_db)):
    s = db.query(Student).filter(Student.id == student_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Student not found")

    acad_year = get_current_academic_year(db)
    curr_enrollment = db.query(AcademicEnrollment).filter(
        AcademicEnrollment.student_id == s.id,
        AcademicEnrollment.is_current == True
    ).first()

    fee_overview = calculate_student_fee_overview(db, s, acad_year)
    pocket_summary = calculate_pocket_money_summary(db, s.id)

    # Payments history
    payments = db.query(FeePayment).filter(
        FeePayment.student_id == s.id
    ).order_by(FeePayment.payment_date.desc()).all()

    payment_history = []
    for p in payments:
        terms_covered = [alloc.term_name.value for alloc in p.allocations]
        payment_history.append({
            "id": p.id,
            "payment_no": p.payment_no,
            "academic_year": p.academic_year,
            "payment_date": p.payment_date,
            "total_amount": p.total_amount,
            "payment_method": p.payment_method,
            "receipt_no": p.receipt_no,
            "remarks": p.remarks,
            "terms_covered": terms_covered
        })

    # Pocket money transactions
    pocket_txs = db.query(PocketMoneyTransaction).filter(
        PocketMoneyTransaction.student_id == s.id
    ).order_by(PocketMoneyTransaction.transaction_date.desc()).all()

    history = db.query(AcademicEnrollment).filter(
        AcademicEnrollment.student_id == s.id
    ).order_by(AcademicEnrollment.academic_year.desc()).all()

    return {
        "student": StudentResponse(
            id=s.id,
            admission_no=s.admission_no,
            pay_id=s.pay_id,
            pupil_id=s.pupil_id,
            first_name=s.first_name,
            last_name=s.last_name,
            name=s.name,
            dob=s.dob,
            admission_year=s.admission_year,
            father_name=s.father_name,
            contact_no=s.contact_no,
            additional_contact=s.additional_contact,
            boarding_category=s.boarding_category,
            status=s.status,
            date_of_admission=s.date_of_admission,
            academic_level=curr_enrollment.academic_level if curr_enrollment else "Form 1",
            current_standard=curr_enrollment.standard if curr_enrollment else None,
            current_section=curr_enrollment.section if curr_enrollment else None,
            academic_year=curr_enrollment.academic_year if curr_enrollment else acad_year,
            is_sponsored=s.is_sponsored,
            sponsor_type=s.sponsor_type,
            sponsor_name=s.sponsor_name,
            scholarship_type=s.scholarship_type,
            has_mismatch=s.has_mismatch,
            mismatch_amount=s.mismatch_amount,
            amount_to_return_sponsor=s.amount_to_return_sponsor,
            fee_overview=fee_overview,
            pocket_money=pocket_summary,
            enrollment_history=history
        ),
        "payment_history": payment_history,
        "pocket_transactions": [
            {
                "id": t.id,
                "transaction_date": t.transaction_date,
                "transaction_type": t.transaction_type,
                "amount": t.amount,
                "source_or_recipient": t.source_or_recipient,
                "receipt_ref": t.receipt_ref,
                "remarks": t.remarks
            } for t in pocket_txs
        ]
    }

@router.post("", response_model=StudentResponse)
def create_student(
    student_in: StudentCreate,
    admin_password: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    check_admin_authorization_if_locked(db, admin_password)

    # Check duplicate admission_no
    existing = db.query(Student).filter(Student.admission_no == student_in.admission_no).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Admission Number '{student_in.admission_no}' already exists in the system."
        )

    acad_year = get_current_academic_year(db)
    doa = student_in.date_of_admission or datetime.now().strftime("%Y-%m-%d")

    student = Student(
        admission_no=student_in.admission_no,
        name=student_in.name,
        dob=student_in.dob,
        admission_year=student_in.admission_year,
        father_name=student_in.father_name,
        contact_no=student_in.contact_no,
        additional_contact=student_in.additional_contact,
        address=student_in.address,
        boarding_category=student_in.boarding_category,
        status=StudentStatusEnum.ACTIVE,
        date_of_admission=doa
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    enrollment = AcademicEnrollment(
        student_id=student.id,
        academic_year=acad_year,
        standard=student_in.standard,
        section=student_in.section,
        is_current=True
    )
    db.add(enrollment)

    # Audit log
    db.add(AuditLog(
        action="CREATE_STUDENT",
        entity_type="Student",
        entity_id=student.admission_no,
        details=f"Added student {student.name} ({student_in.standard}-{student_in.section})"
    ))
    db.commit()

    fee_overview = calculate_student_fee_overview(db, student, acad_year)
    pocket_summary = calculate_pocket_money_summary(db, student.id)

    return StudentResponse(
        id=student.id,
        admission_no=student.admission_no,
        name=student.name,
        dob=student.dob,
        admission_year=student.admission_year,
        father_name=student.father_name,
        contact_no=student.contact_no,
        additional_contact=student.additional_contact,
        boarding_category=student.boarding_category,
        status=student.status,
        date_of_admission=student.date_of_admission,
        current_standard=student_in.standard,
        current_section=student_in.section,
        academic_year=acad_year,
        fee_overview=fee_overview,
        pocket_money=pocket_summary,
        enrollment_history=[enrollment]
    )

@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    student_in: StudentUpdate,
    admin_password: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    check_admin_authorization_if_locked(db, admin_password)

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    acad_year = get_current_academic_year(db)

    if student_in.name is not None:
        student.name = student_in.name
    if student_in.dob is not None:
        student.dob = student_in.dob
    if student_in.father_name is not None:
        student.father_name = student_in.father_name
    if student_in.mother_name is not None:
        student.mother_name = student_in.mother_name
    if student_in.contact_no is not None:
        student.contact_no = student_in.contact_no
    if student_in.additional_contact is not None:
        student.additional_contact = student_in.additional_contact
    if student_in.address is not None:
        student.address = student_in.address
    if student_in.city is not None:
        student.city = student_in.city
    if student_in.state is not None:
        student.state = student_in.state
    if student_in.pincode is not None:
        student.pincode = student_in.pincode
    if student_in.boarding_category is not None:
        student.boarding_category = student_in.boarding_category
    if student_in.status is not None:
        student.status = student_in.status

    curr_enrollment = db.query(AcademicEnrollment).filter(
        AcademicEnrollment.student_id == student.id,
        AcademicEnrollment.is_current == True
    ).first()

    if student_in.standard or student_in.section:
        new_standard = student_in.standard or (curr_enrollment.standard if curr_enrollment else StandardEnum.VIII)
        new_section = student_in.section or (curr_enrollment.section if curr_enrollment else SectionEnum.E)

        # Validate section for standard
        valid_sections_8_9 = [SectionEnum.E, SectionEnum.EE, SectionEnum.G, SectionEnum.GG]
        valid_sections_10_12 = [SectionEnum.A, SectionEnum.B, SectionEnum.S]

        if new_standard in [StandardEnum.VIII, StandardEnum.IX]:
            if new_section not in valid_sections_8_9:
                raise HTTPException(
                    status_code=400,
                    detail=f"Standard {new_standard.value} can only have sections E, EE, G, or GG"
                )
        elif new_standard in [StandardEnum.X, StandardEnum.XI, StandardEnum.XII]:
            if new_section not in valid_sections_10_12:
                raise HTTPException(
                    status_code=400,
                    detail=f"Standard {new_standard.value} can only have sections A, B, or S"
                )

        if curr_enrollment:
            curr_enrollment.standard = new_standard
            curr_enrollment.section = new_section
        else:
            curr_enrollment = AcademicEnrollment(
                student_id=student.id,
                academic_year=acad_year,
                standard=new_standard,
                section=new_section,
                is_current=True
            )
            db.add(curr_enrollment)

    db.add(AuditLog(
        action="UPDATE_STUDENT",
        entity_type="Student",
        entity_id=student.admission_no,
        details=f"Updated student profile for {student.name}"
    ))
    db.commit()
    db.refresh(student)


    fee_overview = calculate_student_fee_overview(db, student, acad_year)
    pocket_summary = calculate_pocket_money_summary(db, student.id)
    history = db.query(AcademicEnrollment).filter(
        AcademicEnrollment.student_id == student.id
    ).order_by(AcademicEnrollment.academic_year.desc()).all()

    return StudentResponse(
        id=student.id,
        admission_no=student.admission_no,
        name=student.name,
        dob=student.dob,
        admission_year=student.admission_year,
        father_name=student.father_name,
        contact_no=student.contact_no,
        additional_contact=student.additional_contact,
        boarding_category=student.boarding_category,
        status=student.status,
        date_of_admission=student.date_of_admission,
        current_standard=curr_enrollment.standard if curr_enrollment else None,
        current_section=curr_enrollment.section if curr_enrollment else None,
        academic_year=curr_enrollment.academic_year if curr_enrollment else acad_year,
        fee_overview=fee_overview,
        pocket_money=pocket_summary,
        enrollment_history=history
    )

@router.delete("/{student_id}")
def mark_student_status(
    student_id: int,
    status_target: StudentStatusEnum = Query(StudentStatusEnum.TRANSFERRED),
    admin_password: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    check_admin_authorization_if_locked(db, admin_password)

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student.status = status_target
    db.add(AuditLog(
        action="STATUS_CHANGE",
        entity_type="Student",
        entity_id=student.admission_no,
        details=f"Changed status of {student.name} to {status_target.value}"
    ))
    db.commit()
    return {"status": "success", "message": f"Student status changed to {status_target.value}"}
