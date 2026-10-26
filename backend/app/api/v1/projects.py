import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from backend.app.schemas.schemas import ProjectCreate, ProjectOut
from backend.app.core.security import get_current_user
from backend.app.core.database import get_projects_col, get_papers_col

router = APIRouter(prefix="/projects", tags=["Research Projects"])

@router.get("", response_model=List[ProjectOut])
async def list_projects(current_user: dict = Depends(get_current_user)):
    col = get_projects_col()
    papers_col = get_papers_col()
    cursor = col.find({"user_id": current_user["_id"]}).sort("created_at", -1)
    projects = await cursor.to_list(length=100)

    for p in projects:
        p["papers_count"] = await papers_col.count_documents({"project_id": p["_id"]})
    return projects

@router.post("", response_model=ProjectOut)
async def create_project(data: ProjectCreate, current_user: dict = Depends(get_current_user)):
    col = get_projects_col()
    pid = f"proj-{uuid.uuid4().hex[:12]}"
    doc = {
        "_id": pid,
        "user_id": current_user["_id"],
        "name": data.name,
        "description": data.description or "",
        "domain": data.domain or "General",
        "created_at": datetime.utcnow().isoformat()
    }
    await col.insert_one(doc)
    doc["papers_count"] = 0
    return doc

@router.delete("/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    col = get_projects_col()
    res = await col.delete_one({"_id": project_id, "user_id": current_user["_id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}
