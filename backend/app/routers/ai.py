import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import google.generativeai as genai
from backend.app.config import settings
from backend.app import schemas, auth

router = APIRouter(prefix="/ai", tags=["ai"])
logger = logging.getLogger(__name__)

def mock_symptom_response(symptoms: str) -> Dict[str, Any]:
    """
    Generates intelligent mock responses based on keyword analysis
    if Gemini API key is missing or calls fail.
    """
    sym = symptoms.lower()
    
    disclaimer = "This feature provides informational guidance only and is not a medical diagnosis."
    
    if "chest" in sym or "heart" in sym or "cardiac" in sym:
        return {
            "recommended_specialty": "Cardiologist",
            "possible_causes": [
                "Angina pectoris (reduced blood flow to the heart)",
                "Gastroesophageal reflux disease (GERD)",
                "Acute cardiovascular stress",
                "Musculoskeletal chest wall pain"
            ],
            "urgency_level": "Emergency",
            "recommended_tests": ["Electrocardiogram (ECG)", "Troponin Blood Test", "Echocardiogram", "Chest X-Ray"],
            "disclaimer": disclaimer
        }
    elif "rash" in sym or "itch" in sym or "skin" in sym or "eczema" in sym:
        return {
            "recommended_specialty": "Dermatologist",
            "possible_causes": [
                "Contact dermatitis (allergic reaction)",
                "Eczema or psoriasis flare-up",
                "Fungal or bacterial skin infection"
            ],
            "urgency_level": "Normal",
            "recommended_tests": ["Skin Allergy Patch Test", "Skin Scrape for culture", "Visual Dermatological Exam"],
            "disclaimer": disclaimer
        }
    elif "child" in sym or "pediatric" in sym or "baby" in sym or "toddler" in sym:
        return {
            "recommended_specialty": "Pediatrician",
            "possible_causes": [
                "Common childhood viral infection",
                "Teething-related fever",
                "Pediatric ear infection"
            ],
            "urgency_level": "Urgent",
            "recommended_tests": ["Pediatric Physical Examination", "Ear Inspection (Otoscopy)", "Routine Urine Culture"],
            "disclaimer": disclaimer
        }
    elif "bone" in sym or "joint" in sym or "fracture" in sym or "knee" in sym or "back pain" in sym:
        return {
            "recommended_specialty": "Orthopedic Specialist",
            "possible_causes": [
                "Ligament sprain or muscle strain",
                "Osteoarthritis",
                "Minor hairline fracture",
                "Sciatica or lumbar herniation"
            ],
            "urgency_level": "Normal",
            "recommended_tests": ["X-Ray of affected joint", "MRI Scan", "Inflammatory marker panel (RF, CRP)"],
            "disclaimer": disclaimer
        }
    elif "headache" in sym or "seizure" in sym or "dizzy" in sym or "numbness" in sym:
        return {
            "recommended_specialty": "Neurologist",
            "possible_causes": [
                "Migraine headache",
                "Tension headache",
                "Vestibular dysfunction (vertigo)",
                "Transient nerve compression"
            ],
            "urgency_level": "Urgent",
            "recommended_tests": ["Brain MRI/CT Scan", "Electroencephalogram (EEG)", "Neurological Reflex Exam"],
            "disclaimer": disclaimer
        }
    else:
        # Default: General Physician
        return {
            "recommended_specialty": "General Physician",
            "possible_causes": [
                "Mild viral fever or upper respiratory tract infection",
                "Systemic fatigue or dehydration",
                "Seasonal allergies"
            ],
            "urgency_level": "Normal",
            "recommended_tests": ["Complete Blood Count (CBC)", "Body Temperature & Blood Pressure monitoring", "Urine Routine analysis"],
            "disclaimer": disclaimer
        }


@router.post("/symptoms", response_model=schemas.SymptomCheckerResponse)
def check_symptoms(
    request: schemas.SymptomCheckerRequest,
    current_user: Any = Depends(auth.get_current_user)
):
    """
    Analyzes list of symptoms entered by the patient and suggests the
    correct medical specialty to book, potential causes, and diagnostic tests.
    """
    symptoms = request.symptoms.strip()
    if not symptoms:
        raise HTTPException(status_code=400, detail="Symptoms text cannot be empty")
        
    if not settings.GEMINI_API_KEY:
        logger.info("GEMINI_API_KEY is not set. Simulating AI output via local expert keywords.")
        return mock_symptom_response(symptoms)

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        You are a medical AI assistant. Analyze these symptoms: '{symptoms}'.
        Identify the most appropriate medical specialty to consult (e.g. General Physician, Cardiologist, Dermatologist, Pediatrician, Neurologist, Orthopedic, Gynecologist, etc.).
        Provide potential causes (maximum 3-4 bullet points), an urgency level (Normal, Urgent, Emergency), and recommended diagnostic tests.
        Include a clear medical disclaimer.
        Return the response in a structured JSON format with EXACTLY the following keys:
        {{
          "recommended_specialty": "Specialty Name",
          "possible_causes": ["Cause 1", "Cause 2"],
          "urgency_level": "Normal|Urgent|Emergency",
          "recommended_tests": ["Test 1", "Test 2"],
          "disclaimer": "This feature provides informational guidance only and is not a medical diagnosis."
        }}
        Do not wrap the JSON output in markdown fences (like ```json), just output the raw JSON string directly.
        """
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean potential markdown block formatting from model response
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].strip() == "```":
                lines = lines[:-1]
            text = "\n".join(lines).strip()
            
        data = json.loads(text)
        
        # Validate keys presence
        required_keys = ["recommended_specialty", "possible_causes", "urgency_level", "recommended_tests", "disclaimer"]
        if all(k in data for k in required_keys):
            return data
        else:
            raise ValueError("Incomplete keys in Gemini response")
            
    except Exception as e:
        logger.error(f"Gemini symptom checker failed with error: {str(e)}. Falling back to mock system.")
        return mock_symptom_response(symptoms)
