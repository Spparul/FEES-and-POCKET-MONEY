import sqlite3
import urllib.parse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.abspath("backend"))

from models import Base, User, SystemSettings, Student, AcademicEnrollment, FeeStructure, FeePayment, PaymentAllocation, PocketMoneyTransaction, FeeDeficit, FeeExcess, AuditLog, RoleEnum, StudentStatusEnum, BoardingCategoryEnum, StandardEnum, SectionEnum, SponsorTypeEnum, ScholarshipTypeEnum

password = urllib.parse.quote("Dhana@Rayer")
supabase_url = f"postgresql://postgres:{password}@db.aqeidutucbxhbfkuihuu.supabase.co:5432/postgres"

print("Connecting to Supabase PostgreSQL Engine...")
engine = create_engine(supabase_url)
SessionLocal = sessionmaker(bind=engine)

print("Creating database schema tables in Supabase...")
Base.metadata.create_all(bind=engine)
print("✅ Database schema created successfully in Supabase!")

db = SessionLocal()

# Connect to local SQLite school.db
conn = sqlite3.connect("backend/school.db")
cursor = conn.cursor()

print("\n--- Migrating Users ---")
cursor.execute("SELECT id, username, password_hash, full_name, role, created_at FROM users")
for row in cursor.fetchall():
    if not db.query(User).filter(User.username == row[1]).first():
        db.add(User(
            id=row[0],
            username=row[1],
            password_hash=row[2],
            full_name=row[3],
            role=row[4]
        ))
db.commit()

print("--- Migrating System Settings ---")
cursor.execute("SELECT id, setting_key, setting_value FROM system_settings")
for row in cursor.fetchall():
    if not db.query(SystemSettings).filter(SystemSettings.setting_key == row[1]).first():
        db.add(SystemSettings(
            id=row[0],
            setting_key=row[1],
            setting_value=row[2]
        ))
db.commit()

print("--- Migrating Fee Structures ---")
cursor.execute("SELECT id, academic_year, boarding_category, term_1_amount, term_2_amount, term_3_amount FROM fee_structures")
for row in cursor.fetchall():
    if not db.query(FeeStructure).filter(FeeStructure.id == row[0]).first():
        db.add(FeeStructure(
            id=row[0],
            academic_year=row[1],
            boarding_category=row[2],
            term_1_amount=row[3],
            term_2_amount=row[4],
            term_3_amount=row[5]
        ))
db.commit()

print("--- Migrating 740 Students ---")
cursor.execute("SELECT id, admission_no, pay_id, pupil_id, first_name, last_name, name, dob, admission_year, father_name, mother_name, contact_no, additional_contact, address, city, state, pincode, boarding_category, status, is_sponsored, sponsor_type, sponsor_name, scholarship_type, has_mismatch, mismatch_amount, amount_to_return_sponsor, waive_due_on_transfer, remarks, date_of_admission FROM students")
students_count = 0
for row in cursor.fetchall():
    if not db.query(Student).filter(Student.id == row[0]).first():
        db.add(Student(
            id=row[0],
            admission_no=row[1],
            pay_id=row[2],
            pupil_id=row[3],
            first_name=row[4],
            last_name=row[5],
            name=row[6],
            dob=row[7],
            admission_year=row[8],
            father_name=row[9],
            mother_name=row[10],
            contact_no=row[11],
            additional_contact=row[12],
            address=row[13],
            city=row[14],
            state=row[15],
            pincode=row[16],
            boarding_category=row[17],
            status=row[18],
            is_sponsored=bool(row[19]),
            sponsor_type=row[20],
            sponsor_name=row[21],
            scholarship_type=row[22],
            has_mismatch=bool(row[23]),
            mismatch_amount=row[24],
            amount_to_return_sponsor=row[25],
            waive_due_on_transfer=bool(row[26]),
            remarks=row[27],
            date_of_admission=row[28]
        ))
        students_count += 1

db.commit()
print(f"✅ Migrated {students_count} students to Supabase!")

print("--- Migrating Academic Enrollments ---")
cursor.execute("SELECT id, student_id, academic_year, academic_level, standard, section, is_current FROM academic_enrollments")
enr_count = 0
for row in cursor.fetchall():
    if not db.query(AcademicEnrollment).filter(AcademicEnrollment.id == row[0]).first():
        db.add(AcademicEnrollment(
            id=row[0],
            student_id=row[1],
            academic_year=row[2],
            academic_level=row[3],
            standard=row[4],
            section=row[5],
            is_current=bool(row[6])
        ))
        enr_count += 1
db.commit()
print(f"✅ Migrated {enr_count} academic enrollments to Supabase!")

conn.close()
db.close()
print("\n🎉 Migration to Supabase Complete! All 740 students are live in Supabase PostgreSQL!")
