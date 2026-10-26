from fastapi import APIRouter, Depends
from typing import Dict, Any, List
from pydantic import BaseModel
from backend.app.schemas.schemas import UserOut
from backend.app.core.security import get_current_user
from backend.app.core.database import (
    get_users_col, get_papers_col, get_projects_col, get_notes_col, get_roadmaps_col
)

router = APIRouter(prefix="/users", tags=["Users"])

class UserProfileUpdate(BaseModel):
    name: str
    institution: str
    research_interests: List[str]

@router.get("/profile", response_model=UserOut)
async def get_profile(current_user: dict = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserOut)
async def update_profile(data: UserProfileUpdate, current_user: dict = Depends(get_current_user)):
    users_col = get_users_col()
    await users_col.update_one(
        {"_id": current_user["_id"]},
        {"$set": {
            "name": data.name,
            "institution": data.institution,
            "research_interests": data.research_interests
        }}
    )
    updated = await users_col.find_one({"_id": current_user["_id"]})
    return updated

@router.get("/stats")
async def get_user_dashboard_stats(current_user: dict = Depends(get_current_user)):
    uid = current_user["_id"]
    papers_col = get_papers_col()
    projects_col = get_projects_col()
    notes_col = get_notes_col()
    roadmaps_col = get_roadmaps_col()

    total_papers = await papers_col.count_documents({"user_id": uid})
    analyzed_papers = await papers_col.count_documents({"user_id": uid, "processing_status": "complete"})
    projects_count = await projects_col.count_documents({"user_id": uid})
    notes_count = await notes_col.count_documents({"user_id": uid})
    roadmaps_count = await roadmaps_col.count_documents({"user_id": uid})

    return {
        "total_papers": total_papers,
        "papers_analyzed": analyzed_papers,
        "research_projects": projects_count,
        "saved_notes": notes_count,
        "roadmaps_generated": roadmaps_count
    }
