from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
from database import get_db
from models import (
    Student, AcademicEnrollment, FeePayment, PaymentAllocation,
    PocketMoneyTransaction, BoardingCategoryEnum, StandardEnum, SectionEnum,
    StudentStatusEnum, PocketMoneyTxTypeEnum, FeeDeficit, FeeExcess,
    DeficitStatusEnum, ExcessStatusEnum
)
from services.fee_service import calculate_student_fee_overview, get_or_create_fee_structure
from services.pocket_money_service import calculate_pocket_money_summary
from routers.students import get_current_academic_year

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/dashboard-summary")
def get_dashboard_summary(
    academic_year: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    acad_year = academic_year if isinstance(academic_year, str) and academic_year else get_current_academic_year(db)

    # 1. Student Status Counts
    total_configured_students = db.query(Student).count()
    active_count = db.query(Student).filter(Student.status == StudentStatusEnum.ACTIVE).count()
    transferred_count = db.query(Student).filter(Student.status == StudentStatusEnum.TRANSFERRED).count()
    finished_count = db.query(Student).filter(Student.status == StudentStatusEnum.FINISHED).count()
    total_classes = 17

    # 2. Fee Financial Overview & Term Breakdown
    students = db.query(Student).all()
    
    total_expected = 0.0
    total_collected = 0.0
    total_outstanding = 0.0

    term_1_exp, term_1_paid, term_1_due = 0.0, 0.0, 0.0
    term_2_exp, term_2_paid, term_2_due = 0.0, 0.0, 0.0
    term_3_exp, term_3_paid, term_3_due = 0.0, 0.0, 0.0

    status_counts = {
        "Fully Paid": 0,
        "Two Terms Paid": 0,
        "One Term Paid": 0,
        "No Fees Paid": 0,
    }

    for s in students:
        fee_overview = calculate_student_fee_overview(db, s, acad_year)
        total_expected += fee_overview.total_expected
        total_collected += fee_overview.total_paid
        total_outstanding += fee_overview.total_due

        if fee_overview.terms_paid_count == 3:
            status_counts["Fully Paid"] += 1
        elif fee_overview.terms_paid_count == 2:
            status_counts["Two Terms Paid"] += 1
        elif fee_overview.terms_paid_count == 1:
            status_counts["One Term Paid"] += 1
        else:
            status_counts["No Fees Paid"] += 1

        t1 = fee_overview.term_details[0] if len(fee_overview.term_details) > 0 else None
        t2 = fee_overview.term_details[1] if len(fee_overview.term_details) > 1 else None
        t3 = fee_overview.term_details[2] if len(fee_overview.term_details) > 2 else None

        if t1:
            term_1_exp += t1.expected_amount
            term_1_paid += t1.paid_amount
            term_1_due += t1.due_amount
        if t2:
            term_2_exp += t2.expected_amount
            term_2_paid += t2.paid_amount
            term_2_due += t2.due_amount
        if t3:
            term_3_exp += t3.expected_amount
            term_3_paid += t3.paid_amount
            term_3_due += t3.due_amount

    collection_percentage = round((total_collected / total_expected * 100), 1) if total_expected > 0 else 0.0

    # 3. Pocket Money Summary (from actual pocket_money_transactions in this DB)
    pocket_txs = db.query(PocketMoneyTransaction).all()
    pm_student_ids = set(tx.student_id for tx in pocket_txs)

    active_hostellers_count = db.query(Student).filter(
        Student.status == StudentStatusEnum.ACTIVE,
        Student.boarding_category.in_([BoardingCategoryEnum.HOSTEL_ORDINARY, BoardingCategoryEnum.HOSTEL_SPECIAL])
    ).count()

    # BUG 2 FIX: FEE_EXCESS_TRANSFER is a credit just like RECEIVED_FROM_PARENT
    credit_types = {PocketMoneyTxTypeEnum.RECEIVED_FROM_PARENT, PocketMoneyTxTypeEnum.FEE_EXCESS_TRANSFER}
    pm_received = sum(tx.amount for tx in pocket_txs if tx.transaction_type in credit_types)
    pm_given = sum(tx.amount for tx in pocket_txs if tx.transaction_type == PocketMoneyTxTypeEnum.GIVEN_TO_STUDENT)
    pm_returned = sum(tx.amount for tx in pocket_txs if tx.transaction_type == PocketMoneyTxTypeEnum.RETURNED_TO_PARENT)
    pm_held = max(0.0, pm_received - pm_given - pm_returned)

    # 4. Rule 27 — 6 SEPARATE FEE FINANCIAL SUMMARY FIGURES (no netting)
    # Rule 25 — FEES COLLECTED: money actually allocated to school fees via PaymentAllocation
    fees_collected = db.query(PaymentAllocation).join(FeePayment).with_entities(
        PaymentAllocation.allocated_amount
    ).all()
    total_fees_collected = sum(r[0] for r in fees_collected)

    # Rule 26 — FEE TO COLLECT: current outstanding school fees (sum of outstanding deficits)
    outstanding_deficits = db.query(FeeDeficit).filter(
        FeeDeficit.status.in_([DeficitStatusEnum.OUTSTANDING, DeficitStatusEnum.PARTIALLY_CLEARED])
    ).all()
    total_fee_to_collect = sum(d.deficit_amount for d in outstanding_deficits)

    # Rule 24 — POCKET MONEY HELD: actual balances in student pocket money accounts
    # (same data as the Pocket Money system — no double-counting with Fee Excess)
    pocket_money_held = pm_held

    # Rule 22 — POCKET MONEY ON HOLD: excess approved for PM but not yet transferred
    pm_on_hold_rows = db.query(FeeExcess).filter(
        FeeExcess.status == ExcessStatusEnum.APPROVED_FOR_POCKET_MONEY
    ).all()
    pocket_money_on_hold = sum(e.excess_amount for e in pm_on_hold_rows)

    # Rule 18/19 — MONEY TO RETURN TO PARENT
    return_parent_rows = db.query(FeeExcess).filter(
        FeeExcess.status == ExcessStatusEnum.RETURN_TO_PARENT
    ).all()
    money_to_return_parent = sum(e.excess_amount for e in return_parent_rows)

    # Rule 20/21 — MONEY TO RETURN TO SPONSOR
    return_sponsor_rows = db.query(FeeExcess).filter(
        FeeExcess.status == ExcessStatusEnum.RETURN_TO_SPONSOR
    ).all()
    money_to_return_sponsor = sum(e.excess_amount for e in return_sponsor_rows)

    return {
        "academic_year": acad_year,
        "students": {
            "total_configured": total_configured_students,
            "active": active_count,
            "transferred": transferred_count,
            "finished": finished_count,
            "total_classes": total_classes,
        },
        "fee_summary": {
            "total_expected": total_expected,
            "total_collected": total_collected,
            "total_outstanding": total_outstanding,
            "collection_percentage": collection_percentage,
            "terms": {
                "term_1": {"expected": term_1_exp, "collected": term_1_paid, "due": term_1_due},
                "term_2": {"expected": term_2_exp, "collected": term_2_paid, "due": term_2_due},
                "term_3": {"expected": term_3_exp, "collected": term_3_paid, "due": term_3_due},
            },
            "status_counts": status_counts,
        },
        "pocket_money": {
            "students_count": len(pm_student_ids),
            "hostellers_count": active_hostellers_count,
            "total_received": pm_received,
            "total_given": pm_given,
            "total_returned": pm_returned,
            "currently_held": pm_held,
        },
        # Rule 27: 6 separate summary figures — never combined or netted
        "fee_financials": {
            "fees_collected": round(total_fees_collected, 2),
            "fee_to_collect": round(total_fee_to_collect, 2),
            "pocket_money_held": round(pocket_money_held, 2),
            "pocket_money_on_hold": round(pocket_money_on_hold, 2),
            "money_to_return_parent": round(money_to_return_parent, 2),
            "money_to_return_sponsor": round(money_to_return_sponsor, 2),
        }
    }

@router.get("/fee-drilldown")
def get_fee_drilldown(
    academic_year: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    acad_year = academic_year if isinstance(academic_year, str) and academic_year else get_current_academic_year(db)
    students = db.query(Student).all()

    # Pre-populate terms and academic levels / standards
    terms_map = {
        "Term 1": {"expected": 0.0, "collected": 0.0, "due": 0.0, "standards": {}},
        "Term 2": {"expected": 0.0, "collected": 0.0, "due": 0.0, "standards": {}},
        "Term 3": {"expected": 0.0, "collected": 0.0, "due": 0.0, "standards": {}},
    }

    standards_list = ["VIII", "IX", "X", "XI", "XII"]
    std_to_level = {
        "VIII": "Form 1",
        "IX": "Form 2",
        "X": "Form 3",
        "XI": "11",
        "XII": "12"
    }

    for t_name in terms_map.keys():
        for std in standards_list:
            sections = ["E", "EE", "G", "GG"] if std in ["VIII", "IX"] else ["A", "B", "S"]
            sec_map = {
                sec: {"expected": 0.0, "collected": 0.0, "due": 0.0, "student_count": 0}
                for sec in sections
            }
            terms_map[t_name]["standards"][std] = {
                "academic_level": std_to_level.get(std, std),
                "expected": 0.0,
                "collected": 0.0,
                "due": 0.0,
                "student_count": 0,
                "sections": sec_map
            }

    for s in students:
        curr_enrollment = db.query(AcademicEnrollment).filter(
            AcademicEnrollment.student_id == s.id,
            AcademicEnrollment.is_current == True
        ).first()

        std_key = curr_enrollment.standard.value if curr_enrollment else "VIII"
        sec_key = curr_enrollment.section.value if curr_enrollment else "E"

        fee_overview = calculate_student_fee_overview(db, s, acad_year)

        for t_detail in fee_overview.term_details:
            t_name = t_detail.term_name
            if t_name in terms_map:
                exp = t_detail.expected_amount
                paid = t_detail.paid_amount
                due = t_detail.due_amount

                # Term totals
                terms_map[t_name]["expected"] += exp
                terms_map[t_name]["collected"] += paid
                terms_map[t_name]["due"] += due

                # Standard totals
                if std_key in terms_map[t_name]["standards"]:
                    std_node = terms_map[t_name]["standards"][std_key]
                    std_node["expected"] += exp
                    std_node["collected"] += paid
                    std_node["due"] += due
                    std_node["student_count"] += 1

                    # Section totals
                    if sec_key in std_node["sections"]:
                        sec_node = std_node["sections"][sec_key]
                        sec_node["expected"] += exp
                        sec_node["collected"] += paid
                        sec_node["due"] += due
                        sec_node["student_count"] += 1

    return {
        "academic_year": acad_year,
        "terms": terms_map
    }
