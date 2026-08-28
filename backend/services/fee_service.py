from sqlalchemy.orm import Session
from models import (
    Student, FeePayment, PaymentAllocation, FeeStructure,
    BoardingCategoryEnum, TermNameEnum
)
from schemas import StudentFeeOverview, TermFeeSummary
from typing import Dict, List, Tuple

DEFAULT_FEES = {
    BoardingCategoryEnum.DAY_SCHOLAR: 1500.0,
    BoardingCategoryEnum.HOSTEL_ORDINARY: 2800.0,
    BoardingCategoryEnum.HOSTEL_SPECIAL: 4400.0
}

def get_or_create_fee_structure(db: Session, academic_year: str, category: BoardingCategoryEnum) -> FeeStructure:
    structure = db.query(FeeStructure).filter(
        FeeStructure.academic_year == academic_year,
        FeeStructure.boarding_category == category
    ).first()

    if not structure:
        default_rate = DEFAULT_FEES.get(category, 1500.0)
        structure = FeeStructure(
            academic_year=academic_year,
            boarding_category=category,
            term_1_amount=default_rate,
            term_2_amount=default_rate,
            term_3_amount=default_rate
        )
        db.add(structure)
        db.commit()
        db.refresh(structure)

    return structure

def calculate_student_fee_overview(db: Session, student: Student, academic_year: str) -> StudentFeeOverview:
    structure = get_or_create_fee_structure(db, academic_year, student.boarding_category)

    expected_amounts = {
        TermNameEnum.TERM_1: structure.term_1_amount,
        TermNameEnum.TERM_2: structure.term_2_amount,
        TermNameEnum.TERM_3: structure.term_3_amount,
    }

    # Fetch all payments for student in academic_year
    payments = db.query(FeePayment).filter(
        FeePayment.student_id == student.id,
        FeePayment.academic_year == academic_year
    ).order_by(FeePayment.payment_date.asc()).all()

    # Track allocated amounts and payment dates per term
    term_allocated: Dict[TermNameEnum, float] = {t: 0.0 for t in TermNameEnum}
    term_payment_dates: Dict[TermNameEnum, str] = {t: "" for t in TermNameEnum}

    for p in payments:
        for alloc in p.allocations:
            term_enum = alloc.term_name
            term_allocated[term_enum] += alloc.allocated_amount
            term_payment_dates[term_enum] = p.payment_date

    term_details: List[TermFeeSummary] = []
    paid_count = 0

    for term_enum in [TermNameEnum.TERM_1, TermNameEnum.TERM_2, TermNameEnum.TERM_3]:
        exp = expected_amounts[term_enum]
        paid = term_allocated[term_enum]
        due = max(0.0, exp - paid)
        status = "Paid" if paid >= exp else ("Partial" if paid > 0 else "Due")
        if status == "Paid":
            paid_count += 1

        term_details.append(TermFeeSummary(
            term_name=term_enum.value,
            expected_amount=exp,
            paid_amount=paid,
            due_amount=due,
            payment_date=term_payment_dates[term_enum] if status == "Paid" else None,
            status=status
        ))

    due_count = 3 - paid_count
    total_expected = sum(expected_amounts.values())
    total_paid = sum(term_allocated.values())
    total_due = max(0.0, total_expected - total_paid)

    if paid_count == 3:
        overall_status = "Fully Paid"
    elif paid_count == 2:
        overall_status = "Two Terms Paid"
    elif paid_count == 1:
        overall_status = "One Term Paid"
    else:
        overall_status = "No Fees Paid"

    if due_count == 0:
        due_status_label = "Fully Paid"
    elif due_count == 1:
        due_status_label = "One Term Due"
    elif due_count == 2:
        due_status_label = "Two Terms Due"
    else:
        due_status_label = "Three Terms Due"

    return StudentFeeOverview(
        terms_paid_count=paid_count,
        terms_due_count=due_count,
        total_expected=total_expected,
        total_paid=total_paid,
        total_due=total_due,
        overall_status=overall_status,
        due_status_label=due_status_label,
        term_details=term_details
    )
