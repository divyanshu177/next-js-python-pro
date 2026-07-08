from datetime import date, time, datetime
from backend.app.database import client, db
from backend.app import auth

def seed_database():
    print("Connecting to MongoDB instance...")
    
    print("Dropping existing collections to clear database...")
    db.users.drop()
    db.doctor_profiles.drop()
    db.patient_profiles.drop()
    db.appointments.drop()
    db.medical_reports.drop()
    
    try:
        print("Seeding Admin User...")
        admin_pwd = auth.hash_password("admin123")
        admin = {
            "name": "MedConnect Admin",
            "email": "admin@medconnect.ai",
            "password_hash": admin_pwd,
            "role": "admin",
            "created_at": datetime.utcnow()
        }
        db.users.insert_one(admin)
        
        print("Seeding Doctor Users...")
        doc_pwd = auth.hash_password("doctor123")
        
        # 1. Doctor Sharma - General Physician
        doc_sharma_user = {
            "name": "Dr. Rajesh Sharma",
            "email": "dr.sharma@medconnect.ai",
            "password_hash": doc_pwd,
            "role": "doctor",
            "created_at": datetime.utcnow()
        }
        res_sharma = db.users.insert_one(doc_sharma_user)
        sharma_user_id = str(res_sharma.inserted_id)
        
        profile_sharma = {
            "user_id": sharma_user_id,
            "specialization": "General Physician",
            "experience_years": 12,
            "rating": 4.8,
            "consultation_fee": 600.0,
            "hospital_name": "Apollo Hospital",
            "address": "Indiranagar, Bengaluru, KA 560038",
            "biography": "Dr. Rajesh Sharma is a highly experienced General Physician specializing in primary care, wellness counseling, and chronic health management.",
            "latitude": 12.9715987,
            "longitude": 77.5945627,
            "available_slots": ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30"]
        }
        res_sharma_prof = db.doctor_profiles.insert_one(profile_sharma)
        sharma_profile_id = str(res_sharma_prof.inserted_id)

        # 2. Doctor Gupta - Cardiologist
        doc_gupta_user = {
            "name": "Dr. Anjali Gupta",
            "email": "dr.gupta@medconnect.ai",
            "password_hash": doc_pwd,
            "role": "doctor",
            "created_at": datetime.utcnow()
        }
        res_gupta = db.users.insert_one(doc_gupta_user)
        gupta_user_id = str(res_gupta.inserted_id)
        
        profile_gupta = {
            "user_id": gupta_user_id,
            "specialization": "Cardiologist",
            "experience_years": 15,
            "rating": 4.9,
            "consultation_fee": 1200.0,
            "hospital_name": "Fortis Cardiac Care",
            "address": "Bannerghatta Road, Bengaluru, KA 560076",
            "biography": "Dr. Anjali Gupta is a renowned Cardiologist with over 15 years of experience in managing complex heart conditions, arrhythmia, and arterial health.",
            "latitude": 12.915,
            "longitude": 77.599,
            "available_slots": ["10:00", "10:30", "11:00", "11:30", "12:00", "15:00", "15:30", "16:00"]
        }
        res_gupta_prof = db.doctor_profiles.insert_one(profile_gupta)
        gupta_profile_id = str(res_gupta_prof.inserted_id)

        # 3. Doctor Patel - Dermatologist
        doc_patel_user = {
            "name": "Dr. Vikram Patel",
            "email": "dr.patel@medconnect.ai",
            "password_hash": doc_pwd,
            "role": "doctor",
            "created_at": datetime.utcnow()
        }
        res_patel = db.users.insert_one(doc_patel_user)
        patel_user_id = str(res_patel.inserted_id)
        
        profile_patel = {
            "user_id": patel_user_id,
            "specialization": "Dermatologist",
            "experience_years": 8,
            "rating": 4.6,
            "consultation_fee": 800.0,
            "hospital_name": "Max Healthcare Clinic",
            "address": "Whitefield, Bengaluru, KA 560066",
            "biography": "Dr. Vikram Patel is a certified Dermatologist expert in clinical dermatology, acne therapies, eczema management, and minor skin surgeries.",
            "latitude": 12.969,
            "longitude": 77.750,
            "available_slots": ["09:30", "10:00", "10:30", "14:00", "14:30", "15:00"]
        }
        db.doctor_profiles.insert_one(profile_patel)

        # 4. Doctor Singh - Pediatrician
        doc_singh_user = {
            "name": "Dr. Priya Singh",
            "email": "dr.singh@medconnect.ai",
            "password_hash": doc_pwd,
            "role": "doctor",
            "created_at": datetime.utcnow()
        }
        res_singh = db.users.insert_one(doc_singh_user)
        singh_user_id = str(res_singh.inserted_id)
        
        profile_singh = {
            "user_id": singh_user_id,
            "specialization": "Pediatrician",
            "experience_years": 10,
            "rating": 4.7,
            "consultation_fee": 700.0,
            "hospital_name": "Apollo Hospital",
            "address": "Indiranagar, Bengaluru, KA 560038",
            "biography": "Dr. Priya Singh has over 10 years of experience in general pediatrics, childhood immunization, asthma management, and early infant nutrition.",
            "latitude": 12.9715987,
            "longitude": 77.5945627,
            "available_slots": ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]
        }
        db.doctor_profiles.insert_one(profile_singh)

        # 5. Doctor Nair - Neurologist
        doc_nair_user = {
            "name": "Dr. Harish Nair",
            "email": "dr.nair@medconnect.ai",
            "password_hash": doc_pwd,
            "role": "doctor",
            "created_at": datetime.utcnow()
        }
        res_nair = db.users.insert_one(doc_nair_user)
        nair_user_id = str(res_nair.inserted_id)
        
        profile_nair = {
            "user_id": nair_user_id,
            "specialization": "Neurologist",
            "experience_years": 18,
            "rating": 4.9,
            "consultation_fee": 1500.0,
            "hospital_name": "Fortis Cardiac Care",
            "address": "Bannerghatta Road, Bengaluru, KA 560076",
            "biography": "Dr. Harish Nair specializes in neurological disorders, including migraine care, peripheral neuropathy, epilepsy, and cognitive diagnostic panels.",
            "latitude": 12.915,
            "longitude": 77.599,
            "available_slots": ["11:00", "11:30", "12:00", "14:00", "14:30", "15:00"]
        }
        db.doctor_profiles.insert_one(profile_nair)

        print("Seeding Patient Users...")
        patient_pwd = auth.hash_password("patient123")
        
        # 1. Patient Rohan
        pat_rohan_user = {
            "name": "Rohan Verma",
            "email": "rohan@medconnect.ai",
            "password_hash": patient_pwd,
            "role": "patient",
            "created_at": datetime.utcnow()
        }
        res_rohan = db.users.insert_one(pat_rohan_user)
        rohan_user_id = str(res_rohan.inserted_id)
        
        p_profile_rohan = {
            "user_id": rohan_user_id,
            "date_of_birth": "1995-05-12",
            "blood_group": "B+",
            "medical_history_summary": "Mild dust allergy. Diagnosed with mild asthma in 2021."
        }
        db.patient_profiles.insert_one(p_profile_rohan)

        # 2. Patient Simran
        pat_simran_user = {
            "name": "Simran Kaur",
            "email": "simran@medconnect.ai",
            "password_hash": patient_pwd,
            "role": "patient",
            "created_at": datetime.utcnow()
        }
        res_simran = db.users.insert_one(pat_simran_user)
        simran_user_id = str(res_simran.inserted_id)
        
        p_profile_simran = {
            "user_id": simran_user_id,
            "date_of_birth": "1998-08-20",
            "blood_group": "O+",
            "medical_history_summary": "No major chronic issues. Regular health checkups."
        }
        db.patient_profiles.insert_one(p_profile_simran)

        print("Seeding Active Appointments for today (establishing Priority Queue)...")
        today_str = str(date.today())
        
        # Rohan has a Normal appointment (urgency=1) booked at 09:30 AM
        appt1 = {
            "doctor_id": sharma_profile_id,
            "patient_id": rohan_user_id,
            "appointment_date": today_str,
            "start_time": "09:30:00",
            "end_time": "10:00:00",
            "slot_label": "09:30 AM - 10:00 AM",
            "urgency_level": 1,
            "symptoms_description": "Chronic cough and cold symptoms for 4 days.",
            "queue_token": 1,
            "status": "approved",
            "prescription": None,
            "created_at": datetime.utcnow()
        }
        db.appointments.insert_one(appt1)

        # Simran has an EMERGENCY appointment (urgency=3) booked at 10:00 AM
        # Even though Rohan's appointment was booked earlier, Simran's Emergency urgency
        # should rank higher in the Heap Priority Queue of Doctor Sharma!
        appt2 = {
            "doctor_id": sharma_profile_id,
            "patient_id": simran_user_id,
            "appointment_date": today_str,
            "start_time": "10:00:00",
            "end_time": "10:30:00",
            "slot_label": "10:00 AM - 10:30 AM",
            "urgency_level": 3,
            "symptoms_description": "Severe chest tightness and sudden breathing difficulty.",
            "queue_token": 2,
            "status": "approved",
            "prescription": None,
            "created_at": datetime.utcnow()
        }
        db.appointments.insert_one(appt2)

        print("Seeding past pathology summary reports...")
        report = {
            "patient_id": rohan_user_id,
            "file_name": "blood_report_2025.pdf",
            "file_url": "backend_uploads/rohan/blood_report_2025.pdf",
            "ai_summary": {
                "summary": "Full blood panel shows normal CBC levels but highlights moderately elevated blood glucose and Vitamin D deficiency.",
                "key_findings": [
                    {"parameter": "Fasting Blood Glucose", "value": "138 mg/dL", "status": "High"},
                    {"parameter": "Vitamin D", "value": "16 ng/mL", "status": "Low"},
                    {"parameter": "Hemoglobin", "value": "14.5 g/dL", "status": "Normal"}
                ],
                "recommendations": [
                    "Reduce daily carbohydrate and high-glycemic sugar foods.",
                    "Supplement with Vitamin D3 (2000 IU daily) and spend 15 mins in early morning sunlight."
                ],
                "follow_up_required": True
            },
            "upload_date": datetime.utcnow()
        }
        db.medical_reports.insert_one(report)

        print("MongoDB local successfully seeded with mock clinical dataset!")
        
    except Exception as e:
        print(f"Error seeding MongoDB: {str(e)}")
        raise e
    finally:
        client.close()

if __name__ == "__main__":
    seed_database()
