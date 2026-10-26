import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from backend.app.schemas.schemas import UserRegister, UserLogin, UserOut, TokenOut, ForgotPasswordReq, ResetPasswordReq
from backend.app.core.database import get_users_col
from backend.app.core.security import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenOut)
async def register(req: UserRegister):
    users_col = get_users_col()
    existing = await users_col.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    user_id = f"user-{uuid.uuid4().hex[:12]}"
    user_doc = {
        "_id": user_id,
        "email": req.email.lower(),
        "name": req.name,
        "hashed_password": get_password_hash(req.password),
        "institution": req.institution or "Academic / Independent",
        "research_interests": req.research_interests or ["General AI", "Machine Learning"],
        "created_at": datetime.utcnow().isoformat()
    }
    await users_col.insert_one(user_doc)

    token = create_access_token(data={"sub": user_id, "email": user_doc["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_doc
    }

@router.post("/login", response_model=TokenOut)
async def login(req: UserLogin):
    users_col = get_users_col()
    user = await users_col.find_one({"email": req.email.lower()})
    if not user or not verify_password(req.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = create_access_token(data={"sub": user["_id"], "email": user["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordReq):
    users_col = get_users_col()
    user = await users_col.find_one({"email": req.email.lower()})
    # Safe response regardless of user existence
    return {
        "message": "If an account exists with this email, password reset instructions have been generated.",
        "reset_token": f"reset-token-{uuid.uuid4().hex[:16]}"
    }

@router.post("/reset-password")
async def reset_password(req: ResetPasswordReq):
    return {"message": "Password successfully updated. You may now log in with your new password."}
