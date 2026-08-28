from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/api/sync", tags=["Synchronization"])

class SyncStudentSchema(BaseModel):
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
    boarding_category: str
    status: str = "ACTIVE"
    is_sponsored: bool = False
    sponsor_name: Optional[str] = None
    date_of_admission: str
    current_academic_level: str = "Form 1"
    current_standard: str = "VIII"
    current_section: str = "E"

class SyncTransferSchema(BaseModel):
    transfer_id: str
    pay_id: str
    student_name: str
    amount: float
    source_payment_no: str
    approved_by: str
    remarks: Optional[str] = None

@router.post("/student")
def sync_student(data: SyncStudentSchema, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.pay_id == data.pay_id).first()

    if not student:
        student = models.Student(
            pay_id=data.pay_id,
            pupil_id=data.pupil_id,
            first_name=data.first_name,
            last_name=data.last_name,
            name=data.name,
            dob=data.dob,
            admission_year=data.admission_year,
            father_name=data.father_name,
            mother_name=data.mother_name,
            contact_no=data.contact_no,
            additional_contact=data.additional_contact,
            address=data.address,
            city=data.city,
            state=data.state,
            pincode=data.pincode,
            boarding_category=data.boarding_category,
            status=data.status,
            is_sponsored=data.is_sponsored,
            sponsor_name=data.sponsor_name,
            date_of_admission=data.date_of_admission
        )
        db.add(student)
        db.flush()

        # Add current enrollment
        enroll = models.AcademicEnrollment(
            student_id=student.id,
            academic_year="2026-2027",
            academic_level=data.current_academic_level,
            standard=data.current_standard,
            section=data.current_section,
            is_current=True
        )
        db.add(enroll)
    else:
        student.first_name = data.first_name
        student.last_name = data.last_name
        student.name = data.name
        student.boarding_category = data.boarding_category
        student.status = data.status
        student.is_sponsored = data.is_sponsored
        student.sponsor_name = data.sponsor_name

        # Update enrollment standard/section
        enroll = db.query(models.AcademicEnrollment).filter(
            models.AcademicEnrollment.student_id == student.id,
            models.AcademicEnrollment.is_current == True
        ).first()
        if enroll:
            enroll.academic_level = data.current_academic_level
            enroll.standard = data.current_standard
            enroll.section = data.current_section

    db.commit()
    return {"status": "SUCCESS", "pay_id": data.pay_id}

@router.post("/transfer")
def sync_transfer(data: SyncTransferSchema, db: Session = Depends(get_db)):
    # IDEMPOTENCY CHECK: Ensure transfer_id is not duplicate
    existing_tx = db.query(models.PocketMoneyTransaction).filter(
        models.PocketMoneyTransaction.transfer_id == data.transfer_id
    ).first()

    if existing_tx:
        return {
            "status": "ALREADY_PROCESSED",
            "message": f"Transfer ID {data.transfer_id} has already been processed.",
            "transaction_id": existing_tx.id
        }

    student = db.query(models.Student).filter(models.Student.pay_id == data.pay_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student PayID {data.pay_id} not found in Pocket Money DB")

    today_str = datetime.utcnow().strftime("%Y-%m-%d")

    # Create FEE_EXCESS_TRANSFER transaction
    tx = models.PocketMoneyTransaction(
        student_id=student.id,
        transaction_date=today_str,
        transaction_type=models.PocketMoneyTxTypeEnum.FEE_EXCESS_TRANSFER,
        amount=data.amount,
        source_or_recipient=f"Fee Excess (Payment #{data.source_payment_no})",
        receipt_ref=data.source_payment_no,
        transfer_id=data.transfer_id,
        source_payment_no=data.source_payment_no,
        remarks=data.remarks or f"Approved Fee Excess Transfer by {data.approved_by}"
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    return {
        "status": "SUCCESS",
        "message": "Fee excess transfer successfully credited to student pocket money account",
        "transaction_id": tx.id,
        "transfer_id": data.transfer_id,
        "new_balance": sum(
            t.amount if t.transaction_type in [models.PocketMoneyTxTypeEnum.RECEIVED_FROM_PARENT, models.PocketMoneyTxTypeEnum.FEE_EXCESS_TRANSFER]
            else -t.amount
            for t in student.pocket_money_txs
        )
    }
