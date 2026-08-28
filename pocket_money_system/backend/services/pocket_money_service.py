from sqlalchemy.orm import Session
from sqlalchemy import func, extract, distinct, or_
from models import PocketMoneyTransaction, PocketMoneyTxTypeEnum, Student, AcademicEnrollment
from schemas import (
    PocketMoneySummary, PocketMoneyTxSchema, DailyStatementSchema,
    MonthlyStatementSchema, DayByDayBreakdownSchema
)
from datetime import datetime, date
import calendar

def calculate_pocket_money_summary(db: Session, student_id: int) -> PocketMoneySummary:
    txs = db.query(PocketMoneyTransaction).filter(
        PocketMoneyTransaction.student_id == student_id
    ).all()

    total_received = sum(t.amount for t in txs if t.transaction_type in [PocketMoneyTxTypeEnum.RECEIVED_FROM_PARENT, PocketMoneyTxTypeEnum.FEE_EXCESS_TRANSFER])
    total_given = sum(t.amount for t in txs if t.transaction_type == PocketMoneyTxTypeEnum.GIVEN_TO_STUDENT)
    total_returned = sum(t.amount for t in txs if t.transaction_type == PocketMoneyTxTypeEnum.RETURNED_TO_PARENT)

    current_balance = total_received - total_given - total_returned

    return PocketMoneySummary(
        student_id=student_id,
        total_received=total_received,
        total_given=total_given,
        total_returned=total_returned,
        current_balance=current_balance
    )

def get_student_transactions_with_balances(db: Session, student_id: int) -> list[PocketMoneyTxSchema]:
    """
    Builds chronological running balance per student, then returns transactions sorted LATEST FIRST.
    """
    txs = db.query(PocketMoneyTransaction).filter(
        PocketMoneyTransaction.student_id == student_id
    ).order_by(PocketMoneyTransaction.id.asc()).all()

    student = db.query(Student).filter(Student.id == student_id).first()
    curr_enr = next((e for e in student.enrollments if e.is_current), None) if student else None

    running_balance = 0.0
    results = []

    for t in txs:
        prev_bal = running_balance
        if t.transaction_type in [PocketMoneyTxTypeEnum.RECEIVED_FROM_PARENT, PocketMoneyTxTypeEnum.FEE_EXCESS_TRANSFER]:
            new_bal = prev_bal + t.amount
        else:
            new_bal = prev_bal - t.amount
        running_balance = new_bal

        created_at_str = t.created_at.strftime("%Y-%m-%d %H:%M") if t.created_at else f"{t.transaction_date} 00:00"

        results.append(PocketMoneyTxSchema(
            id=t.id,
            student_id=t.student_id,
            student_name=student.name if student else "Unknown",
            pay_id=student.pay_id if student else "",
            academic_level=curr_enr.academic_level if curr_enr else "",
            standard=curr_enr.standard.value if curr_enr and curr_enr.standard else "",
            section=curr_enr.section.value if curr_enr and curr_enr.section else "",
            transaction_date=t.transaction_date,
            created_at=created_at_str,
            transaction_type=t.transaction_type,
            amount=t.amount,
            previous_balance=prev_bal,
            new_balance=new_bal,
            source_or_recipient=t.source_or_recipient,
            receipt_ref=t.receipt_ref,
            remarks=t.remarks
        ))

    # Return LATEST TRANSACTION FIRST
    results.reverse()
    return results

def get_all_transactions_latest_first(db: Session) -> list[PocketMoneyTxSchema]:
    txs = db.query(PocketMoneyTransaction).order_by(PocketMoneyTransaction.id.desc()).all()
    results = []
    for t in txs:
        student = db.query(Student).filter(Student.id == t.student_id).first()
        curr_enr = next((e for e in student.enrollments if e.is_current), None) if student else None
        created_at_str = t.created_at.strftime("%Y-%m-%d %H:%M") if t.created_at else f"{t.transaction_date} 00:00"
        results.append(PocketMoneyTxSchema(
            id=t.id,
            student_id=t.student_id,
            student_name=student.name if student else "Unknown",
            pay_id=student.pay_id if student else "",
            academic_level=curr_enr.academic_level if curr_enr else "",
            standard=curr_enr.standard.value if curr_enr and curr_enr.standard else "",
            section=curr_enr.section.value if curr_enr and curr_enr.section else "",
            transaction_date=t.transaction_date,
            created_at=created_at_str,
            transaction_type=t.transaction_type,
            amount=t.amount,
            source_or_recipient=t.source_or_recipient,
            receipt_ref=t.receipt_ref,
            remarks=t.remarks
        ))
    return results

