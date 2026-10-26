from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from backend.app.schemas.schemas import ResearchGapsResult
from backend.app.core.security import get_current_user
from backend.app.services.research.gap_detector import research_gap_detector

router = APIRouter(prefix="/research-gaps", tags=["Research Gap Detection"])

@router.get("", response_model=ResearchGapsResult)
async def detect_research_gaps(
    paper_ids: Optional[List[str]] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    result = await research_gap_detector.detect_gaps(
        user_id=current_user["_id"],
        paper_ids=paper_ids
    )
    return result
