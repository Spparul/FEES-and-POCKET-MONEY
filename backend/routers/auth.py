from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, RoleEnum, SystemSettings
from schemas import LoginRequest, LoginResponse, LockToggleRequest, AdminAuthRequest
import hashlib

router = APIRouter(prefix="/auth", tags=["auth"])

def get_password_hash(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return get_password_hash(plain_password) == hashed_password

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    return LoginResponse(
        token=f"mock-token-{user.id}",
        user_id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role
    )

@router.post("/verify-admin")
def verify_admin(req: AdminAuthRequest, db: Session = Depends(get_db)):
    admin_users = db.query(User).filter(User.role == RoleEnum.ADMIN).all()
    verified = False
    for admin in admin_users:
        if verify_password(req.admin_password, admin.password_hash):
            verified = True
            break
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrator password"
        )
    return {"status": "success", "message": "Admin authenticated"}

@router.post("/toggle-lock")
def toggle_register_lock(req: LockToggleRequest, db: Session = Depends(get_db)):
    # Verify admin password
    admin_users = db.query(User).filter(User.role == RoleEnum.ADMIN).all()
    verified = any(verify_password(req.admin_password, u.password_hash) for u in admin_users)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication failed. Cannot toggle register lock."
        )

    setting = db.query(SystemSettings).filter(SystemSettings.setting_key == "is_register_locked").first()
    if not setting:
        setting = SystemSettings(setting_key="is_register_locked", setting_value=str(req.lock).lower())
        db.add(setting)
    else:
        setting.setting_value = str(req.lock).lower()
    
    db.commit()
    return {"status": "success", "is_register_locked": req.lock}