def get_daily_statement(db: Session, target_date: str) -> DailyStatementSchema:
    # System overall held balance
    all_txs = db.query(PocketMoneyTransaction).all()
    overall_rec = sum(t.amount for t in all_txs if t.transaction_type in [PocketMoneyTxTypeEnum.RECEIVED_FROM_PARENT, PocketMoneyTxTypeEnum.FEE_EXCESS_TRANSFER])
    overall_giv = sum(t.amount for t in all_txs if t.transaction_type == PocketMoneyTxTypeEnum.GIVEN_TO_STUDENT)
    overall_ret = sum(t.amount for t in all_txs if t.transaction_type == PocketMoneyTxTypeEnum.RETURNED_TO_PARENT)
    currently_held_balance = overall_rec - overall_giv - overall_ret

    # Filter target date transactions
    day_txs = db.query(PocketMoneyTransaction).filter(
        PocketMoneyTransaction.transaction_date == target_date
    ).order_by(PocketMoneyTransaction.id.desc()).all()

    credited_txs = [t for t in day_txs if t.transaction_type in [PocketMoneyTxTypeEnum.RECEIVED_FROM_PARENT, PocketMoneyTxTypeEnum.FEE_EXCESS_TRANSFER]]
    debited_txs = [t for t in day_txs if t.transaction_type == PocketMoneyTxTypeEnum.GIVEN_TO_STUDENT]
    refunded_txs = [t for t in day_txs if t.transaction_type == PocketMoneyTxTypeEnum.RETURNED_TO_PARENT]

    total_credited = sum(t.amount for t in credited_txs)
    students_credited = len(set(t.student_id for t in credited_txs))
    transactions_credited = len(credited_txs)

    total_debited = sum(t.amount for t in debited_txs)
    students_debited = len(set(t.student_id for t in debited_txs))
    transactions_debited = len(debited_txs)

    total_refunded = sum(t.amount for t in refunded_txs)
    students_refunded = len(set(t.student_id for t in refunded_txs))
    transactions_refunded = len(refunded_txs)

    total_money_moved = total_credited + total_debited + total_refunded
    unique_students = len(set(t.student_id for t in day_txs))
    total_tx_count = len(day_txs)
    net_change = total_credited - total_debited - total_refunded

    # Format transactions schemas latest first
    tx_schemas = []
    for t in day_txs:
        student = db.query(Student).filter(Student.id == t.student_id).first()
        curr_enr = next((e for e in student.enrollments if e.is_current), None) if student else None
        created_at_str = t.created_at.strftime("%Y-%m-%d %H:%M") if t.created_at else f"{t.transaction_date} 00:00"
        tx_schemas.append(PocketMoneyTxSchema(
            id=t.id,
            student_id=t.student_id,
            student_name=student.name if student else "Unknown",
            pay_id=student.pay_id if student else "",
            academic_level=curr_enr.academic_level if curr_enr else "",
            standard=curr_enr.standard.value if curr_enr and curr_enr.standard else "",
            section=curr_enr.section.value if curr_enr and curr_enr.section else "",
            transaction_date=t.transaction_date,
            created_at=created_at_str,
            transaction_type=t.transaction_type,
            amount=t.amount,
            source_or_recipient=t.source_or_recipient,
            receipt_ref=t.receipt_ref,
            remarks=t.remarks
        ))

    return DailyStatementSchema(
        date=target_date,
        total_credited=total_credited,
        students_credited=students_credited,
        transactions_credited=transactions_credited,
        total_debited=total_debited,
        students_debited=students_debited,
        transactions_debited=transactions_debited,
        total_refunded=total_refunded,
        students_refunded=students_refunded,
        transactions_refunded=transactions_refunded,
        total_money_moved=total_money_moved,
        unique_students_with_activity=unique_students,
        total_transactions_count=total_tx_count,
        net_change=net_change,
        currently_held_balance=currently_held_balance,
        transactions=tx_schemas
    )

