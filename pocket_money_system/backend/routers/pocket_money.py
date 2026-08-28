from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import urllib.request
import json
import logging
from database import get_db
from models import (
    Student, PocketMoneyTransaction, PocketMoneyTxTypeEnum,
    BoardingCategoryEnum, StudentStatusEnum, AuditLog
)
from schemas import (
    PocketMoneyTxCreate, PocketMoneyTxSchema, PocketMoneySummary,
    StudentPocketProfileData, DailyStatementSchema, MonthlyStatementSchema
)
from services.pocket_money_service import (
    calculate_pocket_money_summary, get_student_transactions_with_balances,
    get_all_transactions_latest_first, get_daily_statement, get_monthly_statement
)

logger = logging.getLogger("pm_reverse_sync")
MAIN_SYSTEM_URL = "http://127.0.0.1:8000"

def reverse_sync_to_main_system(student_pay_id: str, tx_data: dict):
    """Sync pocket money transaction back to the main fee system."""
    try:
        payload = json.dumps(tx_data).encode("utf-8")
        req = urllib.request.Request(
            f"{MAIN_SYSTEM_URL}/pocket-money/sync-from-pm",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        logger.warning(f"Reverse sync to main system failed (non-blocking): {e}")

router = APIRouter(prefix="/pocket-money", tags=["pocket-money"])

@router.post("/transactions", response_model=PocketMoneyTxSchema)
def record_pocket_money_tx(req: PocketMoneyTxCreate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if student.boarding_category == BoardingCategoryEnum.DAY_SCHOLAR:
        raise HTTPException(
            status_code=400,
            detail="Pocket money records apply to Hostellers only. Selected student is a Day Scholar."
        )

    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Transaction amount must be greater than zero.")

    if req.transaction_type in [PocketMoneyTxTypeEnum.GIVEN_TO_STUDENT, PocketMoneyTxTypeEnum.RETURNED_TO_PARENT]:
        current_summary = calculate_pocket_money_summary(db, student.id)
        if req.amount > current_summary.current_balance:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient held balance. Available balance is K {current_summary.current_balance:,.2f}, cannot issue K {req.amount:,.2f}."
            )

    tx = PocketMoneyTransaction(
        student_id=student.id,
        transaction_date=req.transaction_date,
        transaction_type=req.transaction_type,
        amount=req.amount,
        source_or_recipient=req.source_or_recipient,
        receipt_ref=req.receipt_ref,
        remarks=req.remarks
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    action_label = {
        PocketMoneyTxTypeEnum.RECEIVED_FROM_PARENT: "Received from parent",
        PocketMoneyTxTypeEnum.GIVEN_TO_STUDENT: "Given to student",
        PocketMoneyTxTypeEnum.RETURNED_TO_PARENT: "Returned to parent"
    }[req.transaction_type]

    db.add(AuditLog(
        action="POCKET_MONEY_TX",
        entity_type="PocketMoneyTransaction",
        entity_id=str(tx.id),
        details=f"Pocket Money ({action_label}): K {req.amount:,.2f} for {student.name}"
    ))
    db.commit()

    # Reverse sync to main system so pocket money held stays consistent
    reverse_sync_to_main_system(student.pay_id, {
        "pay_id": student.pay_id,
        "transaction_date": req.transaction_date,
        "transaction_type": req.transaction_type.value if hasattr(req.transaction_type, 'value') else req.transaction_type,
        "amount": req.amount,
        "source_or_recipient": req.source_or_recipient,
        "receipt_ref": req.receipt_ref,
        "remarks": req.remarks or f"Synced from Pocket Money System"
    })

    curr_enr = next((e for e in student.enrollments if e.is_current), None)
    created_at_str = tx.created_at.strftime("%Y-%m-%d %H:%M") if tx.created_at else f"{tx.transaction_date} 00:00"

    return PocketMoneyTxSchema(
        id=tx.id,
        student_id=tx.student_id,
        student_name=student.name,
        pay_id=student.pay_id,
        academic_level=curr_enr.academic_level if curr_enr else "",
        standard=curr_enr.standard.value if (curr_enr and curr_enr.standard) else "",
        section=curr_enr.section.value if (curr_enr and curr_enr.section) else "",
        transaction_date=tx.transaction_date,
        created_at=created_at_str,
        transaction_type=tx.transaction_type,
        amount=tx.amount,
        source_or_recipient=tx.source_or_recipient,
        receipt_ref=tx.receipt_ref,
        remarks=tx.remarks
    )

@router.get("/transactions/all", response_model=List[PocketMoneyTxSchema])
def get_all_pocket_transactions(db: Session = Depends(get_db)):
    return get_all_transactions_latest_first(db)

@router.get("/transactions/student/{student_id}", response_model=List[PocketMoneyTxSchema])
def get_student_pocket_transactions(student_id: int, db: Session = Depends(get_db)):
    return get_student_transactions_with_balances(db, student_id)

@router.get("/daily-statement", response_model=DailyStatementSchema)
def get_daily_statement_api(
    date: Optional[str] = Query(None, description="Target date in YYYY-MM-DD format"),
    db: Session = Depends(get_db)
):
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    return get_daily_statement(db, target_date)

@router.get("/monthly-statement", response_model=MonthlyStatementSchema)
def get_monthly_statement_api(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    now = datetime.now()
    target_year = year or now.year
    target_month = month or now.month
    return get_monthly_statement(db, target_year, target_month)

@router.delete("/transactions/{tx_id}")
def delete_pocket_money_tx(tx_id: int, db: Session = Depends(get_db)):
    tx = db.query(PocketMoneyTransaction).filter(PocketMoneyTransaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Pocket money transaction not found")
    
    db.delete(tx)
    db.commit()
    return {"message": "Pocket money transaction deleted successfully"}

@router.get("/summary", response_model=dict)
def get_overall_pocket_money_summary(db: Session = Depends(get_db)):
    txs = db.query(PocketMoneyTransaction).all()
    total_received = sum(t.amount for t in txs if t.transaction_type in [PocketMoneyTxTypeEnum.RECEIVED_FROM_PARENT, PocketMoneyTxTypeEnum.FEE_EXCESS_TRANSFER])
    total_given = sum(t.amount for t in txs if t.transaction_type == PocketMoneyTxTypeEnum.GIVEN_TO_STUDENT)
    total_returned = sum(t.amount for t in txs if t.transaction_type == PocketMoneyTxTypeEnum.RETURNED_TO_PARENT)
    total_fee_excess = sum(t.amount for t in txs if t.transaction_type == PocketMoneyTxTypeEnum.FEE_EXCESS_TRANSFER)

    hostellers_count = db.query(Student).filter(
        Student.boarding_category.in_([BoardingCategoryEnum.HOSTEL_ORDINARY, BoardingCategoryEnum.HOSTEL_SPECIAL]),
        Student.status == StudentStatusEnum.ACTIVE
    ).count()

    return {
        "hostellers_count": hostellers_count,
        "total_received": total_received,
        "total_fee_excess_transfers": total_fee_excess,
        "total_given": total_given,
        "total_returned": total_returned,
        "currently_held_balance": total_received - total_given - total_returned
    }
