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

class PocketMoneyTxTypeEnum(str, enum.Enum):
    RECEIVED_FROM_PARENT = "RECEIVED_FROM_PARENT"
    GIVEN_TO_STUDENT = "GIVEN_TO_STUDENT"
    RETURNED_TO_PARENT = "RETURNED_TO_PARENT"
    FEE_EXCESS_TRANSFER = "FEE_EXCESS_TRANSFER"

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    pay_id = Column(String, unique=True, index=True, nullable=False)
    pupil_id = Column(String, index=True, nullable=True)
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
    sponsor_name = Column(String, index=True, nullable=True)
    date_of_admission = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    enrollments = relationship("AcademicEnrollment", back_populates="student", cascade="all, delete-orphan")
    pocket_money_txs = relationship("PocketMoneyTransaction", back_populates="student", cascade="all, delete-orphan")

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

class PocketMoneyTransaction(Base):
    __tablename__ = "pocket_money_transactions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    transaction_date = Column(String, nullable=False)  # YYYY-MM-DD
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
    timestamp = Column(DateTime, default=datetime.utcnow)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    details = Column(Text, nullable=True)
