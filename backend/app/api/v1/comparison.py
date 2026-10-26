from fastapi import APIRouter, Depends, HTTPException
from backend.app.schemas.schemas import ComparisonRequest, ComparisonResult
from backend.app.core.security import get_current_user
from backend.app.services.research.comparison import paper_comparison_service

router = APIRouter(prefix="/comparison", tags=["Paper Comparison"])

@router.post("", response_model=ComparisonResult)
async def compare_papers(
    req: ComparisonRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        result = await paper_comparison_service.compare_papers(
            user_id=current_user["_id"],
            paper_ids=req.paper_ids
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
