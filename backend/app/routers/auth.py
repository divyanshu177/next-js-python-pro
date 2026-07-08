from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import Dict, Any
from pydantic import BaseModel
from datetime import datetime
from backend.app.database import get_db, serialize_doc
from backend.app import schemas, auth

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register", response_model=schemas.UserResponse)
def register(user_in: schemas.UserCreate, db: Any = Depends(get_db)):
    """
    Registers a new user in MongoDB and creates a default empty
    doctor or patient profile.
    """
    # Check if user already exists
    existing_user = db.users.find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    
    # Hash password
    hashed_pwd = auth.hash_password(user_in.password)
    
    # Create user document
    new_user = {
        "name": user_in.name,
        "email": user_in.email,
        "password_hash": hashed_pwd,
        "role": user_in.role,
        "created_at": datetime.utcnow()
    }
    
    # Insert User
    result = db.users.insert_one(new_user)
    user_id = str(result.inserted_id)
    new_user["id"] = user_id
    
    # Create associated profile
    if user_in.role == "doctor":
        doc_profile = {
            "user_id": user_id,
            "specialization": "General Physician",
            "experience_years": 1,
            "consultation_fee": 500.0,
            "hospital_name": "MedConnect General Hospital",
            "rating": 4.5,
            "biography": "",
            "address": "",
            "available_slots": ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30"]
        }
        db.doctor_profiles.insert_one(doc_profile)
    elif user_in.role == "patient":
        patient_profile = {
            "user_id": user_id,
            "date_of_birth": "",
            "blood_group": "",
            "medical_history_summary": ""
        }
        db.patient_profiles.insert_one(patient_profile)
        
    return serialize_doc(new_user)


@router.post("/login", response_model=schemas.Token)
def login_for_access_token(
    db: Any = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login.
    """
    user = db.users.find_one({"email": form_data.username})
    if not user or not auth.verify_password(form_data.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    
    access_token = auth.create_access_token(data={"sub": user["email"], "role": user["role"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"],
        "name": user["name"]
    }


@router.post("/login/json", response_model=schemas.Token)
def login_json_typed(request: LoginRequest, db: Any = Depends(get_db)):
    """
    JSON body login endpoint for the frontend.
    """
    user = db.users.find_one({"email": request.email})
    if not user or not auth.verify_password(request.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = auth.create_access_token(data={"sub": user["email"], "role": user["role"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"],
        "name": user["name"]
    }


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: auth.MongoUser = Depends(auth.get_current_user)):
    """
    Returns the current logged in user.
    """
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "created_at": current_user.created_at
    }


@router.get("/profile", response_model=Dict[str, Any])
def get_user_profile(
    current_user: auth.MongoUser = Depends(auth.get_current_user), 
    db: Any = Depends(get_db)
):
    """
    Returns the user's role-specific profile details.
    """
    result = {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "created_at": current_user.created_at
    }
    
    if current_user.role == "doctor":
        profile = db.doctor_profiles.find_one({"user_id": current_user.id})
        if profile:
            result["profile"] = serialize_doc(profile)
    elif current_user.role == "patient":
        profile = db.patient_profiles.find_one({"user_id": current_user.id})
        if profile:
            result["profile"] = serialize_doc(profile)
            
    return result


@router.put("/profile", response_model=Dict[str, Any])
def update_profile(
    profile_data: dict, 
    current_user: auth.MongoUser = Depends(auth.get_current_user), 
    db: Any = Depends(get_db)
):
    """
    Updates the role-specific profile details in MongoDB.
    """
    # Filter out empty fields and keys that shouldn't be edited
    update_fields = {k: v for k, v in profile_data.items() if v is not None and k not in ["id", "user_id"]}

    if current_user.role == "doctor":
        db.doctor_profiles.update_one(
            {"user_id": current_user.id},
            {"$set": update_fields}
        )
    elif current_user.role == "patient":
        db.patient_profiles.update_one(
            {"user_id": current_user.id},
            {"$set": update_fields}
        )
                
    return get_user_profile(current_user, db)
