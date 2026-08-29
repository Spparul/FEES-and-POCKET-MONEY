from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Text
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

class BoardingCategoryEnum(str, enum.Enum):
    DAY_SCHOLAR = "DAY_SCHOLAR"
    HOSTEL_ORDINARY = "HOSTEL_ORDINARY"
    HOSTEL_SPECIAL = "HOSTEL_SPECIAL"

class StudentStatusEnum(str, enum.Enum):
    ACTIVE = "ACTIVE"
    TRANSFERRED = "TRANSFERRED"
    FINISHED = "FINISHED"

class StandardEnum(str, enum.Enum):
    VIII = "VIII"
    IX = "IX"
    X = "X"
    XI = "XI"
    XII = "XII"

class SectionEnum(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    E = "E"
    EE = "EE"
    F = "F"
    G = "G"
    GG = "GG"
    S = "S"

class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    OFFICE_STAFF = "OFFICE_STAFF"

class SponsorTypeEnum(str, enum.Enum):
    GOVERNMENT = "GOVERNMENT"
    PRIVATE = "PRIVATE"

class ScholarshipTypeEnum(str, enum.Enum):
    NONE = "NONE"
    GOVERNMENT = "GOVERNMENT"
    PRIVATE = "PRIVATE"

class TermNameEnum(str, enum.Enum):
    TERM_1 = "Term 1"
    TERM_2 = "Term 2"
    TERM_3 = "Term 3"

class DeficitStatusEnum(str, enum.Enum):
    OUTSTANDING = "OUTSTANDING"
    PARTIALLY_CLEARED = "PARTIALLY_CLEARED"
    CLEARED = "CLEARED"

class ExcessStatusEnum(str, enum.Enum):
    UNALLOCATED = "UNALLOCATED"
    EXCESS = "EXCESS"
    TAGGED_AS_EXCESS = "TAGGED_AS_EXCESS"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    APPROVED_FOR_POCKET_MONEY = "APPROVED_FOR_POCKET_MONEY"
    TRANSFERRED_TO_POCKET_MONEY = "TRANSFERRED_TO_POCKET_MONEY"
    APPLIED_TO_FUTURE_FEES = "APPLIED_TO_FUTURE_FEES"
    RETURN_TO_PARENT = "RETURN_TO_PARENT"
    RETURN_TO_SPONSOR = "RETURN_TO_SPONSOR"
    COMPLETED = "COMPLETED"

class PocketMoneyTxTypeEnum(str, enum.Enum):
    RECEIVED_FROM_PARENT = "RECEIVED_FROM_PARENT"
    GIVEN_TO_STUDENT = "GIVEN_TO_STUDENT"
    RETURNED_TO_PARENT = "RETURNED_TO_PARENT"
    FEE_EXCESS_TRANSFER = "FEE_EXCESS_TRANSFER"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(SQLEnum(RoleEnum), default=RoleEnum.OFFICE_STAFF, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    setting_key = Column(String, unique=True, index=True, nullable=False)
    setting_value = Column(String, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    admission_no = Column(String, unique=True, index=True, nullable=False)
    pay_id = Column(String, unique=True, index=True, nullable=False)
    pupil_id = Column(String, nullable=True)
    first_name = Column(String, index=True, nullable=False)
    last_name = Column(String, index=True, nullable=False)
    name = Column(String, index=True, nullable=False)
    dob = Column(String, nullable=False)
    admission_year = Column(Integer, index=True, nullable=False)
    father_name = Column(String, nullable=False)
    mother_name = Column(String, nullable=True)
    contact_no = Column(String, nullable=False)
    additional_contact = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    boarding_category = Column(SQLEnum(BoardingCategoryEnum), nullable=False)
    status = Column(SQLEnum(StudentStatusEnum), default=StudentStatusEnum.ACTIVE, nullable=False)

    is_sponsored = Column(Boolean, default=False, nullable=False)
    sponsor_type = Column(SQLEnum(SponsorTypeEnum), nullable=True)
    sponsor_name = Column(String, index=True, nullable=True)
    scholarship_type = Column(SQLEnum(ScholarshipTypeEnum), default=ScholarshipTypeEnum.NONE, nullable=False)

    has_mismatch = Column(Boolean, default=False, nullable=False)
    mismatch_amount = Column(Float, default=0.0, nullable=False)
    amount_to_return_sponsor = Column(Float, default=0.0, nullable=False)

    remarks = Column(Text, nullable=True)
    date_of_admission = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    enrollments = relationship("AcademicEnrollment", back_populates="student", cascade="all, delete-orphan")
    fee_payments = relationship("FeePayment", back_populates="student", cascade="all, delete-orphan")
    pocket_money_txs = relationship("PocketMoneyTransaction", back_populates="student", cascade="all, delete-orphan")
    fee_deficits = relationship("FeeDeficit", back_populates="student", cascade="all, delete-orphan")
    fee_excesses = relationship("FeeExcess", back_populates="student", cascade="all, delete-orphan")

class AcademicEnrollment(Base):
    __tablename__ = "academic_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    academic_year = Column(String, index=True, nullable=False)
    academic_level = Column(String, index=True, nullable=False, default="Form 1")
    standard = Column(SQLEnum(StandardEnum), index=True, nullable=False)
    section = Column(SQLEnum(SectionEnum), index=True, nullable=False)
    is_current = Column(Boolean, default=True, nullable=False)

    student = relationship("Student", back_populates="enrollments")

class FeeStructure(Base):
    __tablename__ = "fee_structures"

    id = Column(Integer, primary_key=True, index=True)
    academic_year = Column(String, index=True, nullable=False)
    boarding_category = Column(SQLEnum(BoardingCategoryEnum), nullable=False)
    term_1_amount = Column(Float, nullable=False)
    term_2_amount = Column(Float, nullable=False)
    term_3_amount = Column(Float, nullable=False)

class FeePayment(Base):
    __tablename__ = "fee_payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_no = Column(String, unique=True, index=True, nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    academic_year = Column(String, index=True, nullable=False)
    payment_date = Column(String, nullable=False)
    expected_amount = Column(Float, default=0.0, nullable=False)
    total_amount = Column(Float, nullable=False)
    mismatch_amount = Column(Float, default=0.0, nullable=False)
    amount_to_return_sponsor = Column(Float, default=0.0, nullable=False)
    payment_method = Column(String, default="CASH", nullable=False)
    receipt_no = Column(String, nullable=False)
    recorded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="fee_payments")
    allocations = relationship("PaymentAllocation", back_populates="fee_payment", cascade="all, delete-orphan")

class PaymentAllocation(Base):
    __tablename__ = "payment_allocations"

    id = Column(Integer, primary_key=True, index=True)
    fee_payment_id = Column(Integer, ForeignKey("fee_payments.id"), nullable=False)
    term_name = Column(SQLEnum(TermNameEnum), nullable=False)
    allocated_amount = Column(Float, nullable=False)

    fee_payment = relationship("FeePayment", back_populates="allocations")

class PocketMoneyTransaction(Base):
    __tablename__ = "pocket_money_transactions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    transaction_date = Column(String, nullable=False)
    transaction_type = Column(SQLEnum(PocketMoneyTxTypeEnum), nullable=False)
    amount = Column(Float, nullable=False)
    source_or_recipient = Column(String, nullable=True)
    receipt_ref = Column(String, nullable=True)
    transfer_id = Column(String, unique=True, index=True, nullable=True)
    source_payment_no = Column(String, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="pocket_money_txs")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class FeeDeficit(Base):
    __tablename__ = "fee_deficits"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    academic_year = Column(String, index=True, nullable=False)
    term_name = Column(SQLEnum(TermNameEnum), nullable=False)
    expected_amount = Column(Float, nullable=False)
    allocated_amount = Column(Float, nullable=False)
    deficit_amount = Column(Float, nullable=False)
    status = Column(SQLEnum(DeficitStatusEnum), default=DeficitStatusEnum.OUTSTANDING, nullable=False)
    fee_payment_id = Column(Integer, ForeignKey("fee_payments.id"), nullable=True)
    cleared_by_payment_id = Column(Integer, ForeignKey("fee_payments.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    cleared_at = Column(DateTime, nullable=True)

    student = relationship("Student", back_populates="fee_deficits")

class FeeExcess(Base):
    __tablename__ = "fee_excesses"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    original_payment_id = Column(Integer, ForeignKey("fee_payments.id"), nullable=False)
    amount_received = Column(Float, nullable=False)
    fees_allocated = Column(Float, nullable=False)
    excess_amount = Column(Float, nullable=False)
    status = Column(SQLEnum(ExcessStatusEnum), default=ExcessStatusEnum.UNALLOCATED, nullable=False)
    decision = Column(String, nullable=True)
    sponsor_name = Column(String, nullable=True)
    sponsor_type = Column(String, nullable=True)
    amount_to_return_sponsor = Column(Float, nullable=True)
    approved_by = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    transfer_id = Column(String, unique=True, index=True, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("Student", back_populates="fee_excesses")

class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String, unique=True, index=True, nullable=False)
    event_type = Column(String, nullable=False)
    payload = Column(Text, nullable=False)
    status = Column(String, default="PENDING", nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