def get_monthly_statement(db: Session, year: int, month: int) -> MonthlyStatementSchema:
    all_txs = db.query(PocketMoneyTransaction).all()
    overall_rec = sum(t.amount for t in all_txs if t.transaction_type in [PocketMoneyTxTypeEnum.RECEIVED_FROM_PARENT, PocketMoneyTxTypeEnum.FEE_EXCESS_TRANSFER])
    overall_giv = sum(t.amount for t in all_txs if t.transaction_type == PocketMoneyTxTypeEnum.GIVEN_TO_STUDENT)
    overall_ret = sum(t.amount for t in all_txs if t.transaction_type == PocketMoneyTxTypeEnum.RETURNED_TO_PARENT)
    currently_held_balance = overall_rec - overall_giv - overall_ret

    month_str = f"{month:02d}"
    year_str = str(year)
    prefix = f"{year_str}-{month_str}"

    month_txs = db.query(PocketMoneyTransaction).filter(
        PocketMoneyTransaction.transaction_date.like(f"{prefix}%")
    ).order_by(PocketMoneyTransaction.id.desc()).all()

    credited_txs = [t for t in month_txs if t.transaction_type in [PocketMoneyTxTypeEnum.RECEIVED_FROM_PARENT, PocketMoneyTxTypeEnum.FEE_EXCESS_TRANSFER]]
    debited_txs = [t for t in month_txs if t.transaction_type == PocketMoneyTxTypeEnum.GIVEN_TO_STUDENT]
    refunded_txs = [t for t in month_txs if t.transaction_type == PocketMoneyTxTypeEnum.RETURNED_TO_PARENT]

    total_credited = sum(t.amount for t in credited_txs)
    students_credited = len(set(t.student_id for t in credited_txs))
    transactions_credited = len(credited_txs)

    total_debited = sum(t.amount for t in debited_txs)
    students_debited = len(set(t.student_id for t in debited_txs))
    transactions_debited = len(debited_txs)

    total_refunded = sum(t.amount for t in refunded_txs)
    students_refunded = len(set(t.student_id for t in refunded_txs))
    transactions_refunded = len(refunded_txs)

    total_money_moved = total_credited + total_debited + total_refunded
    unique_students = len(set(t.student_id for t in month_txs))
    total_tx_count = len(month_txs)
    net_change = total_credited - total_debited - total_refunded

    # Build Day-by-Day Breakdown for the month
    num_days = calendar.monthrange(year, month)[1]
    day_by_day = []

    for d in range(num_days, 0, -1):  # Latest day first
        day_date_str = f"{year_str}-{month_str}-{d:02d}"
        dtxs = [t for t in month_txs if t.transaction_date == day_date_str]
        if not dtxs:
            continue

        d_cred = sum(t.amount for t in dtxs if t.transaction_type == PocketMoneyTxTypeEnum.RECEIVED_FROM_PARENT)
        d_cred_st = len(set(t.student_id for t in dtxs if t.transaction_type == PocketMoneyTxTypeEnum.RECEIVED_FROM_PARENT))
        d_deb = sum(t.amount for t in dtxs if t.transaction_type == PocketMoneyTxTypeEnum.GIVEN_TO_STUDENT)
        d_deb_st = len(set(t.student_id for t in dtxs if t.transaction_type == PocketMoneyTxTypeEnum.GIVEN_TO_STUDENT))
        d_ref = sum(t.amount for t in dtxs if t.transaction_type == PocketMoneyTxTypeEnum.RETURNED_TO_PARENT)
        d_ref_st = len(set(t.student_id for t in dtxs if t.transaction_type == PocketMoneyTxTypeEnum.RETURNED_TO_PARENT))
        d_uniq = len(set(t.student_id for t in dtxs))
        d_net = d_cred - d_deb - d_ref

        day_by_day.append(DayByDayBreakdownSchema(
            date=day_date_str,
            credited=d_cred,
            students_credited=d_cred_st,
            debited=d_deb,
            students_debited=d_deb_st,
            refunded=d_ref,
            students_refunded=d_ref_st,
            unique_students=d_uniq,
            net_change=d_net
        ))

    month_name = calendar.month_name[month]
    month_label = f"{month_name} {year}"

    # Format transactions schemas latest first
    tx_schemas = []
    for t in month_txs:
        student = db.query(Student).filter(Student.id == t.student_id).first()
        curr_enr = next((e for e in student.enrollments if e.is_current), None) if student else None
        created_at_str = t.created_at.strftime("%Y-%m-%d %H:%M") if t.created_at else f"{t.transaction_date} 00:00"
        tx_schemas.append(PocketMoneyTxSchema(
            id=t.id,
            student_id=t.student_id,
            student_name=student.name if student else "Unknown",
            pay_id=student.pay_id if student else "",
            academic_level=curr_enr.academic_level if curr_enr else "",
            standard=curr_enr.standard.value if curr_enr and curr_enr.standard else "",
            section=curr_enr.section.value if curr_enr and curr_enr.section else "",
            transaction_date=t.transaction_date,
            created_at=created_at_str,
            transaction_type=t.transaction_type,
            amount=t.amount,
            source_or_recipient=t.source_or_recipient,
            receipt_ref=t.receipt_ref,
            remarks=t.remarks
        ))

    return MonthlyStatementSchema(
        year=year,
        month=month,
        month_label=month_label,
        total_credited=total_credited,
        students_credited=students_credited,
        transactions_credited=transactions_credited,
        total_debited=total_debited,
        students_debited=students_debited,
        transactions_debited=transactions_debited,
        total_refunded=total_refunded,
        students_refunded=students_refunded,
        transactions_refunded=transactions_refunded,
        total_money_moved=total_money_moved,
        unique_students_with_activity=unique_students,
        total_transactions_count=total_tx_count,
        net_change=net_change,
        currently_held_balance=currently_held_balance,
        day_by_day=day_by_day,
        transactions=tx_schemas
    )
