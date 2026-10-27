from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from backend.app.schemas.schemas import ResearchGapsResult
from backend.app.core.security import get_current_user
from backend.app.services.research.gap_detector import research_gap_detector

router = APIRouter(prefix="/research-gaps", tags=["Research Gap Detection"])

@router.get("", response_model=ResearchGapsResult)
async def detect_research_gaps(
    paper_ids: Optional[List[str]] = Query(None),
    paper_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    ids = []
    if paper_id:
        ids.append(paper_id)
    if paper_ids:
        for p in paper_ids:
            if "," in p:
                ids.extend([x.strip() for x in p.split(",") if x.strip()])
            else:
                ids.append(p.strip())

    result = await research_gap_detector.detect_gaps(
        user_id=current_user["_id"],
        paper_ids=ids if ids else None
    )
    return result
