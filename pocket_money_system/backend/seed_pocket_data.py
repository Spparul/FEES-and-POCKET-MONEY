import csv
import os
from database import engine, SessionLocal, Base
from models import (
    Student, AcademicEnrollment, StudentStatusEnum, BoardingCategoryEnum,
    StandardEnum, SectionEnum
)

CSV_FILE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "backend", "students_data.csv")

def parse_class(class_str):
    c = class_str.strip()
    sec_str = "A"
    if c.startswith("FORM1"):
        sec_str = c.replace("FORM1", "").strip()
        lvl = "Form 1"
        std = StandardEnum.VIII
    elif c.startswith("FORM2"):
        sec_str = c.replace("FORM2", "").strip()
        lvl = "Form 2"
        std = StandardEnum.IX
    elif c.startswith("10"):
        sec_str = c.replace("10", "").strip()
        lvl = "Form 3"
        std = StandardEnum.X
    elif c.startswith("11"):
        sec_str = c.replace("11", "").strip()
        lvl = "11"
        std = StandardEnum.XI
    elif c.startswith("12"):
        sec_str = c.replace("12", "").strip()
        lvl = "12"
        std = StandardEnum.XII
    else:
        lvl = "Form 1"
        std = StandardEnum.VIII

    try:
        sec = SectionEnum(sec_str)
    except ValueError:
        sec = SectionEnum.A
    return lvl, std, sec

def seed_db():
    print("Initializing standalone Pocket Money database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
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

                if pay_id in seen_pay_ids:
                    pay_id = f"{pay_id}-{idx}"
                seen_pay_ids.add(pay_id)

                if remark_str == 'BSP':
                    boarding_cat = BoardingCategoryEnum.HOSTEL_SPECIAL
                elif remark_str == 'D':
                    boarding_cat = BoardingCategoryEnum.DAY_SCHOLAR
                else:
                    boarding_cat = BoardingCategoryEnum.HOSTEL_ORDINARY

                if status_str.lower() in ['stopped', 'transferred', 'left']:
                    student_status = StudentStatusEnum.TRANSFERRED
                else:
                    student_status = StudentStatusEnum.ACTIVE

                is_sponsored = bool(sponsor_str)
                sponsor_name = sponsor_str if sponsor_str else None

                academic_level, standard_enum, section_enum = parse_class(cls)

                student = Student(
                    pay_id=pay_id,
                    pupil_id=f"PUP-{1000 + idx}",
                    first_name=first_name,
                    last_name=last_name,
                    name=full_name,
                    dob="2010-01-01",
                    admission_year=2024,
                    father_name=f"{last_name} Father",
                    mother_name=f"{last_name} Mother",
                    contact_no="+260971234567",
                    boarding_category=boarding_cat,
                    status=student_status,
                    is_sponsored=is_sponsored,
                    sponsor_name=sponsor_name,
                    date_of_admission="2024-01-10"
                )
                db.add(student)
                db.flush()

                enrollment = AcademicEnrollment(
                    student_id=student.id,
                    academic_year="2026-2027",
                    academic_level=academic_level,
                    standard=standard_enum,
                    section=section_enum,
                    is_current=True
                )
                db.add(enrollment)

        db.commit()
        print("Successfully seeded all student records into Pocket Money database!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
