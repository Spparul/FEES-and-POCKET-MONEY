from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import (
    Student, PocketMoneyTransaction, PocketMoneyTxTypeEnum,
    BoardingCategoryEnum, AuditLog
)
from schemas import PocketMoneyTxCreate, PocketMoneyTxSchema, PocketMoneySummary
from services.pocket_money_service import calculate_pocket_money_summary

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

    # Check balance if GIVEN_TO_STUDENT or RETURNED_TO_PARENT
    if req.transaction_type in [PocketMoneyTxTypeEnum.GIVEN_TO_STUDENT, PocketMoneyTxTypeEnum.RETURNED_TO_PARENT]:
        current_summary = calculate_pocket_money_summary(db, student.id)
        if req.amount > current_summary.current_balance:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient held balance. Available balance is ₹{current_summary.current_balance:,.2f}, cannot issue ₹{req.amount:,.2f}."
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
        details=f"Pocket Money ({action_label}): ₹{req.amount:,.2f} for {student.name}"
    ))
    db.commit()

    return PocketMoneyTxSchema(
        id=tx.id,
        student_id=tx.student_id,
        transaction_date=tx.transaction_date,
        transaction_type=tx.transaction_type,
        amount=tx.amount,
        source_or_recipient=tx.source_or_recipient,
        receipt_ref=tx.receipt_ref,
        remarks=tx.remarks
    )

@router.get("/transactions/all", response_model=List[PocketMoneyTxSchema])
def get_all_pocket_transactions(db: Session = Depends(get_db)):
    txs = db.query(PocketMoneyTransaction).order_by(PocketMoneyTransaction.id.desc()).all()
    results = []
    for t in txs:
        student = db.query(Student).filter(Student.id == t.student_id).first()
        curr_enr = next((e for e in student.enrollments if e.is_current), None) if student else None
        results.append(PocketMoneyTxSchema(
            id=t.id,
            student_id=t.student_id,
            student_name=student.name if student else "Unknown",
            pay_id=student.pay_id if student else "",
            academic_level=curr_enr.academic_level if curr_enr else "",
            standard=curr_enr.standard.value if curr_enr and curr_enr.standard else "",
            section=curr_enr.section.value if curr_enr and curr_enr.section else "",
            transaction_date=t.transaction_date,
            transaction_type=t.transaction_type,
            amount=t.amount,
            source_or_recipient=t.source_or_recipient,
            receipt_ref=t.receipt_ref,
            remarks=t.remarks
        ))
    return results

@router.get("/transactions/student/{student_id}", response_model=List[PocketMoneyTxSchema])
def get_student_pocket_transactions(student_id: int, db: Session = Depends(get_db)):
    txs = db.query(PocketMoneyTransaction).filter(
        PocketMoneyTransaction.student_id == student_id
    ).order_by(PocketMoneyTransaction.transaction_date.desc()).all()

    student = db.query(Student).filter(Student.id == student_id).first()
    curr_enr = next((e for e in student.enrollments if e.is_current), None) if student else None

    return [
        PocketMoneyTxSchema(
            id=t.id,
            student_id=t.student_id,
            student_name=student.name if student else "Unknown",
            pay_id=student.pay_id if student else "",
            academic_level=curr_enr.academic_level if curr_enr else "",
            standard=curr_enr.standard.value if curr_enr and curr_enr.standard else "",
            section=curr_enr.section.value if curr_enr and curr_enr.section else "",
            transaction_date=t.transaction_date,
            transaction_type=t.transaction_type,
            amount=t.amount,
            source_or_recipient=t.source_or_recipient,
            receipt_ref=t.receipt_ref,
            remarks=t.remarks
        ) for t in txs
    ]

@router.post("/sync-from-pm")
def sync_from_pocket_money_system(data: dict, db: Session = Depends(get_db)):
    """Receive pocket money transactions synced from the separate PM system."""
    pay_id = data.get("pay_id")
    if not pay_id:
        raise HTTPException(status_code=400, detail="pay_id required")

    student = db.query(Student).filter(Student.pay_id == pay_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student with PayID {pay_id} not found")

    tx_type_str = data.get("transaction_type", "RECEIVED_FROM_PARENT")
    try:
        tx_type = PocketMoneyTxTypeEnum(tx_type_str)
    except ValueError:
        tx_type = PocketMoneyTxTypeEnum.RECEIVED_FROM_PARENT

    tx = PocketMoneyTransaction(
        student_id=student.id,
        transaction_date=data.get("transaction_date", ""),
        transaction_type=tx_type,
        amount=data.get("amount", 0.0),
        source_or_recipient=data.get("source_or_recipient"),
        receipt_ref=data.get("receipt_ref"),
        remarks=data.get("remarks", "Synced from Pocket Money System")
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    return {"status": "SUCCESS", "transaction_id": tx.id}

@router.delete("/transactions/{tx_id}")
def delete_pocket_money_tx(tx_id: int, db: Session = Depends(get_db)):
    tx = db.query(PocketMoneyTransaction).filter(PocketMoneyTransaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Pocket money transaction not found")

    db.delete(tx)
    db.commit()
    return {"message": "Pocket money transaction deleted successfully"}
