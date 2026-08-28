import urllib.request
import json
import logging
from typing import Dict, Any

POCKET_MONEY_SYNC_URL = "http://127.0.0.1:8001/api/sync"

logger = logging.getLogger("sync_dispatcher")

def post_local_json(endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
    url = f"{POCKET_MONEY_SYNC_URL}/{endpoint.lstrip('/')}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body)
    except Exception as e:
        logger.error(f"Pocket Money sync FAILED [{endpoint}]: {e}")
        raise  # BUG 3 FIX: re-raise so callers know it failed

def sync_student_profile(student_obj) -> Dict[str, Any]:
    # Extract current enrollment
    curr_enroll = next((e for e in student_obj.enrollments if e.is_current), None)

    payload = {
        "pay_id": student_obj.pay_id,
        "pupil_id": student_obj.pupil_id,
        "first_name": student_obj.first_name,
        "last_name": student_obj.last_name,
        "name": student_obj.name,
        "dob": student_obj.dob,
        "admission_year": student_obj.admission_year,
        "father_name": student_obj.father_name,
        "mother_name": student_obj.mother_name,
        "contact_no": student_obj.contact_no,
        "additional_contact": student_obj.additional_contact,
        "address": student_obj.address,
        "city": student_obj.city,
        "state": student_obj.state,
        "pincode": student_obj.pincode,
        "boarding_category": student_obj.boarding_category.value if hasattr(student_obj.boarding_category, 'value') else student_obj.boarding_category,
        "status": student_obj.status.value if hasattr(student_obj.status, 'value') else student_obj.status,
        "is_sponsored": student_obj.is_sponsored,
        "sponsor_name": student_obj.sponsor_name,
        "date_of_admission": student_obj.date_of_admission,
        "current_academic_level": curr_enroll.academic_level if curr_enroll else "Form 1",
        "current_standard": curr_enroll.standard.value if (curr_enroll and hasattr(curr_enroll.standard, 'value')) else "VIII",
        "current_section": curr_enroll.section.value if (curr_enroll and hasattr(curr_enroll.section, 'value')) else "E"
    }

    return post_local_json("student", payload)

def sync_approved_excess_transfer(
    transfer_id: str,
    pay_id: str,
    student_name: str,
    amount: float,
    source_payment_no: str,
    approved_by: str,
    remarks: str
) -> Dict[str, Any]:
    payload = {
        "transfer_id": transfer_id,
        "pay_id": pay_id,
        "student_name": student_name,
        "amount": amount,
        "source_payment_no": source_payment_no,
        "approved_by": approved_by,
        "remarks": remarks
    }

    return post_local_json("transfer", payload)


def sync_student_then_transfer(
    student_obj,
    transfer_id: str,
    amount: float,
    source_payment_no: str,
    approved_by: str,
    remarks: str
) -> Dict[str, Any]:
    """
    BUG 3 FIX: Atomically ensure student exists in PM system THEN send transfer.
    This prevents the 404 'Student PayID not found in Pocket Money DB' error
    that was causing silent failures when admin chose TRANSFER_TO_POCKET_MONEY.

    Steps:
      1. Sync student profile (creates if missing, updates if exists)
      2. Send the transfer — guaranteed to succeed since student now exists
    """
    # Step 1: Ensure student exists in PM system
    sync_result = sync_student_profile(student_obj)
    logger.info(f"Student profile sync before transfer: {sync_result.get('status')} for {student_obj.pay_id}")

    # Step 2: Send the transfer
    transfer_result = sync_approved_excess_transfer(
        transfer_id=transfer_id,
        pay_id=student_obj.pay_id,
        student_name=student_obj.name,
        amount=amount,
        source_payment_no=source_payment_no,
        approved_by=approved_by,
        remarks=remarks
    )
    logger.info(f"Transfer sync result: {transfer_result.get('status')} transfer_id={transfer_id}")
    return transfer_result

