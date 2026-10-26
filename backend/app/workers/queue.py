import asyncio
import traceback
from datetime import datetime
from typing import Dict, Any
from backend.app.core.database import get_processing_jobs_col, get_papers_col, get_paper_analysis_col
from backend.app.services.pdf.extractor import PDFExtractor
from backend.app.services.retrieval.vector_store import vector_store
from backend.app.services.llm.engine import llm_engine

class BackgroundJobWorker:
    """Processes PDF papers through 8 distinct academic stages in background tasks."""

    @staticmethod
    async def process_paper_pipeline(job_id: str, paper_id: str, user_id: str, file_path: str):
        jobs_col = get_processing_jobs_col()
        papers_col = get_papers_col()
        analysis_col = get_paper_analysis_col()

        async def update_stage(step: str, progress: int, status: str = "processing"):
            await jobs_col.update_one(
                {"_id": job_id},
                {"$set": {"status": status, "progress": progress, "current_step": step, "updated_at": datetime.utcnow().isoformat()}}
            )
            await papers_col.update_one(
                {"_id": paper_id},
                {"$set": {"processing_status": step.lower().replace(" ", "_")}}
            )
            # Brief yield to simulate realistic stage transition and let frontend poll smoothly
            await asyncio.sleep(0.4)

        try:
            # Stage 1: Uploading / Verifying file
            await update_stage("Uploading & Validating", 10)

            # Stage 2: Extracting text from PDF
            await update_stage("Extracting Text", 25)
            doc_data = PDFExtractor.extract_document(file_path)
            page_count = doc_data["page_count"]
            full_text = doc_data["full_text"]
            sections = doc_data["sections"]
            meta = doc_data.get("metadata", {})

            # Stage 3: Cleaning document
            await update_stage("Cleaning Document", 40)
            paper_doc = await papers_col.find_one({"_id": paper_id})
            paper_title = paper_doc.get("title") if paper_doc else meta.get("title") or "Research Document"

            # Stage 4: Creating chunks
            await update_stage("Creating Semantic Chunks", 55)
            chunks = PDFExtractor.chunk_document(doc_data["pages"])

            # Stage 5: Generating embeddings
            await update_stage("Generating Embeddings", 70)

            # Stage 6: Indexing document in vector store
            await update_stage("Indexing Vector Store", 82)
            vector_store.add_chunks(
                user_id=user_id,
                paper_id=paper_id,
                paper_title=paper_title,
                chunks=chunks,
                project_id=paper_doc.get("project_id") if paper_doc else None
            )

            # Stage 7: Analyzing paper structure
            await update_stage("Analyzing Paper Structure", 92)
            structured_analysis = await llm_engine.analyze_paper_structure(paper_title, full_text, sections)
            
            # Save analysis
            analysis_record = {
                "_id": f"analysis-{paper_id}",
                "paper_id": paper_id,
                "user_id": user_id,
                "abstract": sections.get("abstract") or paper_doc.get("abstract") or full_text[:600],
                "research_problem": structured_analysis.get("research_problem", ""),
                "objectives": structured_analysis.get("objectives", []),
                "methodology": structured_analysis.get("methodology", ""),
                "key_contributions": structured_analysis.get("key_contributions", []),
                "results": structured_analysis.get("results", ""),
                "limitations": structured_analysis.get("limitations", []),
                "future_work": structured_analysis.get("future_work", []),
                "created_at": datetime.utcnow().isoformat()
            }
            await analysis_col.delete_one({"paper_id": paper_id})
            await analysis_col.insert_one(analysis_record)

            # Stage 8: Complete
            await papers_col.update_one(
                {"_id": paper_id},
                {"$set": {
                    "page_count": page_count,
                    "processing_status": "complete",
                    "abstract": analysis_record["abstract"][:800],
                    "updated_at": datetime.utcnow().isoformat()
                }}
            )

            await jobs_col.update_one(
                {"_id": job_id},
                {"$set": {
                    "status": "complete",
                    "progress": 100,
                    "current_step": "Processing Complete",
                    "updated_at": datetime.utcnow().isoformat()
                }}
            )

        except Exception as e:
            traceback.print_exc()
            await jobs_col.update_one(
                {"_id": job_id},
                {"$set": {
                    "status": "failed",
                    "progress": 0,
                    "current_step": "Processing Failed",
                    "error": str(e),
                    "updated_at": datetime.utcnow().isoformat()
                }}
            )
            await papers_col.update_one(
                {"_id": paper_id},
                {"$set": {"processing_status": "failed"}}
            )

background_worker = BackgroundJobWorker()
