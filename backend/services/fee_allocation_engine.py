from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Dict, Any, Optional
import models
from models import PocketMoneyTxTypeEnum


def get_student_fee_structure(db: Session, boarding_category: str, academic_year: str = "2026-2027") -> Dict[str, float]:
    structure = db.query(models.FeeStructure).filter(
        models.FeeStructure.academic_year == academic_year,
        models.FeeStructure.boarding_category == boarding_category
    ).first()

    if structure:
        return {
            "Term 1": structure.term_1_amount,
            "Term 2": structure.term_2_amount,
            "Term 3": structure.term_3_amount,
        }

    if boarding_category == "DAY_SCHOLAR":
        return {"Term 1": 1500.0, "Term 2": 1500.0, "Term 3": 1500.0}
    elif boarding_category == "HOSTEL_SPECIAL":
        return {"Term 1": 4400.0, "Term 2": 4400.0, "Term 3": 4400.0}
    else:
        return {"Term 1": 2800.0, "Term 2": 2800.0, "Term 3": 2800.0}


def calculate_payment_allocation_preview(
    db: Session,
    student_id: int,
    amount_received: float,
    selected_term_names: List[str],
    academic_year: str = "2026-2027"
) -> Dict[str, Any]:
    """
    Rule 1:  amount_received is CURRENT PAYMENT. Never changed.
    Rule 2:  Previous transactions remain historical records.
    Rule 3:  current_outstanding = term_fee - previously_paid.
    Rule 4:  Existing outstanding cleared first; remaining goes to term selection.
    Rule 5:  remaining = current_payment - existing_outstanding_cleared.
    Rule 6:  Administrator selects terms freely; NO sequential locking.
    Rule 11: Per-term 5-field breakdown.
    Rule 12: current_payment == deficit_cleared + term_allocs + excess (exact balance).
    Rule 39: Balance check enforced.
    """
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise ValueError(f"Student ID {student_id} not found")

    term_prices = get_student_fee_structure(db, student.boarding_category, academic_year)

    # ── STEP 1: Existing outstanding deficits (Rules 3, 4, 5) ─────────────
    existing_deficits = db.query(models.FeeDeficit).filter(
        models.FeeDeficit.student_id == student_id,
        models.FeeDeficit.academic_year == academic_year,
        models.FeeDeficit.status.in_([
            models.DeficitStatusEnum.OUTSTANDING,
            models.DeficitStatusEnum.PARTIALLY_CLEARED
        ])
    ).all()

    total_existing_deficit = sum(d.deficit_amount for d in existing_deficits)
    deficit_cleared_total = min(amount_received, total_existing_deficit)
    amount_left_for_terms = max(0.0, amount_received - deficit_cleared_total)

    existing_deficit_items = []
    rem_deficit_payment = amount_received
    for d in existing_deficits:
        cleared_for_this = min(rem_deficit_payment, d.deficit_amount)
        rem_deficit_payment -= cleared_for_this
        # FIX: use .value so the key is 'Term 1', not 'TermNameEnum.TERM_1'
        tname_str = d.term_name.value if hasattr(d.term_name, 'value') else str(d.term_name)
        existing_deficit_items.append({
            "deficit_id": d.id,
            "term_name": tname_str,
            "original_deficit": d.deficit_amount,
            "cleared_amount": cleared_for_this,
            "remaining_deficit": d.deficit_amount - cleared_for_this
        })

    # ── STEP 2: Historical allocations per term (Rules 2, 3, 11) ──────────
    term_previously_paid: Dict[str, float] = {}
    for tname in ["Term 1", "Term 2", "Term 3"]:
        allocs = db.query(models.PaymentAllocation).join(models.FeePayment).filter(
            models.FeePayment.student_id == student_id,
            models.FeePayment.academic_year == academic_year,
            models.PaymentAllocation.term_name == tname
        ).all()
        term_previously_paid[tname] = sum(a.allocated_amount for a in allocs)

    # Map deficit-cleared amounts to terms (plain string keys)
    cleared_deficit_per_term: Dict[str, float] = {}
    for item in existing_deficit_items:
        tname = item["term_name"]   # already a plain string
        if tname:
            cleared_deficit_per_term[tname] = cleared_deficit_per_term.get(tname, 0.0) + item["cleared_amount"]

    # ── STEP 3: Per-term allocation (Rules 6-11) ───────────────────────────
    # NO sequential lock. Admin may select any term freely.
    # A term is only non-selectable if it is ALREADY FULLY PAID.
    term_allocations = []
    current_pool = amount_left_for_terms
    term_fees_allocated = 0.0
    total_new_deficits = 0.0

    for term_name in ["Term 1", "Term 2", "Term 3"]:
        fee = term_prices.get(term_name, 2800.0)
        hist_paid = term_previously_paid.get(term_name, 0.0)
        deficit_clr = cleared_deficit_per_term.get(term_name, 0.0)
        effective_prior = hist_paid + deficit_clr
        outstanding_before = max(0.0, fee - effective_prior)
        is_fully_paid_prior = effective_prior >= fee

        # Only lock if already fully paid — no other lock
        is_locked = is_fully_paid_prior
        lock_reason = f"Already fully paid (K {effective_prior:,.0f})" if is_fully_paid_prior else ""

        is_selected = (term_name in selected_term_names) and not is_locked

        if is_selected:
            allocated = min(current_pool, outstanding_before)
            current_pool -= allocated
            term_fees_allocated += allocated
            new_deficit = max(0.0, outstanding_before - allocated)
            total_new_deficits += new_deficit

            total_paid_after = hist_paid + deficit_clr + allocated
            current_outstanding_after = max(0.0, fee - total_paid_after)

            if current_outstanding_after < 0.01:
                term_status = "FULLY PAID"
            elif new_deficit > 0:
                term_status = "PARTIAL"
            else:
                term_status = "ALLOCATED"

            term_allocations.append({
                "term_name": term_name,
                "is_selected": True,
                "is_locked": False,
                "lock_reason": "",
                "expected_fee": fee,
                "previously_paid": hist_paid,
                "cleared_from_deficit": deficit_clr,
                "already_paid": hist_paid,
                "needed_for_term": outstanding_before,
                "allocated_amount": allocated,
                "calculated_deficit": new_deficit,
                "total_paid_after": total_paid_after,
                "current_outstanding": current_outstanding_after,
                "status": term_status
            })
        else:
            total_paid_after = hist_paid + deficit_clr
            current_outstanding_after = max(0.0, fee - total_paid_after)

            if is_fully_paid_prior:
                status_label = "FULLY PAID"
            elif hist_paid > 0 or deficit_clr > 0:
                status_label = "PARTIALLY PAID"
            else:
                status_label = "NOT SELECTED"

            term_allocations.append({
                "term_name": term_name,
                "is_selected": False,
                "is_locked": is_locked,
                "lock_reason": lock_reason,
                "expected_fee": fee,
                "previously_paid": hist_paid,
                "cleared_from_deficit": deficit_clr,
                "already_paid": hist_paid,
                "needed_for_term": outstanding_before,
                "allocated_amount": 0.0,
                "calculated_deficit": 0.0,
                "total_paid_after": total_paid_after,
                "current_outstanding": current_outstanding_after,
                "status": status_label
            })

    # ── STEP 4: Remaining excess (Rules 13-15) ────────────────────────────
    remaining_excess = current_pool

    # ── RULE 12/39: BALANCE CHECK ─────────────────────────────────────────
    balance = deficit_cleared_total + term_fees_allocated + remaining_excess
    if abs(amount_received - balance) > 0.01:
        raise ValueError(
            f"Balance check failed: K{amount_received} != "
            f"deficit_cleared K{deficit_cleared_total} + "
            f"term_allocs K{term_fees_allocated} + "
            f"excess K{remaining_excess} = K{balance}"
        )

    return {
        "student_id": student.id,
        "pay_id": student.pay_id,
        "student_name": student.name,
        "is_sponsored": student.is_sponsored,
        "sponsor_name": student.sponsor_name,
        "amount_received": amount_received,
        "existing_deficit_total": total_existing_deficit,
        "existing_deficit_cleared": deficit_cleared_total,
        "existing_deficit_items": existing_deficit_items,
        "amount_left_for_terms": amount_left_for_terms,
        "term_allocations": term_allocations,
        "fees_collected": deficit_cleared_total + term_fees_allocated,
        "deficit_cleared": deficit_cleared_total,
        "term_fees_allocated": term_fees_allocated,
        "total_fees_allocated": deficit_cleared_total + term_fees_allocated,
        "total_new_deficits": total_new_deficits,
        "remaining_excess": remaining_excess,
        "balance_check": {
            "amount_received": amount_received,
            "deficit_cleared": deficit_cleared_total,
            "term_fees_allocated": term_fees_allocated,
            "remaining_excess": remaining_excess,
            "balance_ok": True
        }
    }


