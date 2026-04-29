import os
from fastapi import APIRouter, UploadFile, File, HTTPException
import uuid
from app.utils.parser import parse_fortiweb_log
from app.utils.ai import generate_security_insight

router = APIRouter()

# Temporary upload directory
UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
async def upload_log_file(file: UploadFile = File(...)):
    """
    Endpoint to upload FortiWeb log files, parse them, and generate AI insights.
    """
    if not file.filename.endswith(('.log', '.txt', '.csv')):
        raise HTTPException(status_code=400, detail="Invalid file type. Only .log, .txt, .csv are allowed.")
    
    file_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    saved_filename = f"{file_id}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, saved_filename)
    
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Parse the file
        parsed_data = parse_fortiweb_log(file_path)
        
        # Generate AI Insight
        ai_insight = generate_security_insight(parsed_data)
        
        # Combine everything to send back to frontend
        response_data = {
            "message": "File processed successfully",
            "file_id": file_id,
            "filename": file.filename,
            "data": parsed_data,
            "ai_insight": ai_insight
        }
        
        return response_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
