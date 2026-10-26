from typing import List
from fastapi import APIRouter, Depends, HTTPException
from backend.app.schemas.schemas import RoadmapRequest, RoadmapResult
from backend.app.core.security import get_current_user
from backend.app.core.database import get_roadmaps_col
from backend.app.services.research.roadmap_generator import roadmap_generator

router = APIRouter(prefix="/roadmaps", tags=["Research Roadmaps"])

@router.get("", response_model=List[RoadmapResult])
async def list_roadmaps(current_user: dict = Depends(get_current_user)):
    col = get_roadmaps_col()
    cursor = col.find({"user_id": current_user["_id"]}).sort("created_at", -1)
    return await cursor.to_list(length=50)

@router.post("", response_model=RoadmapResult)
async def generate_new_roadmap(
    req: RoadmapRequest,
    current_user: dict = Depends(get_current_user)
):
    roadmap = await roadmap_generator.generate_roadmap(
        user_id=current_user["_id"],
        request=req
    )
    return roadmap

@router.get("/{roadmap_id}", response_model=RoadmapResult)
async def get_roadmap(roadmap_id: str, current_user: dict = Depends(get_current_user)):
    col = get_roadmaps_col()
    roadmap = await col.find_one({"_id": roadmap_id, "user_id": current_user["_id"]})
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    return roadmap

@router.delete("/{roadmap_id}")
async def delete_roadmap(roadmap_id: str, current_user: dict = Depends(get_current_user)):
    col = get_roadmaps_col()
    res = await col.delete_one({"_id": roadmap_id, "user_id": current_user["_id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    return {"message": "Roadmap deleted successfully"}
