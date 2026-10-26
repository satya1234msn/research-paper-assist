import os
import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from backend.app.schemas.schemas import ExportRequest, ExportOut
from backend.app.core.security import get_current_user
from backend.app.core.config import settings
from backend.app.core.database import (
    get_exports_col, get_papers_col, get_paper_analysis_col, get_roadmaps_col, get_notes_col
)
from backend.app.services.export.exporter import export_service
from backend.app.services.research.gap_detector import research_gap_detector
from backend.app.services.research.comparison import paper_comparison_service

router = APIRouter(prefix="/exports", tags=["Export Center"])

@router.get("", response_model=List[ExportOut])
async def list_exports(current_user: dict = Depends(get_current_user)):
    col = get_exports_col()
    cursor = col.find({"user_id": current_user["_id"]}).sort("created_at", -1)
    return await cursor.to_list(length=50)

@router.post("", response_model=ExportOut)
async def create_export(req: ExportRequest, current_user: dict = Depends(get_current_user)):
    uid = current_user["_id"]
    export_id = f"exp-{uuid.uuid4().hex[:12]}"

    title = req.custom_title or f"ResearchAssist AI Export - {req.export_type.replace('_', ' ').title()}"
    sections = []

    # 1. Paper Summary / Analysis
    if req.export_type in ("paper_summary", "paper_analysis") and req.entity_id:
        papers_col = get_papers_col()
        analysis_col = get_paper_analysis_col()
        paper = await papers_col.find_one({"_id": req.entity_id, "user_id": uid})
        if paper:
            title = f"Paper Analysis: {paper.get('title')}"
            an = await analysis_col.find_one({"paper_id": req.entity_id}) or {}
            sections = [
                {"heading": "Bibliographic Metadata", "body": f"Authors: {', '.join(paper.get('authors', []))}\nYear: {paper.get('year')}\nVenue: {paper.get('journal')}\nDOI: {paper.get('doi')}"},
                {"heading": "Abstract", "body": paper.get("abstract", "")},
                {"heading": "Research Problem", "body": an.get("research_problem", "")},
                {"heading": "Objectives", "body": an.get("objectives", [])},
                {"heading": "Methodology", "body": an.get("methodology", "")},
                {"heading": "Key Contributions", "body": an.get("key_contributions", [])},
                {"heading": "Experimental Results", "body": an.get("results", "")},
                {"heading": "Identified Limitations", "body": an.get("limitations", [])},
                {"heading": "Future Research Directions", "body": an.get("future_work", [])}
            ]

    # 2. Comparison
    elif req.export_type == "comparison" and req.entity_ids:
        comp = await paper_comparison_service.compare_papers(user_id=uid, paper_ids=req.entity_ids)
        title = "Comparative Literature Analysis"
        sections = [
            {"heading": "Executive Synthesis", "body": "Structured multi-dimensional comparison of methodological paradigms and empirical benchmarks across selected literature."},
            {"heading": "Key Similarities", "body": comp.get("similarities", [])},
            {"heading": "Methodological Differences", "body": comp.get("differences", [])},
            {"heading": "Observed Contradictions", "body": comp.get("contradictions", [])},
            {"heading": "Research Opportunities", "body": comp.get("research_opportunities", [])}
        ]

    # 3. Research Gaps
    elif req.export_type == "research_gaps":
        gaps_data = await research_gap_detector.detect_gaps(user_id=uid, paper_ids=req.entity_ids)
        title = "Literature Research Gap Analysis"
        sections = [{"heading": "Disclaimer", "body": gaps_data.get("disclaimer", "")}]
        for g in gaps_data.get("gaps", []):
            sections.append({
                "heading": f"Gap: {g['gap_title']} [{g['confidence_strength']} Confidence]",
                "body": f"Explanation: {g['explanation']}\n\nLiterature Evidence: {g['evidence_from_literature']}\n\nAI Interpretation: {g['ai_interpretation']}\n\nWhy It Matters: {g['why_it_matters']}\n\nProposed Direction: {g['potential_research_direction']}"
            })

    # 4. Roadmap
    elif req.export_type == "roadmap" and req.entity_id:
        roadmaps_col = get_roadmaps_col()
        rd = await roadmaps_col.find_one({"_id": req.entity_id, "user_id": uid})
        if rd:
            title = rd.get("research_title", "Research Roadmap")
            sections = [
                {"heading": "Problem Statement", "body": rd.get("problem_statement", "")},
                {"heading": "Motivation", "body": rd.get("motivation", "")},
                {"heading": "Research Objectives", "body": rd.get("research_objectives", [])},
                {"heading": "Research Questions", "body": rd.get("research_questions", [])},
                {"heading": "Identified Research Gap", "body": rd.get("identified_research_gap", "")},
                {"heading": "Proposed Methodology", "body": rd.get("proposed_methodology", "")},
                {"heading": "Datasets & Evaluation Metrics", "body": f"Datasets: {', '.join(rd.get('datasets_to_explore', []))}\nMetrics: {', '.join(rd.get('evaluation_metrics', []))}"},
                {"heading": "Risks & Mitigation", "body": rd.get("risks_and_limitations", [])}
            ]
            for p in rd.get("timeline_phases", []):
                sections.append({
                    "heading": f"{p['title']} ({p['duration']})",
                    "body": f"Objectives: {', '.join(p.get('objectives', []))}\nDeliverables: {', '.join(p.get('deliverables', []))}\nMilestones: {', '.join(p.get('milestones', []))}"
                })

    # 5. Notes
    elif req.export_type == "notes":
        notes_col = get_notes_col()
        notes = await notes_col.find({"user_id": uid}).to_list(length=100)
        title = "Research Notes & Annotations"
        sections = []
        for n in notes:
            paper_ref = f" (Ref: {n.get('paper_title')})" if n.get("paper_title") else ""
            sections.append({
                "heading": f"{n.get('title')}{paper_ref}",
                "body": f"{n.get('content')}\nTags: {', '.join(n.get('tags', []))}"
            })

    if not sections:
        sections = [
            {"heading": "Overview", "body": "ResearchAssist AI curated document analysis and evidence summary."},
            {"heading": "Methodological Scope", "body": "Standardized academic review protocol with grounded citation verification."}
        ]

    # Generate document
    res = export_service.export_content(
        title=title,
        content_sections=sections,
        format_type=req.format or "pdf"
    )

    doc = {
        "_id": export_id,
        "user_id": uid,
        "export_type": req.export_type,
        "format": req.format or "pdf",
        "file_name": res["file_name"],
        "download_url": res["download_url"],
        "status": "complete",
        "created_at": datetime.utcnow().isoformat()
    }
    exports_col = get_exports_col()
    await exports_col.insert_one(doc)

    return doc

@router.get("/download/{file_name}")
async def download_export(file_name: str):
    exports_dir = os.path.join(settings.STORAGE_DIR, "exports")
    safe_name = os.path.basename(file_name)
    path = os.path.join(exports_dir, safe_name)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Export file not found.")

    media_type = "application/pdf"
    if file_name.endswith(".docx"):
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif file_name.endswith(".txt"):
        media_type = "text/plain"

    return FileResponse(path, filename=safe_name, media_type=media_type)
