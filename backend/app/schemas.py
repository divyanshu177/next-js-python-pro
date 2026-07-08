from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import date, time, datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str
    role: str = Field(..., description="Role must be 'patient', 'doctor', or 'admin'")

class UserResponse(UserBase):
    id: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# Patient Profile Schemas
class PatientProfileBase(BaseModel):
    date_of_birth: Optional[str] = None
    blood_group: Optional[str] = None
    medical_history_summary: Optional[str] = None

class PatientProfileUpdate(PatientProfileBase):
    pass

class PatientProfileResponse(PatientProfileBase):
    id: str
    user_id: str

    class Config:
        from_attributes = True

class PatientUserResponse(UserResponse):
    patient_profile: Optional[PatientProfileResponse] = None

# Doctor Profile Schemas
class DoctorProfileBase(BaseModel):
    specialization: str
    experience_years: int
    consultation_fee: float = 500.0
    hospital_name: str
    address: Optional[str] = None
    biography: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    available_slots: Optional[List[str]] = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30"]

class DoctorProfileCreate(DoctorProfileBase):
    pass

class DoctorProfileUpdate(BaseModel):
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
    consultation_fee: Optional[float] = None
    hospital_name: Optional[str] = None
    address: Optional[str] = None
    biography: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    available_slots: Optional[List[str]] = None

class DoctorProfileResponse(DoctorProfileBase):
    id: str
    user_id: str
    rating: float

    class Config:
        from_attributes = True

class DoctorUserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    doctor_profile: Optional[DoctorProfileResponse] = None

    class Config:
        from_attributes = True

# Appointment Schemas
class AppointmentBase(BaseModel):
    doctor_id: str
    appointment_date: date
    start_time: time
    end_time: time
    slot_label: str
    urgency_level: int = 1  # 1 = Normal, 2 = Urgent, 3 = Emergency
    symptoms_description: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    prescription: Optional[str] = None
    appointment_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    slot_label: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: str
    doctor_id: str
    patient_id: str
    appointment_date: date
    start_time: time
    end_time: time
    slot_label: str
    status: str
    urgency_level: int
    symptoms_description: Optional[str] = None
    prescription: Optional[str] = None
    queue_token: Optional[int] = None
    created_at: datetime
    patient: Optional[UserResponse] = None
    doctor: Optional[DoctorProfileResponse] = None

    class Config:
        from_attributes = True

# Medical Report Schemas
class MedicalReportResponse(BaseModel):
    id: str
    patient_id: str
    file_name: str
    file_url: str
    ai_summary: Optional[Dict[str, Any]] = None
    upload_date: datetime

    class Config:
        from_attributes = True

# AI Symptom Checker Schemas
class SymptomCheckerRequest(BaseModel):
    symptoms: str

class SymptomCheckerResponse(BaseModel):
    recommended_specialty: str
    possible_causes: List[str]
    urgency_level: str
    recommended_tests: List[str]
    disclaimer: str

# Live Queue Schemas
class LiveQueueStatus(BaseModel):
    doctor_id: str
    doctor_name: str
    active_token: Optional[int] = None
    patient_token: Optional[int] = None
    estimated_waiting_time_minutes: int
    doctor_status: str  # 'Available', 'In-Consultation', 'On-Break', 'Completed'
    queue_length: int
