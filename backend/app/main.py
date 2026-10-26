import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import db_manager, get_papers_col, get_paper_analysis_col, get_projects_col, get_notes_col
from backend.app.core.security import ensure_demo_user
from backend.app.services.retrieval.vector_store import vector_store

# Import routers
from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.users import router as users_router
from backend.app.api.v1.projects import router as projects_router
from backend.app.api.v1.papers import router as papers_router
from backend.app.api.v1.analysis import router as analysis_router
from backend.app.api.v1.chat import router as chat_router
from backend.app.api.v1.search import router as search_router
from backend.app.api.v1.comparison import router as comparison_router
from backend.app.api.v1.research_gaps import router as research_gaps_router
from backend.app.api.v1.roadmaps import router as roadmaps_router
from backend.app.api.v1.notes import router as notes_router
from backend.app.api.v1.exports import router as exports_router
from backend.app.api.v1.jobs import router as jobs_router

async def seed_initial_research_data():
    """Seeds realistic academic sample papers into the demo account so the UI is immediately functional."""
    papers_col = get_papers_col()
    demo_uid = "user-demo-001"
    existing_count = await papers_col.count_documents({"user_id": demo_uid})

    if existing_count == 0:
        print("Seeding initial academic papers for demo user...")
        projects_col = get_projects_col()
        p1_id = "proj-ai-robustness"
        await projects_col.insert_one({
            "_id": p1_id,
            "user_id": demo_uid,
            "name": "Robust Neural Architectures",
            "description": "Evaluation of transformer robustness and distribution shift mitigation.",
            "domain": "Computer Vision & NLP",
            "created_at": "2026-02-15T10:00:00"
        })

        samples = [
            {
                "_id": "paper-sample-01",
                "user_id": demo_uid,
                "project_id": p1_id,
                "title": "Attention Is All You Need: Scalable Transformers and Empirical Foundations",
                "authors": ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "Jakob Uszkoreit"],
                "year": 2023,
                "doi": "10.48550/arXiv.1706.03762",
                "journal": "NeurIPS",
                "file_path": None,
                "file_name": "attention_is_all_you_need.pdf",
                "file_size": 2210000,
                "page_count": 15,
                "processing_status": "complete",
                "is_favorite": True,
                "keywords": ["Transformers", "Self-Attention", "Sequence Modeling"],
                "abstract": "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose the Transformer, a model architecture eschewing recurrence and relying entirely on an attention mechanism to draw global dependencies between input and output.",
                "created_at": "2026-02-16T14:30:00"
            },
            {
                "_id": "paper-sample-02",
                "user_id": demo_uid,
                "project_id": p1_id,
                "title": "Deep Residual Learning for Large-Scale Visual Recognition",
                "authors": ["Kaiming He", "Xiangyu Zhang", "Shaoqing Ren", "Jian Sun"],
                "year": 2022,
                "doi": "10.1109/CVPR.2016.90",
                "journal": "CVPR",
                "file_path": None,
                "file_name": "deep_residual_learning.pdf",
                "file_size": 1840000,
                "page_count": 12,
                "processing_status": "complete",
                "is_favorite": False,
                "keywords": ["Residual Networks", "Computer Vision", "Deep Learning"],
                "abstract": "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs.",
                "created_at": "2026-02-17T09:15:00"
            },
            {
                "_id": "paper-sample-03",
                "user_id": demo_uid,
                "project_id": p1_id,
                "title": "LoRA: Low-Rank Adaptation of Large Language Models",
                "authors": ["Edward J. Hu", "Yelong Shen", "Phillip Wallis", "Zeyuan Allen-Zhu"],
                "year": 2024,
                "doi": "10.48550/arXiv.2106.09685",
                "journal": "ICLR",
                "file_path": None,
                "file_name": "lora_low_rank_adaptation.pdf",
                "file_size": 1420000,
                "page_count": 14,
                "processing_status": "complete",
                "is_favorite": True,
                "keywords": ["Parameter-Efficient Fine-Tuning", "LoRA", "LLMs"],
                "abstract": "An important paradigm involves pretraining on general domain data and task-specific adaptation. LoRA freezes pretrained model weights and injects trainable rank decomposition matrices into each transformer layer, greatly reducing trainable parameters without quality loss.",
                "created_at": "2026-02-18T16:45:00"
            }
        ]

        analysis_col = get_paper_analysis_col()
        for p in samples:
            await papers_col.insert_one(p)
            pid = p["_id"]
            # Add analysis
            await analysis_col.insert_one({
                "_id": f"analysis-{pid}",
                "paper_id": pid,
                "user_id": demo_uid,
                "abstract": p["abstract"],
                "research_problem": f"Alleviating training instability and computational bottlenecks in sequence and representation learning.",
                "objectives": [
                    "Eliminate sequential recurrence bottlenecks.",
                    "Optimize gradient backpropagation through identity mapping shortcut connections.",
                    "Demonstrate state-of-the-art benchmark performance with reduced FLOP requirements."
                ],
                "methodology": "Feed-forward attention modules coupled with layer normalization and residual connections.",
                "key_contributions": [
                    "Foundational architectural innovation adopted across modern AI backbones.",
                    "Comprehensive ablation benchmarks verifying multi-head dimensional scaling.",
                    "Theoretical proof of vanishing gradient mitigation."
                ],
                "results": "Achieved new state-of-the-art results on WMT 2014 translation and ImageNet top-1 classification.",
                "limitations": [
                    "Quadratic O(N^2) memory scaling relative to sequence length in raw dot-product attention.",
                    "Requires specialized hardware tensor acceleration for optimal throughput."
                ],
                "future_work": [
                    "Sub-quadratic linear attention approximations and state-space model hybrids.",
                    "Dynamic quantization for resource-constrained edge deployments."
                ],
                "created_at": "2026-02-19T10:00:00"
            })

            # Vector chunks for grounded RAG chat
            chunks = [
                {
                    "chunk_index": 0,
                    "page_number": 1,
                    "content": f"{p['title']}. Abstract: {p['abstract']}",
                    "char_count": len(p['abstract'])
                },
                {
                    "chunk_index": 1,
                    "page_number": 3,
                    "content": f"In Section 3: Architecture and Methodology for {p['title']}, we define multi-head projection tensors. Layer normalization is applied to each sub-layer followed by dropout regularization. This guarantees stable residual gradients.",
                    "char_count": 210
                },
                {
                    "chunk_index": 2,
                    "page_number": 7,
                    "content": f"In Section 5: Experimental Evaluation, our method achieves statistically significant performance gains over previous baselines with p < 0.001. Limitations include memory bounds under extreme batch sizes.",
                    "char_count": 200
                }
            ]
            vector_store.add_chunks(
                user_id=demo_uid,
                paper_id=pid,
                paper_title=p["title"],
                chunks=chunks,
                project_id=p1_id
            )

        # Seed sample note
        notes_col = get_notes_col()
        await notes_col.insert_one({
            "_id": "note-sample-01",
            "user_id": demo_uid,
            "paper_id": "paper-sample-01",
            "paper_title": "Attention Is All You Need",
            "project_id": p1_id,
            "page_number": 3,
            "title": "Scaling Law Observation",
            "content": "Noted the quadratic complexity in attention weights. Consider evaluating linear attention variants like FlashAttention or RWKV for future edge experiments.",
            "tags": ["Architecture", "Complexity", "Idea"],
            "created_at": "2026-02-20T11:00:00"
        })

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await db_manager.connect()
    await ensure_demo_user()
    await seed_initial_research_data()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent Research Paper Analysis and Recommendation System Backend API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for local dev flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1 Router Registration
v1_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=v1_prefix)
app.include_router(users_router, prefix=v1_prefix)
app.include_router(projects_router, prefix=v1_prefix)
app.include_router(papers_router, prefix=v1_prefix)
app.include_router(analysis_router, prefix=v1_prefix)
app.include_router(chat_router, prefix=v1_prefix)
app.include_router(search_router, prefix=v1_prefix)
app.include_router(comparison_router, prefix=v1_prefix)
app.include_router(research_gaps_router, prefix=v1_prefix)
app.include_router(roadmaps_router, prefix=v1_prefix)
app.include_router(notes_router, prefix=v1_prefix)
app.include_router(exports_router, prefix=v1_prefix)
app.include_router(jobs_router, prefix=v1_prefix)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database": "connected",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
