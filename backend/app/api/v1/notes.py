import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from backend.app.schemas.schemas import NoteCreate, NoteOut
from backend.app.core.security import get_current_user
from backend.app.core.database import get_notes_col, get_papers_col

router = APIRouter(prefix="/notes", tags=["Notes & Highlights"])

@router.get("", response_model=List[NoteOut])
async def list_notes(
    paper_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    col = get_notes_col()
    query = {"user_id": current_user["_id"]}
    if paper_id:
        query["paper_id"] = paper_id
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}},
        ]
    cursor = col.find(query).sort("created_at", -1)
    return await cursor.to_list(length=100)

@router.post("", response_model=NoteOut)
async def create_note(data: NoteCreate, current_user: dict = Depends(get_current_user)):
    col = get_notes_col()
    papers_col = get_papers_col()
    nid = f"note-{uuid.uuid4().hex[:12]}"

    paper_title = None
    if data.paper_id:
        p = await papers_col.find_one({"_id": data.paper_id})
        if p:
            paper_title = p.get("title")

    doc = {
        "_id": nid,
        "user_id": current_user["_id"],
        "paper_id": data.paper_id,
        "paper_title": paper_title,
        "project_id": data.project_id,
        "page_number": data.page_number,
        "title": data.title,
        "content": data.content,
        "tags": data.tags or ["Observation"],
        "created_at": datetime.utcnow().isoformat()
    }
    await col.insert_one(doc)
    return doc

@router.delete("/{note_id}")
async def delete_note(note_id: str, current_user: dict = Depends(get_current_user)):
    col = get_notes_col()
    res = await col.delete_one({"_id": note_id, "user_id": current_user["_id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Note deleted successfully"}
