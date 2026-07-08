from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from datetime import date, time, datetime
from bson import ObjectId
from backend.app.database import get_db, serialize_doc, serialize_list
from backend.app import schemas, auth
from backend.app.dsa.interval_scheduling import has_overlap
from backend.app.dsa.priority_queue import AppointmentPriorityQueue

router = APIRouter(prefix="/appointments", tags=["appointments"])

def parse_time(t_val) -> time:
    """Helper to convert string time format HH:MM:SS or HH:MM to time object."""
    if isinstance(t_val, time):
        return t_val
    parts = list(map(int, str(t_val).split(":")))
    return time(parts[0], parts[1])

def get_full_appointment_response(appt: Dict[str, Any], db: Any) -> Dict[str, Any]:
    """Helper to populate patient and doctor profile details in response."""
    appt_serialized = serialize_doc(appt)
    
    # Resolve Patient
    pat_user = db.users.find_one({"_id": ObjectId(appt["patient_id"])})
    if pat_user:
        appt_serialized["patient"] = serialize_doc(pat_user)
        
    # Resolve Doctor
    doc_prof = db.doctor_profiles.find_one({"_id": ObjectId(appt["doctor_id"])})
    if doc_prof:
        appt_serialized["doctor"] = serialize_doc(doc_prof)
        
    return appt_serialized


@router.post("", response_model=schemas.AppointmentResponse)
def book_appointment(
    appointment_in: schemas.AppointmentCreate,
    current_user: auth.MongoUser = Depends(auth.get_current_user),
    db: Any = Depends(get_db)
):
    """
    Books an appointment in MongoDB, running slot conflict checks and sequence tokens.
    """
    if current_user.role != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can book appointments"
        )

    # 1. Verify doctor profile
    doctor = db.doctor_profiles.find_one({"_id": ObjectId(appointment_in.doctor_id)})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    # 2. Check overlaps using Interval Scheduling
    date_str = str(appointment_in.appointment_date)
    existing_appointments = list(db.appointments.find({
        "doctor_id": appointment_in.doctor_id,
        "appointment_date": date_str,
        "status": {"$in": ["approved", "pending"]}
    }))

    existing_intervals = [
        (parse_time(appt["start_time"]), parse_time(appt["end_time"]))
        for appt in existing_appointments
    ]

    proposed_interval = (parse_time(appointment_in.start_time), parse_time(appointment_in.end_time))
    
    try:
        if has_overlap(proposed_interval, existing_intervals):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This time slot overlaps with an existing appointment for this doctor."
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 3. Calculate sequential token for today
    today_count = db.appointments.count_documents({
        "doctor_id": appointment_in.doctor_id,
        "appointment_date": date_str
    })
    queue_token = today_count + 1

    # Create appointment document
    new_appt = {
        "doctor_id": appointment_in.doctor_id,
        "patient_id": current_user.id,
        "appointment_date": date_str,
        "start_time": str(appointment_in.start_time),
        "end_time": str(appointment_in.end_time),
        "slot_label": appointment_in.slot_label,
        "urgency_level": appointment_in.urgency_level,
        "symptoms_description": appointment_in.symptoms_description,
        "queue_token": queue_token,
        "status": "pending",
        "prescription": None,
        "created_at": datetime.utcnow()
    }

    result = db.appointments.insert_one(new_appt)
    new_appt["id"] = str(result.inserted_id)
    
    return get_full_appointment_response(new_appt, db)


@router.get("", response_model=List[schemas.AppointmentResponse])
def get_appointments(
    current_user: auth.MongoUser = Depends(auth.get_current_user),
    db: Any = Depends(get_db)
):
    """
    Retrieves all appointments.
    """
    query_filter = {}
    if current_user.role == "patient":
        query_filter = {"patient_id": current_user.id}
    elif current_user.role == "doctor":
        doc_profile = db.doctor_profiles.find_one({"user_id": current_user.id})
        if not doc_profile:
            return []
        query_filter = {"doctor_id": str(doc_profile["_id"])}
    
    # Sort descending by date and time in Mongo
    appts = list(db.appointments.find(query_filter).sort([
        ("appointment_date", -1),
        ("start_time", -1)
    ]))
    
    return [get_full_appointment_response(appt, db) for appt in appts]


@router.get("/today", response_model=List[schemas.AppointmentResponse])
def get_today_prioritized_appointments(
    current_user: auth.MongoUser = Depends(auth.get_current_user),
    db: Any = Depends(get_db)
):
    """
    Retrieves today's appointments for a doctor, prioritized using Heap PQ.
    """
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view prioritized lists")
        
    doc_profile = db.doctor_profiles.find_one({"user_id": current_user.id})
    if not doc_profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    today_str = str(date.today())
    appointments = list(db.appointments.find({
        "doctor_id": str(doc_profile["_id"]),
        "appointment_date": today_str,
        "status": {"$in": ["approved", "pending"]}
    }))

    # Priority Queue sorting
    pq = AppointmentPriorityQueue()
    for appt in appointments:
        full_appt = get_full_appointment_response(appt, db)
        pq.push(
            appointment_id=full_appt["id"],
            urgency_level=appt["urgency_level"],
            appointment_time=parse_time(appt["start_time"]),
            data=full_appt
        )
        
    return pq.get_sorted_list()