def process_interactive_fee_payment(
    db: Session,
    student_id: int,
    amount_received: float,
    selected_term_names: List[str],
    payment_date: str,
    payment_method: str = "CASH",
    receipt_no: Optional[str] = None,
    remarks: Optional[str] = None,
    user_id: Optional[int] = None,
    academic_year: str = "2026-2027",
    excess_action: Optional[str] = None
) -> models.FeePayment:
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise ValueError(f"Student ID {student_id} not found")

    preview = calculate_payment_allocation_preview(
        db=db,
        student_id=student_id,
        amount_received=amount_received,
        selected_term_names=selected_term_names,
        academic_year=academic_year
    )

    remaining_excess = preview["remaining_excess"]

    # Rules 16, 31: Explicit excess action required when excess exists
    if remaining_excess > 0 and not excess_action:
        raise ValueError(
            f"Excess of K{remaining_excess:,.0f} exists. "
            "Administrator must select: EXCESS, RETURN_TO_PARENT, "
            "RETURN_TO_SPONSOR, or TRANSFER_TO_POCKET_MONEY."
        )

    allowed_excess_actions = {
        "EXCESS", "TAG_AS_EXCESS", "RETURN_TO_PARENT",
        "RETURN_TO_SPONSOR", "TRANSFER_TO_POCKET_MONEY"
    }
    if excess_action and excess_action not in allowed_excess_actions:
        raise ValueError(f"Invalid excess action '{excess_action}'.")

    pay_count = db.query(models.FeePayment).count() + 1
    payment_no = f"PAY-2026-{pay_count:06d}"
    if not receipt_no:
        receipt_no = f"REC-2026-{pay_count:06d}"

    # Rule 1, 38: total_amount = ORIGINAL PAYMENT, preserved intact
    payment = models.FeePayment(
        payment_no=payment_no,
        student_id=student_id,
        academic_year=academic_year,
        payment_date=payment_date,
        expected_amount=preview["total_fees_allocated"],
        total_amount=amount_received,
        mismatch_amount=remaining_excess if student.is_sponsored else 0.0,
        amount_to_return_sponsor=0.0,
        payment_method=payment_method,
        receipt_no=receipt_no,
        recorded_by_user_id=user_id,
        remarks=remarks
    )
    db.add(payment)
    db.flush()

    # Rule 4: Clear existing deficits
    rem_pay = amount_received
    existing_deficits = db.query(models.FeeDeficit).filter(
        models.FeeDeficit.student_id == student_id,
        models.FeeDeficit.academic_year == academic_year,
        models.FeeDeficit.status.in_([
            models.DeficitStatusEnum.OUTSTANDING,
            models.DeficitStatusEnum.PARTIALLY_CLEARED
        ])
    ).all()

    for d in existing_deficits:
        if rem_pay <= 0:
            break
        cleared_amt = min(rem_pay, d.deficit_amount)
        rem_pay -= cleared_amt
        d.allocated_amount = (d.allocated_amount or 0.0) + cleared_amt
        d.deficit_amount -= cleared_amt
        d.cleared_by_payment_id = payment.id
        if d.deficit_amount <= 0.001:
            d.deficit_amount = 0.0
            d.status = models.DeficitStatusEnum.CLEARED
            d.cleared_at = datetime.utcnow()
        else:
            d.status = models.DeficitStatusEnum.PARTIALLY_CLEARED

        if cleared_amt > 0 and d.term_name:
            db.add(models.PaymentAllocation(
                fee_payment_id=payment.id,
                term_name=d.term_name,
                allocated_amount=cleared_amt
            ))

    # Rules 6, 7: Allocations and new deficits for selected terms
    for item in preview["term_allocations"]:
        if item["is_selected"]:
            if item["allocated_amount"] > 0:
                db.add(models.PaymentAllocation(
                    fee_payment_id=payment.id,
                    term_name=item["term_name"],
                    allocated_amount=item["allocated_amount"]
                ))
            if item["calculated_deficit"] > 0:
                db.add(models.FeeDeficit(
                    student_id=student_id,
                    academic_year=academic_year,
                    term_name=item["term_name"],
                    expected_amount=item["needed_for_term"],
                    allocated_amount=item["allocated_amount"],
                    deficit_amount=item["calculated_deficit"],
                    status=models.DeficitStatusEnum.OUTSTANDING,
                    fee_payment_id=payment.id,
                    created_at=datetime.utcnow()
                ))

    # Rules 13-23: FeeExcess with explicit decision
    if remaining_excess > 0:
        action_map = {
            "EXCESS": models.ExcessStatusEnum.EXCESS,
            "TAG_AS_EXCESS": models.ExcessStatusEnum.EXCESS,
            "RETURN_TO_PARENT": models.ExcessStatusEnum.RETURN_TO_PARENT,
            "RETURN_TO_SPONSOR": models.ExcessStatusEnum.RETURN_TO_SPONSOR,
            "TRANSFER_TO_POCKET_MONEY": models.ExcessStatusEnum.TRANSFERRED_TO_POCKET_MONEY,
        }
        ex_status = action_map.get(excess_action, models.ExcessStatusEnum.EXCESS)

        excess = models.FeeExcess(
            student_id=student_id,
            original_payment_id=payment.id,
            amount_received=amount_received,
            fees_allocated=preview["total_fees_allocated"],
            excess_amount=remaining_excess,
            status=ex_status,
            decision=excess_action,
            approved_by="Administrator",
            approved_at=datetime.utcnow(),
            remarks=f"Excess K{remaining_excess:,.0f} from Payment {payment_no}"
        )

        if excess_action == "RETURN_TO_SPONSOR":
            excess.sponsor_name = student.sponsor_name or "Govt Sponsor"
            excess.sponsor_type = "Govt Sponsor" if student.is_sponsored else "Sponsor"
            excess.amount_to_return_sponsor = remaining_excess

        db.add(excess)
        db.flush()

        # Rule 23: Pocket Money transaction only on explicit TRANSFER
        if excess_action == "TRANSFER_TO_POCKET_MONEY":
            excess.transfer_id = f"FEX-2026-{excess.id:06d}"

            # Create local PocketMoneyTransaction so main system pocket money views are updated
            pm_tx = models.PocketMoneyTransaction(
                student_id=student_id,
                transaction_date=payment_date,
                transaction_type=PocketMoneyTxTypeEnum.FEE_EXCESS_TRANSFER,
                amount=remaining_excess,
                source_or_recipient=f"Fee Excess (Payment #{payment_no})",
                receipt_ref=payment_no,
                remarks=f"Fee excess K{remaining_excess:,.0f} transferred to pocket money from {payment_no}"
            )
            db.add(pm_tx)


        if student.is_sponsored:
            student.has_mismatch = True
            student.mismatch_amount = (student.mismatch_amount or 0.0) + remaining_excess

    db.add(models.AuditLog(
        action="RECORD_FEE_PAYMENT",
        entity_type="FEE_PAYMENT",
        entity_id=str(payment.id),
        details=(
            f"Received K{amount_received:,.0f} from {student.name} (PayID: {student.pay_id}). "
            f"Deficit cleared: K{preview['deficit_cleared']:,.0f}. "
            f"Term allocations: K{preview['term_fees_allocated']:,.0f}. "
            f"Excess: K{remaining_excess:,.0f}" +
            (f" -> {excess_action}" if remaining_excess > 0 else ".")
        )
    ))

    db.commit()
    db.refresh(payment)
    return payment
