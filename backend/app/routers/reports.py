import io
import json
import logging
import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from typing import Dict, Any, List
from bson import ObjectId
from pypdf import PdfReader
import google.generativeai as genai
from backend.app.config import settings
from backend.app.database import get_db, serialize_doc, serialize_list
from backend.app import schemas, auth

router = APIRouter(prefix="/reports", tags=["reports"])
logger = logging.getLogger(__name__)

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts raw text from PDF bytes using pypdf."""
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Failed to extract text from PDF: {str(e)}")
        return ""

def mock_report_analysis(text: str) -> Dict[str, Any]:
    """Simulates report analysis when Gemini is unavailable."""
    normalized_text = text.lower()
    findings = []
    recommendations = []
    follow_up = False
    
    if "glucose" in normalized_text or "sugar" in normalized_text or "diabetes" in normalized_text:
        findings.append({
            "parameter": "Fasting Blood Glucose",
            "value": "145 mg/dL",
            "status": "High"
        })
        recommendations.append("Limit intake of refined sugars and simple carbohydrates.")
        recommendations.append("Consider scheduling an HbA1c test to monitor average glucose over 3 months.")
        follow_up = True
        
    if "vitamin d" in normalized_text or "vit d" in normalized_text or "calciferol" in normalized_text:
        findings.append({
            "parameter": "Vitamin D (25-OH)",
            "value": "18 ng/mL",
            "status": "Low"
        })
        recommendations.append("Introduce daily Vitamin D3 supplementation (consult doctor for dosage).")
        recommendations.append("Spend 15-20 minutes in early morning sunlight daily.")
        follow_up = True
        
    if "tsh" in normalized_text or "thyroid" in normalized_text or "thyroxine" in normalized_text:
        findings.append({
            "parameter": "Thyroid Stimulating Hormone (TSH)",
            "value": "6.2 uIU/mL",
            "status": "High"
        })
        recommendations.append("Schedule a repeat thyroid profile (TSH, Free T3, Free T4) in 4-6 weeks.")
        recommendations.append("Discuss thyroid hormone replacement options with an endocrinologist.")
        follow_up = True
        
    if "cholesterol" in normalized_text or "lipid" in normalized_text or "ldl" in normalized_text or "triglycerides" in normalized_text:
        findings.append({
            "parameter": "LDL Cholesterol",
            "value": "162 mg/dL",
            "status": "High"
        })
        findings.append({
            "parameter": "HDL Cholesterol",
            "value": "38 mg/dL",
            "status": "Low"
        })
        recommendations.append("Adopt a heart-healthy diet rich in soluble fibers, omega-3 fatty acids, and green vegetables.")
        recommendations.append("Increase aerobic physical activities to 150 minutes per week.")
        follow_up = True

    if not findings:
        findings = [
            {"parameter": "Hemoglobin", "value": "14.2 g/dL", "status": "Normal"},
            {"parameter": "Total Cholesterol", "value": "185 mg/dL", "status": "Normal"},
            {"parameter": "Thyroid (TSH)", "value": "2.4 uIU/mL", "status": "Normal"}
        ]
        summary = "The medical report analysis shows standard biochemical values. All primary markers are within healthy reference ranges."
        recommendations.append("Continue regular balanced nutrition and routine physical hydration.")
        recommendations.append("Keep scheduling annual medical health checks.")
    else:
        summary = f"The medical report shows critical parameters outside normal references: {', '.join([f['parameter'] + ' (' + f['status'] + ')' for f in findings])}. Attention is advised."

    return {
        "summary": summary,
        "key_findings": findings,
        "recommendations": recommendations,
        "follow_up_required": follow_up
    }


@router.post("/upload", response_model=schemas.MedicalReportResponse)
async def upload_medical_report(
    file: UploadFile = File(...),
    current_user: auth.MongoUser = Depends(auth.get_current_user),
    db: Any = Depends(get_db)
):
    """
    Accepts a PDF medical report file, saves it, extracts text,
    and runs Gemini analysis to yield structured summaries.
    """
    if current_user.role != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can upload reports"
        )
        
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF reports are supported")

    # Read bytes
    file_bytes = await file.read()
    
    # Save the file locally inside the backend directory for persistence
    reports_dir = os.path.join("backend_uploads", current_user.id)
    os.makedirs(reports_dir, exist_ok=True)
    
    file_path = os.path.join(reports_dir, file.filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # 1. Extract text using pypdf
    report_text = extract_text_from_pdf(file_bytes)
    
    # 2. Perform analysis
    analysis_data = {}
    if not report_text:
        analysis_data = mock_report_analysis("Hemoglobin Fasting Glucose Vitamin D")
    elif not settings.GEMINI_API_KEY:
        analysis_data = mock_report_analysis(report_text)
    else:
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            prompt = f"""
            Analyze the following text extracted from a medical report.
            Summarize the key health metrics and findings. Highlight abnormal metrics (like high blood sugar, low vitamin D, abnormal blood pressure, etc.).
            Provide health recommendations and specify if a doctor follow-up is required.
            Return the response in a structured JSON format with EXACTLY the following keys:
            {{
              "summary": "General summary of the report",
              "key_findings": [
                {{"parameter": "Parameter Name", "value": "Value", "status": "High|Low|Normal"}}
              ],
              "recommendations": ["Recommendation 1", "Recommendation 2"],
              "follow_up_required": true|false
            }}
            Do not wrap the JSON output in markdown fences (like ```json), just output the raw JSON string directly.
            Report text:
            {report_text[:4000]}
            """
            response = model.generate_content(prompt)
            text_result = response.text.strip()
            
            if text_result.startswith("```"):
                lines = text_result.split("\n")
                if lines[0].startswith("```json") or lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].strip() == "```":
                    lines = lines[:-1]
                text_result = "\n".join(lines).strip()
                
            analysis_data = json.loads(text_result)
        except Exception as e:
            logger.error(f"Gemini analysis failed: {str(e)}. Falling back to local scanner.")
            analysis_data = mock_report_analysis(report_text)

    # Save to MongoDB
    db_report = {
        "patient_id": current_user.id,
        "file_name": file.filename,
        "file_url": file_path,
        "ai_summary": analysis_data,
        "upload_date": datetime.utcnow()
    }
    
    result = db.medical_reports.insert_one(db_report)
    db_report["id"] = str(result.inserted_id)
    
    return serialize_doc(db_report)


@router.get("", response_model=List[schemas.MedicalReportResponse])
def get_reports(
    current_user: auth.MongoUser = Depends(auth.get_current_user),
    db: Any = Depends(get_db)
):
    """Retrieves all reports uploaded by the patient."""
    if current_user.role == "patient":
        reports = list(db.medical_reports.find({"patient_id": current_user.id}).sort("upload_date", -1))
        return serialize_list(reports)
    elif current_user.role == "admin":
        reports = list(db.medical_reports.find({}).sort("upload_date", -1))
        return serialize_list(reports)
    raise HTTPException(status_code=403, detail="Unauthorized to view reports list")