@router.put("/{id}", response_model=schemas.AppointmentResponse)
def update_appointment(
    id: str,
    appt_update: schemas.AppointmentUpdate,
    current_user: auth.MongoUser = Depends(auth.get_current_user),
    db: Any = Depends(get_db)
):
    """
    Approves, rejects, completes, cancels, or reschedules an appointment in MongoDB.
    """
    try:
        appt = db.appointments.find_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid appointment ID format")
        
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Authorize update
    if current_user.role == "patient" and current_user.id != appt["patient_id"]:
        raise HTTPException(status_code=403, detail="Unauthorized to modify this appointment")
    if current_user.role == "patient" and appt_update.status not in [None, "cancelled"]:
        raise HTTPException(status_code=403, detail="Patients can only cancel appointments")

    update_fields = {}
    
    # If rescheduling, check overlaps
    if appt_update.appointment_date or appt_update.start_time:
        new_date = str(appt_update.appointment_date or appt["appointment_date"])
        new_start = str(appt_update.start_time or appt["start_time"])
        new_end = str(appt_update.end_time or appt["end_time"])
        new_label = appt_update.slot_label or appt["slot_label"]
        
        existing = list(db.appointments.find({
            "doctor_id": appt["doctor_id"],
            "appointment_date": new_date,
            "_id": {"$ne": ObjectId(id)},
            "status": {"$in": ["approved", "pending"]}
        }))
        
        intervals = [(parse_time(a["start_time"]), parse_time(a["end_time"])) for a in existing]
        if has_overlap((parse_time(new_start), parse_time(new_end)), intervals):
            raise HTTPException(status_code=400, detail="New slot overlaps with an existing appointment")
            
        update_fields["appointment_date"] = new_date
        update_fields["start_time"] = new_start
        update_fields["end_time"] = new_end
        update_fields["slot_label"] = new_label

    if appt_update.status:
        update_fields["status"] = appt_update.status
    if appt_update.prescription:
        update_fields["prescription"] = appt_update.prescription

    if update_fields:
        db.appointments.update_one({"_id": ObjectId(id)}, {"$set": update_fields})
        
    # Reload updated appointment
    updated_appt = db.appointments.find_one({"_id": ObjectId(id)})
    return get_full_appointment_response(updated_appt, db)


@router.get("/queue/{doctor_id}", response_model=schemas.LiveQueueStatus)
def get_live_queue_status(
    doctor_id: str,
    current_user: auth.MongoUser = Depends(auth.get_current_user),
    db: Any = Depends(get_db)
):
    """
    Computes and returns the live queue metrics for a specific doctor from MongoDB.
    """
    doc = db.doctor_profiles.find_one({"_id": ObjectId(doctor_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    user_doc = db.users.find_one({"_id": ObjectId(doc["user_id"])})
    doctor_name = user_doc["name"] if user_doc else "Dr. Clinician"

    today_str = str(date.today())
    appointments = list(db.appointments.find({
        "doctor_id": doctor_id,
        "appointment_date": today_str,
        "status": {"$in": ["approved", "pending"]}
    }))

    # Prioritize appointments using Heap PQ
    pq = AppointmentPriorityQueue()
    for appt in appointments:
        pq.push(str(appt["_id"]), appt["urgency_level"], parse_time(appt["start_time"]), {
            "id": str(appt["_id"]),
            "patient_id": appt["patient_id"],
            "token": appt["queue_token"],
            "status": appt["status"]
        })

    sorted_queue = pq.get_sorted_list()

    # Find the current active token
    active_token = None
    in_consultation_appt = db.appointments.find_one({
        "doctor_id": doctor_id,
        "appointment_date": today_str,
        "status": "in-consultation"
    })
    
    if in_consultation_appt:
        active_token = in_consultation_appt["queue_token"]
    elif sorted_queue:
        active_token = sorted_queue[0]["token"]

    # Retrieve current logged in patient's token
    patient_token = None
    if current_user.role == "patient":
        patient_appt = db.appointments.find_one({
            "doctor_id": doctor_id,
            "patient_id": current_user.id,
            "appointment_date": today_str,
            "status": {"$in": ["approved", "pending", "in-consultation"]}
        })
        if patient_appt:
            patient_token = patient_appt["queue_token"]

    # Estimate waiting time
    patients_ahead = 0
    if patient_token is not None:
        for idx, item in enumerate(sorted_queue):
            if item["token"] == patient_token:
                patients_ahead = idx
                break
    else:
        patients_ahead = len(sorted_queue)

    estimated_wait = patients_ahead * 15

    # Doctor status
    doc_status = "Available"
    if in_consultation_appt:
        doc_status = "In-Consultation"
    elif not sorted_queue:
        doc_status = "Completed"

    return {
        "doctor_id": doctor_id,
        "doctor_name": doctor_name,
        "active_token": active_token,
        "patient_token": patient_token,
        "estimated_waiting_time_minutes": estimated_wait,
        "doctor_status": doc_status,
        "queue_length": len(sorted_queue)
    }
