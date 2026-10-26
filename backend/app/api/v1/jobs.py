from fastapi import APIRouter, Depends, HTTPException
from backend.app.schemas.schemas import JobOut
from backend.app.core.security import get_current_user
from backend.app.core.database import get_processing_jobs_col

router = APIRouter(prefix="/jobs", tags=["Background Jobs"])

@router.get("/{job_id}", response_model=JobOut)
async def get_job_status(job_id: str, current_user: dict = Depends(get_current_user)):
    col = get_processing_jobs_col()
    job = await col.find_one({"_id": job_id, "user_id": current_user["_id"]})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
