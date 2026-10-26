import datetime
from datetime import datetime as dt, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
import hashlib
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from backend.app.core.config import settings
from backend.app.core.database import get_users_col

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Use robust SHA256 salted hash fallback or bcrypt
    try:
        import bcrypt
        if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        pass
    # Standard salted hash
    expected = hashlib.sha256((plain_password + settings.JWT_SECRET).encode("utf-8")).hexdigest()
    return expected == hashed_password

def get_password_hash(password: str) -> str:
    try:
        import bcrypt
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")
    except Exception:
        return hashlib.sha256((password + settings.JWT_SECRET).encode("utf-8")).hexdigest()

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = dt.utcnow() + expires_delta
    else:
        expire = dt.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Dict[str, Any]:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    users_col = get_users_col()
    user = await users_col.find_one({"_id": user_id})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def ensure_demo_user():
    """Seed demo user account for testing."""
    users_col = get_users_col()
    demo = await users_col.find_one({"email": "demo@researchassist.ai"})
    if not demo:
        await users_col.insert_one({
            "_id": "user-demo-001",
            "email": "demo@researchassist.ai",
            "name": "Dr. Alex Vance",
            "hashed_password": get_password_hash("password123"),
            "role": "researcher",
            "institution": "Stanford University / AI Lab",
            "research_interests": ["Machine Learning", "NLP", "Computer Vision", "Biomedical AI"],
            "created_at": dt.utcnow().isoformat()
        })
        print("Demo user created: demo@researchassist.ai / password123")
