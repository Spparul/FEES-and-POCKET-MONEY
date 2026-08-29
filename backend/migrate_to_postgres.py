"""
Migration script: SQLite -> PostgreSQL

Reads data from the existing SQLite databases (school.db and pocket_money.db)
and inserts it into the centralized PostgreSQL database.

Prerequisites:
  1. PostgreSQL database must be created and accessible.
  2. Set DATABASE_URL environment variable (or use the default in database.py).
  3. Install psycopg2-binary: pip install psycopg2-binary

Usage:
  DATABASE_URL="postgresql://user:pass@host:5432/dbname" python migrate_to_postgres.py
"""

import os
import sys
import sqlite3
from datetime import datetime

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import DATABASE_URL, Base
import models

SCHOOL_DB_PATH = os.path.join(os.path.dirname(__file__), "school.db")
POCKET_MONEY_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "pocket_money_system", "backend", "pocket_money.db")


def get_sqlite_conn(db_path):
    if not os.path.exists(db_path):
        print(f"WARNING: SQLite database not found at {db_path}")
        return None
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def migrate():
    print(f"Target PostgreSQL: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
    print("=" * 60)

    # Create PostgreSQL engine and tables
    pg_engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    Base.metadata.create_all(bind=pg_engine)
    PgSession = sessionmaker(bind=pg_engine)
    pg_db = PgSession()

    # Check if data already exists
    existing_students = pg_db.execute(text("SELECT COUNT(*) FROM students")).scalar()
    if existing_students > 0:
        print(f"PostgreSQL already has {existing_students} students.")
        print("Aborting to avoid duplicate data. Drop tables first if you want a fresh migration.")
        pg_db.close()
        return

    # --- MIGRATE FROM school.db (primary source of truth) ---
    school_conn = get_sqlite_conn(SCHOOL_DB_PATH)
    if not school_conn:
        print("ERROR: school.db not found. Cannot migrate.")
        return

    print("\n--- Migrating from school.db ---")

    # 1. Users
    rows = school_conn.execute("SELECT * FROM users").fetchall()
    print(f"  Users: {len(rows)} records")
    for r in rows:
        pg_db.execute(text("""
            INSERT INTO users (id, username, password_hash, full_name, role, created_at)
            VALUES (:id, :username, :password_hash, :full_name, :role, :created_at)
        """), dict(r))
    pg_db.commit()

    # 2. System Settings
    rows = school_conn.execute("SELECT * FROM system_settings").fetchall()
    print(f"  System Settings: {len(rows)} records")
    for r in rows:
        pg_db.execute(text("""
            INSERT INTO system_settings (id, setting_key, setting_value, updated_at)
            VALUES (:id, :setting_key, :setting_value, :updated_at)
        """), dict(r))
    pg_db.commit()

    # 3. Students
    rows = school_conn.execute("SELECT * FROM students").fetchall()
    print(f"  Students: {len(rows)} records")
    for r in rows:
        d = dict(r)
        d["is_sponsored"] = bool(d.get("is_sponsored"))
        d["has_mismatch"] = bool(d.get("has_mismatch"))
        pg_db.execute(text("""
            INSERT INTO students (id, admission_no, pay_id, pupil_id, first_name, last_name, name,
                dob, admission_year, father_name, mother_name, contact_no, additional_contact,
                address, city, state, pincode, boarding_category, status,
                is_sponsored, sponsor_type, sponsor_name, scholarship_type,
                has_mismatch, mismatch_amount, amount_to_return_sponsor,
                remarks, date_of_admission, created_at)
            VALUES (:id, :admission_no, :pay_id, :pupil_id, :first_name, :last_name, :name,
                :dob, :admission_year, :father_name, :mother_name, :contact_no, :additional_contact,
                :address, :city, :state, :pincode, :boarding_category, :status,
                :is_sponsored, :sponsor_type, :sponsor_name, :scholarship_type,
                :has_mismatch, :mismatch_amount, :amount_to_return_sponsor,
                :remarks, :date_of_admission, :created_at)
        """), d)
    pg_db.commit()

    # 4. Academic Enrollments
    rows = school_conn.execute("SELECT * FROM academic_enrollments").fetchall()
    print(f"  Academic Enrollments: {len(rows)} records")
    for r in rows:
        d = dict(r)
        d["is_current"] = bool(d.get("is_current"))
        pg_db.execute(text("""
            INSERT INTO academic_enrollments (id, student_id, academic_year, academic_level, standard, section, is_current)
            VALUES (:id, :student_id, :academic_year, :academic_level, :standard, :section, :is_current)
        """), d)
    pg_db.commit()

    # 5. Fee Structures
    rows = school_conn.execute("SELECT * FROM fee_structures").fetchall()
    print(f"  Fee Structures: {len(rows)} records")
    for r in rows:
        pg_db.execute(text("""
            INSERT INTO fee_structures (id, academic_year, boarding_category, term_1_amount, term_2_amount, term_3_amount)
            VALUES (:id, :academic_year, :boarding_category, :term_1_amount, :term_2_amount, :term_3_amount)
        """), dict(r))
    pg_db.commit()

    # 6. Fee Payments
    rows = school_conn.execute("SELECT * FROM fee_payments").fetchall()
    print(f"  Fee Payments: {len(rows)} records")
    for r in rows:
        pg_db.execute(text("""
            INSERT INTO fee_payments (id, payment_no, student_id, academic_year, payment_date,
                expected_amount, total_amount, mismatch_amount, amount_to_return_sponsor,
                payment_method, receipt_no, recorded_by_user_id, remarks, created_at)
            VALUES (:id, :payment_no, :student_id, :academic_year, :payment_date,
                :expected_amount, :total_amount, :mismatch_amount, :amount_to_return_sponsor,
                :payment_method, :receipt_no, :recorded_by_user_id, :remarks, :created_at)
        """), dict(r))
    pg_db.commit()

    # 7. Payment Allocations
    rows = school_conn.execute("SELECT * FROM payment_allocations").fetchall()
    print(f"  Payment Allocations: {len(rows)} records")
    for r in rows:
        pg_db.execute(text("""
            INSERT INTO payment_allocations (id, fee_payment_id, term_name, allocated_amount)
            VALUES (:id, :fee_payment_id, :term_name, :allocated_amount)
        """), dict(r))
    pg_db.commit()

    # 8. Pocket Money Transactions (from school.db first)
    school_pm_txs = []
    try:
        rows = school_conn.execute("SELECT * FROM pocket_money_transactions").fetchall()
        school_pm_txs = [dict(r) for r in rows]
        print(f"  Pocket Money Transactions (school.db): {len(rows)} records")
    except Exception:
        print("  Pocket Money Transactions (school.db): table not found, skipping")

    for r in school_pm_txs:
        r.setdefault("transfer_id", None)
        r.setdefault("source_payment_no", None)
        pg_db.execute(text("""
            INSERT INTO pocket_money_transactions (id, student_id, transaction_date, transaction_type,
                amount, source_or_recipient, receipt_ref, transfer_id, source_payment_no, remarks, created_at)
            VALUES (:id, :student_id, :transaction_date, :transaction_type,
                :amount, :source_or_recipient, :receipt_ref, :transfer_id, :source_payment_no, :remarks, :created_at)
        """), r)
    pg_db.commit()

    # 9. Fee Deficits
    try:
        rows = school_conn.execute("SELECT * FROM fee_deficits").fetchall()
        print(f"  Fee Deficits: {len(rows)} records")
        for r in rows:
            pg_db.execute(text("""
                INSERT INTO fee_deficits (id, student_id, academic_year, term_name, expected_amount,
                    allocated_amount, deficit_amount, status, fee_payment_id, cleared_by_payment_id,
                    created_at, cleared_at)
                VALUES (:id, :student_id, :academic_year, :term_name, :expected_amount,
                    :allocated_amount, :deficit_amount, :status, :fee_payment_id, :cleared_by_payment_id,
                    :created_at, :cleared_at)
            """), dict(r))
        pg_db.commit()
    except Exception as e:
        print(f"  Fee Deficits: skipped ({e})")

    # 10. Fee Excesses
    try:
        rows = school_conn.execute("SELECT * FROM fee_excesses").fetchall()
        print(f"  Fee Excesses: {len(rows)} records")
        for r in rows:
            pg_db.execute(text("""
                INSERT INTO fee_excesses (id, student_id, original_payment_id, amount_received,
                    fees_allocated, excess_amount, status, decision, sponsor_name, sponsor_type,
                    amount_to_return_sponsor, approved_by, approved_at, transfer_id, remarks,
                    created_at, updated_at)
                VALUES (:id, :student_id, :original_payment_id, :amount_received,
                    :fees_allocated, :excess_amount, :status, :decision, :sponsor_name, :sponsor_type,
                    :amount_to_return_sponsor, :approved_by, :approved_at, :transfer_id, :remarks,
                    :created_at, :updated_at)
            """), dict(r))
        pg_db.commit()
    except Exception as e:
        print(f"  Fee Excesses: skipped ({e})")

    # 11. Audit Logs
    try:
        rows = school_conn.execute("SELECT * FROM audit_logs").fetchall()
        print(f"  Audit Logs: {len(rows)} records")
        for r in rows:
            pg_db.execute(text("""
                INSERT INTO audit_logs (id, action, entity_type, entity_id, details, timestamp)
                VALUES (:id, :action, :entity_type, :entity_id, :details, :timestamp)
            """), dict(r))
        pg_db.commit()
    except Exception as e:
        print(f"  Audit Logs: skipped ({e})")

    # 12. Sync Logs
    try:
        rows = school_conn.execute("SELECT * FROM sync_logs").fetchall()
        print(f"  Sync Logs: {len(rows)} records")
        for r in rows:
            pg_db.execute(text("""
                INSERT INTO sync_logs (id, event_id, event_type, payload, status, attempts, created_at)
                VALUES (:id, :event_id, :event_type, :payload, :status, :attempts, :created_at)
            """), dict(r))
        pg_db.commit()
    except Exception as e:
        print(f"  Sync Logs: skipped ({e})")

    school_conn.close()

    # --- MERGE pocket_money.db transactions that don't already exist ---
    pm_conn = get_sqlite_conn(POCKET_MONEY_DB_PATH)
    if pm_conn:
        print("\n--- Merging unique data from pocket_money.db ---")

        try:
            pm_txs = pm_conn.execute("SELECT * FROM pocket_money_transactions").fetchall()
            print(f"  Pocket Money Transactions (pocket_money.db): {len(pm_txs)} total")

            # Get existing transfer_ids to avoid duplicates
            existing_transfer_ids = set()
            result = pg_db.execute(text("SELECT transfer_id FROM pocket_money_transactions WHERE transfer_id IS NOT NULL"))
            for row in result:
                existing_transfer_ids.add(row[0])

            # Get max ID to append new ones
            max_id = pg_db.execute(text("SELECT COALESCE(MAX(id), 0) FROM pocket_money_transactions")).scalar()

            merged_count = 0
            for r in pm_txs:
                rd = dict(r)
                tid = rd.get("transfer_id")
                if tid and tid in existing_transfer_ids:
                    continue

                # Check by student pay_id matching
                # Since both DBs may have overlapping IDs, we match by transfer_id or unique combo
                if not tid:
                    # For transactions without transfer_id, check if an identical one already exists
                    check = pg_db.execute(text("""
                        SELECT COUNT(*) FROM pocket_money_transactions
                        WHERE student_id = :student_id
                          AND transaction_date = :transaction_date
                          AND transaction_type = :transaction_type
                          AND amount = :amount
                    """), {
                        "student_id": rd["student_id"],
                        "transaction_date": rd["transaction_date"],
                        "transaction_type": rd["transaction_type"],
                        "amount": rd["amount"]
                    }).scalar()
                    if check > 0:
                        continue

                max_id += 1
                rd["id"] = max_id
                rd.setdefault("transfer_id", None)
                rd.setdefault("source_payment_no", None)
                pg_db.execute(text("""
                    INSERT INTO pocket_money_transactions (id, student_id, transaction_date, transaction_type,
                        amount, source_or_recipient, receipt_ref, transfer_id, source_payment_no, remarks, created_at)
                    VALUES (:id, :student_id, :transaction_date, :transaction_type,
                        :amount, :source_or_recipient, :receipt_ref, :transfer_id, :source_payment_no, :remarks, :created_at)
                """), rd)
                merged_count += 1

            pg_db.commit()
            print(f"  Merged {merged_count} unique pocket money transactions from pocket_money.db")
        except Exception as e:
            print(f"  Pocket money merge error: {e}")
            pg_db.rollback()

        pm_conn.close()

    # Reset PostgreSQL sequences to continue after the max IDs
    print("\n--- Resetting PostgreSQL sequences ---")
    tables_with_id = [
        "users", "system_settings", "students", "academic_enrollments",
        "fee_structures", "fee_payments", "payment_allocations",
        "pocket_money_transactions", "audit_logs", "fee_deficits",
        "fee_excesses", "sync_logs"
    ]
    for table in tables_with_id:
        try:
            pg_db.execute(text(f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE((SELECT MAX(id) FROM {table}), 1))"))
        except Exception:
            pass
    pg_db.commit()

    # Final counts
    print("\n--- Migration Complete ---")
    print(f"  Students: {pg_db.execute(text('SELECT COUNT(*) FROM students')).scalar()}")
    print(f"  Enrollments: {pg_db.execute(text('SELECT COUNT(*) FROM academic_enrollments')).scalar()}")
    print(f"  Fee Payments: {pg_db.execute(text('SELECT COUNT(*) FROM fee_payments')).scalar()}")
    print(f"  Pocket Money Txs: {pg_db.execute(text('SELECT COUNT(*) FROM pocket_money_transactions')).scalar()}")
    print(f"  Fee Deficits: {pg_db.execute(text('SELECT COUNT(*) FROM fee_deficits')).scalar()}")
    print(f"  Fee Excesses: {pg_db.execute(text('SELECT COUNT(*) FROM fee_excesses')).scalar()}")

    pg_db.close()
    print("\nDone! Both applications now share the same PostgreSQL database.")


if __name__ == "__main__":
    migrate()
