from pydantic import BaseModel
from typing import Optional, List, Any
from models import BoardingCategoryEnum, StudentStatusEnum, StandardEnum, SectionEnum, PocketMoneyTxTypeEnum

class StudentSchema(BaseModel):
    id: int
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
    boarding_category: BoardingCategoryEnum
    status: StudentStatusEnum
    date_of_admission: str
    academic_level: Optional[str] = "Form 1"
    current_standard: Optional[StandardEnum] = None
    current_section: Optional[SectionEnum] = None
    academic_year: Optional[str] = None
    is_sponsored: bool = False
    sponsor_name: Optional[str] = None
    current_balance: float = 0.0

    class Config:
        from_attributes = True

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
    created_at: Optional[str] = None
    transaction_type: PocketMoneyTxTypeEnum
    amount: float
    previous_balance: Optional[float] = 0.0
    new_balance: Optional[float] = 0.0
    source_or_recipient: Optional[str] = None
    receipt_ref: Optional[str] = None
    remarks: Optional[str] = None

    class Config:
        from_attributes = True

class PocketMoneySummary(BaseModel):
    student_id: int
    total_received: float
    total_given: float
    total_returned: float
    current_balance: float

class StudentPocketProfileData(BaseModel):
    student: StudentSchema
    summary: PocketMoneySummary
    pocket_transactions: List[PocketMoneyTxSchema]

class DailyStatementSchema(BaseModel):
    date: str
    total_credited: float
    students_credited: int
    transactions_credited: int
    total_debited: float
    students_debited: int
    transactions_debited: int
    total_refunded: float
    students_refunded: int
    transactions_refunded: int
    total_money_moved: float
    unique_students_with_activity: int
    total_transactions_count: int
    net_change: float
    currently_held_balance: float
    transactions: List[PocketMoneyTxSchema]

class DayByDayBreakdownSchema(BaseModel):
    date: str
    credited: float
    students_credited: int
    debited: float
    students_debited: int
    refunded: float
    students_refunded: int
    unique_students: int
    net_change: float

class MonthlyStatementSchema(BaseModel):
    year: int
    month: int
    month_label: str
    total_credited: float
    students_credited: int
    transactions_credited: int
    total_debited: float
    students_debited: int
    transactions_debited: int
    total_refunded: float
    students_refunded: int
    transactions_refunded: int
    total_money_moved: float
    unique_students_with_activity: int
    total_transactions_count: int
    net_change: float
    currently_held_balance: float
    day_by_day: List[DayByDayBreakdownSchema]
    transactions: List[PocketMoneyTxSchema]
