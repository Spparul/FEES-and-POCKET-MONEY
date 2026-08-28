from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import date
from models import (
    RoleEnum, StudentStatusEnum, BoardingCategoryEnum,
    StandardEnum, SectionEnum, TermNameEnum, PocketMoneyTxTypeEnum,
    SponsorTypeEnum, ScholarshipTypeEnum
)

# Auth Schemas
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user_id: int
    username: str
    full_name: str
    role: RoleEnum

class LockToggleRequest(BaseModel):
    admin_password: str
    lock: bool

class AdminAuthRequest(BaseModel):
    admin_password: str

# Student Schemas
class StudentBase(BaseModel):
    admission_no: str
    pay_id: str
    pupil_id: Optional[str] = None
    first_name: str
    last_name: str
    name: str
    dob: str
    admission_year: int
    father_name: str
    mother_name: Optional[str] = None
    contact_no: str
    additional_contact: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    boarding_category: BoardingCategoryEnum
    academic_level: Optional[str] = "Form 1"
    standard: StandardEnum
    section: SectionEnum
    status: Optional[StudentStatusEnum] = StudentStatusEnum.ACTIVE
    date_of_admission: Optional[str] = None
    
    # Sponsorship & Scholarship
    is_sponsored: Optional[bool] = False
    sponsor_type: Optional[SponsorTypeEnum] = None
    sponsor_name: Optional[str] = None
    scholarship_type: Optional[ScholarshipTypeEnum] = ScholarshipTypeEnum.NONE
    
    # Mismatch
    has_mismatch: Optional[bool] = False
    mismatch_amount: Optional[float] = 0.0
    amount_to_return_sponsor: Optional[float] = 0.0

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    name: Optional[str] = None
    dob: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    contact_no: Optional[str] = None
    additional_contact: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    boarding_category: Optional[BoardingCategoryEnum] = None
    status: Optional[StudentStatusEnum] = None
    academic_level: Optional[str] = None
    standard: Optional[StandardEnum] = None
    section: Optional[SectionEnum] = None
    is_sponsored: Optional[bool] = None
    sponsor_type: Optional[SponsorTypeEnum] = None
    sponsor_name: Optional[str] = None
    scholarship_type: Optional[ScholarshipTypeEnum] = None

class AcademicEnrollmentSchema(BaseModel):
    id: int
    academic_year: str
    academic_level: Optional[str] = "Form 1"
    standard: StandardEnum
    section: SectionEnum
    is_current: bool

    class Config:
        from_attributes = True

class TermFeeSummary(BaseModel):
    term_name: str
    expected_amount: float
    paid_amount: float
    due_amount: float
    payment_date: Optional[str] = None
    status: str  # Paid / Due

class StudentFeeOverview(BaseModel):
    terms_paid_count: int  # 0..3
    terms_due_count: int   # 0..3
    total_expected: float
    total_paid: float
    total_due: float
    overall_status: str    # e.g., "Fully Paid", "Two Terms Paid", "One Term Paid", "No Fees Paid"
    due_status_label: str  # e.g., "Fully Paid", "One Term Due", "Two Terms Due", "Three Terms Due"
    term_details: List[TermFeeSummary]

class PocketMoneySummary(BaseModel):
    total_received: float
    total_given: float
    total_returned: float
    current_balance: float
    has_records: bool

class StudentResponse(BaseModel):
    id: int
    admission_no: str
    pay_id: str
    pupil_id: Optional[str] = None
    first_name: str
    last_name: str
    name: str
    dob: str
    admission_year: int
    father_name: str
    contact_no: str
    additional_contact: Optional[str] = None
    boarding_category: BoardingCategoryEnum
    status: StudentStatusEnum
    date_of_admission: str
    academic_level: Optional[str] = "Form 1"
    current_standard: Optional[StandardEnum] = None
    current_section: Optional[SectionEnum] = None
    academic_year: Optional[str] = None
    is_sponsored: bool = False
    sponsor_type: Optional[SponsorTypeEnum] = None
    sponsor_name: Optional[str] = None
    scholarship_type: ScholarshipTypeEnum = ScholarshipTypeEnum.NONE
    has_mismatch: bool = False
    mismatch_amount: float = 0.0
    amount_to_return_sponsor: float = 0.0
    fee_overview: Optional[StudentFeeOverview] = None
    pocket_money: Optional[PocketMoneySummary] = None
    enrollment_history: List[AcademicEnrollmentSchema] = []

    class Config:
        from_attributes = True

# Fee Payment Schemas
class PaymentRecordRequest(BaseModel):
    student_id: int
    academic_year: str
    payment_date: str
    terms_covered: List[TermNameEnum]  # e.g. ["Term 1"], ["Term 1", "Term 2"]
    total_amount: Optional[float] = None  # Custom user-typed payment amount
    payment_method: str = "Cash"
    receipt_no: str
    remarks: Optional[str] = None

class FeePaymentSchema(BaseModel):
    id: int
    payment_no: str
    student_id: int
    student_name: Optional[str] = None
    pay_id: Optional[str] = None
    academic_level: Optional[str] = None
    standard: Optional[str] = None
    section: Optional[str] = None
    boarding_category: Optional[str] = None
    is_sponsored: Optional[bool] = False
    sponsor_name: Optional[str] = None
    academic_year: str
    payment_date: str
    total_amount: float
    expected_amount: float = 0.0
    mismatch_amount: float = 0.0
    amount_to_return_sponsor: float = 0.0
    payment_method: str
    receipt_no: str
    recorded_by_user_id: Optional[int] = None
    remarks: Optional[str] = None
    terms_covered: List[str] = []
    
    # Detailed distribution breakdown fields (Rules 25-28)
    allocations_breakdown: Optional[dict] = None
    deficit_cleared: float = 0.0
    fee_excess_amount: float = 0.0
    excess_decision: Optional[str] = None
    excess_status: Optional[str] = None
    sponsor_return_amount: float = 0.0
    pocket_money_tx_id: Optional[str] = None
    pocket_money_balance: Optional[float] = None

    class Config:
        from_attributes = True

# Pocket Money Schemas
class PocketMoneyTxCreate(BaseModel):
    student_id: int
    transaction_date: str
    transaction_type: PocketMoneyTxTypeEnum
    amount: float
    source_or_recipient: Optional[str] = None
    receipt_ref: Optional[str] = None
    remarks: Optional[str] = None

class PocketMoneyTxSchema(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    pay_id: Optional[str] = None
    academic_level: Optional[str] = None
    standard: Optional[str] = None
    section: Optional[str] = None
    transaction_date: str
    transaction_type: PocketMoneyTxTypeEnum
    amount: float
    source_or_recipient: Optional[str] = None
    receipt_ref: Optional[str] = None
    remarks: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

class FeeStructureSchema(BaseModel):
    id: int
    academic_year: str
    boarding_category: BoardingCategoryEnum
    term_1_amount: float
    term_2_amount: float
    term_3_amount: float

    class Config:
        from_attributes = True

class SystemSettingsSchema(BaseModel):
    is_register_locked: bool
    active_academic_year: str
    total_students: int
    total_classes: int
