import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
from models import (
    User, RoleEnum, Student, AcademicEnrollment, FeeStructure, FeePayment,
    PaymentAllocation, PocketMoneyTransaction, SystemSettings,
    BoardingCategoryEnum, StudentStatusEnum, StandardEnum, SectionEnum,
    TermNameEnum, PocketMoneyTxTypeEnum
)
from services.fee_service import calculate_student_fee_overview
from services.pocket_money_service import calculate_pocket_money_summary
from schemas import StudentCreate, SectionEnum
from pydantic import ValidationError
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_section_standard_validation():
    # Valid XI - B
    s_valid = StudentCreate(
        admission_no="ADM-2024-9901",
        name="Arun Kumar",
        dob="2009-05-12",
        admission_year=2024,
        father_name="Kumar",
        contact_no="9876543210",
        boarding_category=BoardingCategoryEnum.HOSTEL_ORDINARY,
        standard=StandardEnum.XI,
        section=SectionEnum.B
    )
    assert s_valid.section == SectionEnum.B

    # Invalid XI - E (should raise ValidationError)
    with pytest.raises(ValidationError):
        StudentCreate(
            admission_no="ADM-2024-9902",
            name="Rahul Sharma",
            dob="2009-08-15",
            admission_year=2024,
            father_name="Sharma",
            contact_no="9876543211",
            boarding_category=BoardingCategoryEnum.DAY_SCHOLAR,
            standard=StandardEnum.XI,
            section=SectionEnum.E
        )

def test_fee_calculation_multi_term(db_session):
    student = Student(
        admission_no="ADM-2024-1001",
        name="Testing Boy",
        dob="2010-01-01",
        admission_year=2024,
        father_name="Father",
        contact_no="9999999999",
        boarding_category=BoardingCategoryEnum.HOSTEL_ORDINARY,
        status=StudentStatusEnum.ACTIVE,
        date_of_admission="2024-06-01"
    )
    db_session.add(student)
    db_session.commit()

    acad_year = "2026-2027"

    # Initial overview: 0 paid, 3 due
    overview = calculate_student_fee_overview(db_session, student, acad_year)
    assert overview.terms_paid_count == 0
    assert overview.terms_due_count == 3
    assert overview.overall_status == "No Fees Paid"
    assert overview.due_status_label == "Three Terms Due"
    assert overview.total_expected == 8400.0  # 2800 * 3
    assert overview.total_paid == 0.0
    assert overview.total_due == 8400.0

    # Record T1 and T2 together (₹5,600)
    payment = FeePayment(
        payment_no="PAY-TEST-001",
        student_id=student.id,
        academic_year=acad_year,
        payment_date="2026-06-15",
        total_amount=5600.0,
        payment_method="Cash",
        receipt_no="R-TEST-001"
    )
    db_session.add(payment)
    db_session.commit()

    db_session.add(PaymentAllocation(payment_id=payment.id, term_name=TermNameEnum.TERM_1, amount_allocated=2800.0))
    db_session.add(PaymentAllocation(payment_id=payment.id, term_name=TermNameEnum.TERM_2, amount_allocated=2800.0))
    db_session.commit()

    # Updated overview: 2 paid, 1 due
    overview2 = calculate_student_fee_overview(db_session, student, acad_year)
    assert overview2.terms_paid_count == 2
    assert overview2.terms_due_count == 1
    assert overview2.overall_status == "Two Terms Paid"
    assert overview2.due_status_label == "One Term Due"
    assert overview2.total_paid == 5600.0
    assert overview2.total_due == 2800.0

def test_pocket_money_balance_calculation(db_session):
    student = Student(
        admission_no="ADM-2024-2001",
        name="Boarder Boy",
        dob="2010-02-02",
        admission_year=2024,
        father_name="Father Boarder",
        contact_no="8888888888",
        boarding_category=BoardingCategoryEnum.HOSTEL_SPECIAL,
        status=StudentStatusEnum.ACTIVE,
        date_of_admission="2024-06-01"
    )
    db_session.add(student)
    db_session.commit()

    # Receive ₹3,000 from parent
    tx1 = PocketMoneyTransaction(
        student_id=student.id,
        transaction_date="2026-06-10",
        transaction_type=PocketMoneyTxTypeEnum.RECEIVED_FROM_PARENT,
        amount=3000.0,
        source_or_recipient="Father Boarder"
    )
    db_session.add(tx1)

    # Give ₹800 to student
    tx2 = PocketMoneyTransaction(
        student_id=student.id,
        transaction_date="2026-06-15",
        transaction_type=PocketMoneyTxTypeEnum.GIVEN_TO_STUDENT,
        amount=800.0,
        source_or_recipient=student.name
    )
    db_session.add(tx2)

    # Return ₹500 to parent
    tx3 = PocketMoneyTransaction(
        student_id=student.id,
        transaction_date="2026-06-20",
        transaction_type=PocketMoneyTxTypeEnum.RETURNED_TO_PARENT,
        amount=500.0,
        source_or_recipient="Father Boarder"
    )
    db_session.add(tx3)
    db_session.commit()

    summary = calculate_pocket_money_summary(db_session, student.id)
    assert summary.total_received == 3000.0
    assert summary.total_given == 800.0
    assert summary.total_returned == 500.0
    assert summary.current_balance == 1700.0  # 3000 - 800 - 500
