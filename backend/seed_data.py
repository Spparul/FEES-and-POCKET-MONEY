import csv
import os
from database import engine, SessionLocal, Base
from models import (
    User, SystemSettings, Student, AcademicEnrollment, FeeStructure, FeePayment, PaymentAllocation,
    PocketMoneyTransaction, AuditLog, RoleEnum, StudentStatusEnum, BoardingCategoryEnum,
    StandardEnum, SectionEnum, SponsorTypeEnum, ScholarshipTypeEnum, TermNameEnum,
    PocketMoneyTxTypeEnum
)

CSV_FILE_PATH = os.path.join(os.path.dirname(__file__), "students_data.csv")

def parse_class(class_str):
    c = class_str.strip()
    if c.startswith("FORM1"):
        sec = c.replace("FORM1", "").strip()
        return "Form 1", StandardEnum.VIII, SectionEnum(sec)
    elif c.startswith("FORM2"):
        sec = c.replace("FORM2", "").strip()
        return "Form 2", StandardEnum.IX, SectionEnum(sec)
    elif c.startswith("10"):
        sec = c.replace("10", "").strip()
        return "Form 3", StandardEnum.X, SectionEnum(sec)
    elif c.startswith("11"):
        sec = c.replace("11", "").strip()
        return "11", StandardEnum.XI, SectionEnum(sec)
    elif c.startswith("12"):
        sec = c.replace("12", "").strip()
        return "12", StandardEnum.XII, SectionEnum(sec)
    else:
        return "Form 1", StandardEnum.VIII, SectionEnum.E

def seed_db():
    print("Dropping and re-creating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # 1. Seed Users & System Settings
        admin_user = User(
            username="admin",
            password_hash="admin123",
            full_name="School Administrator",
            role=RoleEnum.ADMIN
        )
        db.add(admin_user)

        db.add_all([
            SystemSettings(setting_key="active_academic_year", setting_value="2026-2027"),
            SystemSettings(setting_key="is_register_locked", setting_value="false")
        ])

        # 2. Seed Fee Structures for 2026-2027
        fs_day = FeeStructure(
            academic_year="2026-2027",
            boarding_category=BoardingCategoryEnum.DAY_SCHOLAR,
            term_1_amount=1500.0,
            term_2_amount=1500.0,
            term_3_amount=1500.0
        )
        fs_ord = FeeStructure(
            academic_year="2026-2027",
            boarding_category=BoardingCategoryEnum.HOSTEL_ORDINARY,
            term_1_amount=2800.0,
            term_2_amount=2800.0,
            term_3_amount=2800.0
        )
        fs_sp = FeeStructure(
            academic_year="2026-2027",
            boarding_category=BoardingCategoryEnum.HOSTEL_SPECIAL,
            term_1_amount=4400.0,
            term_2_amount=4400.0,
            term_3_amount=4400.0
        )
        db.add_all([fs_day, fs_ord, fs_sp])
        db.commit()

        # 3. Parse CSV rows from file
        with open(CSV_FILE_PATH, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)

            seen_pay_ids = set()

            for idx, row in enumerate(reader, 1):
                if not row or not any(row.values()):
                    continue
                
                last_name = (row.get('Last Name') or '').strip()
                first_name = (row.get('First Name') or '').strip()
                full_name = f"{first_name} {last_name}".strip()
                cls = (row.get('Class') or '').strip()
                status_str = (row.get('Enrolment Status') or '').strip()
                pay_id = (row.get('PAYID') or '').strip()
                sponsor_str = (row.get('Sponsor') or '').strip()
                remark_str = (row.get('Remark') or '').strip()

                if not last_name and not first_name:
                    continue

                if not pay_id:
                    pay_id = f"REF-{1000 + idx}"

                # Handle duplicate pay_ids gracefully
                if pay_id in seen_pay_ids:
                    pay_id = f"{pay_id}-{idx}"
                seen_pay_ids.add(pay_id)

                # Map Boarding Category
                if remark_str == 'BSP':
                    boarding_cat = BoardingCategoryEnum.HOSTEL_SPECIAL
                elif remark_str == 'D':
                    boarding_cat = BoardingCategoryEnum.DAY_SCHOLAR
                else:
                    boarding_cat = BoardingCategoryEnum.HOSTEL_ORDINARY

                # Map Status
                if status_str.lower() in ['stopped', 'transferred', 'left']:
                    student_status = StudentStatusEnum.TRANSFERRED
                else:
                    student_status = StudentStatusEnum.ACTIVE

                # Map Sponsorship
                if sponsor_str:
                    is_sponsored = True
                    sponsor_name = sponsor_str
                    if sponsor_str.upper().startswith("CDF"):
                        sponsor_type = SponsorTypeEnum.GOVERNMENT
                        scholarship_type = ScholarshipTypeEnum.GOVERNMENT
                    else:
                        sponsor_type = SponsorTypeEnum.PRIVATE
                        scholarship_type = ScholarshipTypeEnum.PRIVATE
                else:
                    is_sponsored = False
                    sponsor_name = None
                    sponsor_type = None
                    scholarship_type = ScholarshipTypeEnum.NONE

                # Parse Academic Level & Section
                acad_level, std_enum, sec_enum = parse_class(cls)

                student = Student(
                    admission_no=pay_id,
                    pay_id=pay_id,
                    first_name=first_name,
                    last_name=last_name,
                    name=full_name,
                    dob="2009-01-15",
                    admission_year=2024,
                    father_name=f"Mr. {last_name}",
                    mother_name=f"Mrs. {last_name}",
                    contact_no="+260 97 1234567",
                    additional_contact=None,
                    address="Monze Town",
                    city="Monze",
                    state="Southern Province",
                    pincode="10101",
                    boarding_category=boarding_cat,
                    status=student_status,
                    is_sponsored=is_sponsored,
                    sponsor_type=sponsor_type,
                    sponsor_name=sponsor_name,
                    scholarship_type=scholarship_type,
                    date_of_admission="2024-01-10"
                )
                db.add(student)
                db.flush()

                # Seed Enrollment
                enrollment = AcademicEnrollment(
                    student_id=student.id,
                    academic_year="2026-2027",
                    academic_level=acad_level,
                    standard=std_enum,
                    section=sec_enum,
                    is_current=True
                )
                db.add(enrollment)

        db.commit()
        total_students = db.query(Student).count()
        print(f"Successfully imported {total_students} students into the database!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
