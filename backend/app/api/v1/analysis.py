import os
from fastapi import APIRouter, Depends, HTTPException
from backend.app.schemas.schemas import PaperAnalysisOut
from backend.app.core.security import get_current_user
from backend.app.core.database import get_papers_col, get_paper_analysis_col
from backend.app.services.pdf.extractor import PDFExtractor
from backend.app.services.llm.engine import llm_engine

router = APIRouter(prefix="/papers", tags=["Paper Analysis"])

@router.get("/{paper_id}/analysis", response_model=PaperAnalysisOut)
async def get_paper_analysis(paper_id: str, current_user: dict = Depends(get_current_user)):
    papers_col = get_papers_col()
    paper = await papers_col.find_one({"_id": paper_id})
    analysis_col = get_paper_analysis_col()
    analysis = await analysis_col.find_one({"paper_id": paper_id})

    if not analysis:
        # Extract from physical document if available, or analyze metadata
        title = (paper.get("title") if paper else None) or "Research Document"
        file_path = paper.get("file_path") if paper else None
        
        full_text = ""
        sections = {}
        if file_path and os.path.exists(file_path):
            try:
                doc_data = PDFExtractor.extract_document(file_path)
                full_text = doc_data["full_text"]
                sections = doc_data["sections"]
            except Exception as e:
                print(f"Error extracting paper for analysis: {e}")

        abstract = sections.get("abstract") or (paper.get("abstract") if paper else "") or full_text[:800]
        if not sections:
            sections = PDFExtractor._detect_sections(f"{title}\n\nAbstract: {abstract}")

        structured = await llm_engine.analyze_paper_structure(title, full_text or abstract, sections)

        analysis = {
            "_id": f"analysis-{paper_id}",
            "paper_id": paper_id,
            "user_id": current_user["_id"],
            "abstract": abstract or "Detailed abstract under review.",
            "research_problem": structured.get("research_problem", ""),
            "objectives": structured.get("objectives", []),
            "methodology": structured.get("methodology", ""),
            "key_contributions": structured.get("key_contributions", []),
            "results": structured.get("results", ""),
            "limitations": structured.get("limitations", []),
            "future_work": structured.get("future_work", [])
        }
        await analysis_col.insert_one(analysis)

    return analysis

@router.post("/{paper_id}/analysis/regenerate", response_model=PaperAnalysisOut)
async def regenerate_paper_analysis(paper_id: str, current_user: dict = Depends(get_current_user)):
    papers_col = get_papers_col()
    paper = await papers_col.find_one({"_id": paper_id})
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    analysis_col = get_paper_analysis_col()
    title = paper.get("title", "Research Paper")
    file_path = paper.get("file_path")

    full_text = ""
    sections = {}
    if file_path and os.path.exists(file_path):
        try:
            doc_data = PDFExtractor.extract_document(file_path)
            full_text = doc_data["full_text"]
            sections = doc_data["sections"]
        except Exception as e:
            print(f"Regenerate extract note: {e}")

    abstract = sections.get("abstract") or paper.get("abstract", "") or full_text[:800]
    if not sections:
        sections = PDFExtractor._detect_sections(f"{title}\n\nAbstract: {abstract}")

    new_data = await llm_engine.analyze_paper_structure(title, full_text or abstract, sections)
    updated_doc = {
        "_id": f"analysis-{paper_id}",
        "paper_id": paper_id,
        "user_id": current_user["_id"],
        "abstract": abstract,
        "research_problem": new_data.get("research_problem", ""),
        "objectives": new_data.get("objectives", []),
        "methodology": new_data.get("methodology", ""),
        "key_contributions": new_data.get("key_contributions", []),
        "results": new_data.get("results", ""),
        "limitations": new_data.get("limitations", []),
        "future_work": new_data.get("future_work", [])
    }
    await analysis_col.delete_one({"paper_id": paper_id})
    await analysis_col.insert_one(updated_doc)
    return updated_doc
