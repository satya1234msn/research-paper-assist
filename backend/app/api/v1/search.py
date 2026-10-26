from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from backend.app.schemas.schemas import AcademicPaperItem
from backend.app.core.security import get_current_user
from backend.app.services.research.academic_search import academic_search_service

router = APIRouter(prefix="/search", tags=["Academic Search"])

@router.get("", response_model=List[AcademicPaperItem])
async def search_academic_literature(
    q: str = Query(..., min_length=2, description="Natural language research query"),
    source: Optional[str] = Query("all", description="all, openalex, crossref, arxiv"),
    year_start: Optional[int] = Query(None),
    year_end: Optional[int] = Query(None),
    limit: Optional[int] = Query(10, le=30),
    current_user: dict = Depends(get_current_user)
):
    results = await academic_search_service.search(
        query=q,
        source=source or "all",
        limit=limit or 10,
        year_start=year_start,
        year_end=year_end
    )
    return results
