import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from backend.app.config import settings
from backend.app.database import get_db

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

class MongoUser:
    """
    Lightweight wrapper around MongoDB user documents to provide
    attribute access (e.g. user.role) matching the previous SQLAlchemy models.
    """
    def __init__(self, data: Dict[str, Any]):
        self.id = str(data.get("_id") or data.get("id"))
        self.name = data.get("name")
        self.email = data.get("email")
        self.password_hash = data.get("password_hash")
        self.role = data.get("role")
        self.created_at = data.get("created_at")

def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify standard plain text password against bcrypt hashed password."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Any = Depends(get_db)) -> MongoUser:
    """
    FastAPI dependency to extract current user from JWT token.
    Raises 401 if token is invalid or user is not found in MongoDB.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return MongoUser(user)

def get_current_active_doctor(current_user: MongoUser = Depends(get_current_user)) -> MongoUser:
    """Verifies that the user has the doctor role."""
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have doctor privileges"
        )
    return current_user

def get_current_active_admin(current_user: MongoUser = Depends(get_current_user)) -> MongoUser:
    """Verifies that the user has the admin role."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have admin privileges"
        )
    return current_user
