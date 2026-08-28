from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import SystemSettings, FeeStructure, BoardingCategoryEnum, Student, StudentStatusEnum, AcademicEnrollment
from schemas import FeeStructureSchema, SystemSettingsSchema
from services.fee_service import DEFAULT_FEES

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("/overview", response_model=SystemSettingsSchema)
def get_system_settings_overview(db: Session = Depends(get_db)):
    lock_setting = db.query(SystemSettings).filter(SystemSettings.setting_key == "is_register_locked").first()
    is_locked = lock_setting.setting_value.lower() == "true" if lock_setting else False

    acad_setting = db.query(SystemSettings).filter(SystemSettings.setting_key == "active_academic_year").first()
    acad_year = acad_setting.setting_value if acad_setting else "2026-2027"

    total_students = db.query(Student).filter(Student.status == StudentStatusEnum.ACTIVE).count()
    total_classes = 17

    return SystemSettingsSchema(
        is_register_locked=is_locked,
        active_academic_year=acad_year,
        total_students=total_students,
        total_classes=total_classes
    )

@router.get("/fee-structures", response_model=List[FeeStructureSchema])
def get_fee_structures(academic_year: str = "2026-2027", db: Session = Depends(get_db)):
    structures = db.query(FeeStructure).filter(FeeStructure.academic_year == academic_year).all()
    if not structures:
        # Create default structures
        for cat, default_amount in DEFAULT_FEES.items():
            fs = FeeStructure(
                academic_year=academic_year,
                boarding_category=cat,
                term_1_amount=default_amount,
                term_2_amount=default_amount,
                term_3_amount=default_amount
            )
            db.add(fs)
        db.commit()
        structures = db.query(FeeStructure).filter(FeeStructure.academic_year == academic_year).all()

    return [
        FeeStructureSchema(
            id=s.id,
            academic_year=s.academic_year,
            boarding_category=s.boarding_category,
            term_1_amount=s.term_1_amount,
            term_2_amount=s.term_2_amount,
            term_3_amount=s.term_3_amount
        ) for s in structures
    ]

@router.put("/fee-structures/{structure_id}", response_model=FeeStructureSchema)
def update_fee_structure(
    structure_id: int,
    t1: float,
    t2: float,
    t3: float,
    db: Session = Depends(get_db)
):
    structure = db.query(FeeStructure).filter(FeeStructure.id == structure_id).first()
    if not structure:
        raise HTTPException(status_code=404, detail="Fee structure not found")

    structure.term_1_amount = t1
    structure.term_2_amount = t2
    structure.term_3_amount = t3
    db.commit()
    db.refresh(structure)

    return FeeStructureSchema(
        id=structure.id,
        academic_year=structure.academic_year,
        boarding_category=structure.boarding_category,
        term_1_amount=structure.term_1_amount,
        term_2_amount=structure.term_2_amount,
        term_3_amount=structure.term_3_amount
    )
