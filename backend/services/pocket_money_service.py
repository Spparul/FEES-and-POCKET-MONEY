from sqlalchemy.orm import Session
from models import PocketMoneyTransaction, PocketMoneyTxTypeEnum, Student
from schemas import PocketMoneySummary

def calculate_pocket_money_summary(db: Session, student_id: int) -> PocketMoneySummary:
    txs = db.query(PocketMoneyTransaction).filter(
        PocketMoneyTransaction.student_id == student_id
    ).all()

    if not txs:
        return PocketMoneySummary(
            total_received=0.0,
            total_given=0.0,
            total_returned=0.0,
            current_balance=0.0,
            has_records=False
        )

    total_received = 0.0
    total_given = 0.0
    total_returned = 0.0

    for tx in txs:
        if tx.transaction_type in [PocketMoneyTxTypeEnum.RECEIVED_FROM_PARENT, PocketMoneyTxTypeEnum.FEE_EXCESS_TRANSFER]:
            total_received += tx.amount
        elif tx.transaction_type == PocketMoneyTxTypeEnum.GIVEN_TO_STUDENT:
            total_given += tx.amount
        elif tx.transaction_type == PocketMoneyTxTypeEnum.RETURNED_TO_PARENT:
            total_returned += tx.amount

    current_balance = max(0.0, total_received - (total_given + total_returned))

    return PocketMoneySummary(
        total_received=total_received,
        total_given=total_given,
        total_returned=total_returned,
        current_balance=current_balance,
        has_records=True
    )
