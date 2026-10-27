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

        sample_analyses = {
            "paper-sample-01": {
                "research_problem": "Recurrent sequence transduction models process tokens sequentially, precluding parallelization across training examples and suffering from vanishing gradients over long-range dependencies.",
                "objectives": [
                    "Eliminate sequential recurrence and convolutions entirely from the sequence model.",
                    "Establish constant computational path length between arbitrary token positions.",
                    "Significantly accelerate multi-GPU training parallelization."
                ],
                "methodology": "Multi-head scaled dot-product self-attention encoder-decoder architecture with sinusoidal positional encodings and layer normalization.",
                "key_contributions": [
                    "Introduced the Transformer architecture without recurrent or convolutional layers.",
                    "Formulated Multi-Head Attention to attend to information from different representation subspaces.",
                    "Established new state-of-the-art BLEU score of 28.4 on WMT 2014 English-to-German."
                ],
                "results": "Achieved 28.4 BLEU on WMT 2014 En-De and 41.8 BLEU on En-Fr, establishing new SOTA while training in 3.5 days on 8 P100 GPUs.",
                "limitations": [
                    "Quadratic O(N^2) time and memory complexity with respect to sequence length N.",
                    "Strict input context window limits processing of long books or dense scientific repositories.",
                    "Requires massive pretraining datasets due to lack of convolutional inductive bias."
                ],
                "future_work": [
                    "Sub-quadratic sparse and linear attention approximations.",
                    "Extending attention mechanisms to continuous image, video, and audio modalities.",
                    "Developing streaming multi-head attention for low-latency speech decoding."
                ]
            },
            "paper-sample-02": {
                "research_problem": "When deeper networks converge, an accuracy degradation problem emerges: network depth increasing leads to accuracy saturation followed by rapid degradation caused by optimization difficulties.",
                "objectives": [
                    "Ease the optimization of ultra-deep convolutional networks.",
                    "Enable robust convergence for networks exceeding 100 to 1000 layers.",
                    "Significantly improve visual recognition benchmarks without parameter explosion."
                ],
                "methodology": "Deep residual learning framework introducing parameter-free identity shortcut connections F(x) + x that bypass stacked convolutional layers.",
                "key_contributions": [
                    "Formulated residual building blocks to alleviate vanishing and exploding gradients.",
                    "Trained 152-layer ResNet, winning 1st place in ILSVRC 2015 Classification and COCO detection.",
                    "Demonstrated that residual networks remain easy to optimize even as depth scales to 1202 layers."
                ],
                "results": "Achieved 3.57% top-5 error on ImageNet classification (surpassing human performance) and 28% relative mAP improvement on COCO.",
                "limitations": [
                    "High sequential depth increases latency on edge and mobile microcontrollers.",
                    "Residual representations may exhibit feature redundancy in extremely deep configurations.",
                    "Requires high batch sizes and GPU memory bandwidth during multi-stage backpropagation."
                ],
                "future_work": [
                    "Multi-scale feature pyramid residual networks for dense scene segmentation.",
                    "Structured channel pruning and quantization of residual blocks for micro-embedded devices.",
                    "Investigating residual identity mappings in recurrent and reinforcement learning pipelines."
                ]
            },
            "paper-sample-03": {
                "research_problem": "Full fine-tuning of multi-billion parameter foundation models requires deploying and maintaining independent full-sized weight checkpoints for every task, creating prohibitive storage and serving overhead.",
                "objectives": [
                    "Reduce downstream fine-tuning parameter overhead by up to 10,000x.",
                    "Eliminate inference latency overhead introduced by serial adapter layers.",
                    "Retain or exceed empirical downstream task performance of full parameter fine-tuning."
                ],
                "methodology": "Parameter-efficient adaptation that freezes pretrained model weights W and injects trainable low-rank decomposition matrices Delta W = B * A with rank r << min(d, k).",
                "key_contributions": [
                    "Formulated Low-Rank Adaptation (LoRA), lowering trainable parameters by 10,000x and GPU VRAM by 3x.",
                    "Zero latency penalty by folding adapter matrices Delta W directly into pretrained weights upon serving.",
                    "Demonstrated that low intrinsic dimensionality allows rank r=4 to 8 to match full fine-tuning across GPT-3 175B."
                ],
                "results": "Matched or outperformed full fine-tuning across GLUE, WikiSQL, and SAMSum benchmarks while reducing checkpoint size from 350GB to 35MB.",
                "limitations": [
                    "Sensitivity to rank r and scaling factor alpha across diverse downstream task distributions.",
                    "Serving multiple heterogeneous LoRA adapters within the same high-throughput inference batch is non-trivial.",
                    "Cannot adapt foundational world knowledge if target task diverges radically from pretraining corpus."
                ],
                "future_work": [
                    "Dynamic rank allocation (AdaLoRA) across individual attention and feedforward layers.",
                    "Quantized Low-Rank Adaptation (QLoRA) for single consumer-grade GPU fine-tuning.",
                    "Applying low-rank adaptation to multi-modal vision-language foundation models."
                ]
            }
        }

        analysis_col = get_paper_analysis_col()
        for p in samples:
            await papers_col.insert_one(p)
            pid = p["_id"]
            ana_data = sample_analyses.get(pid, {
                "research_problem": f"Alleviating training instability and computational bottlenecks in {p['title']}.",
                "objectives": ["Eliminate architectural bottlenecks.", "Demonstrate state-of-the-art benchmark performance."],
                "methodology": "Deep neural architecture with residual connections and normalized layers.",
                "key_contributions": ["Foundational architectural innovation.", "Empirical validation on benchmark datasets."],
                "results": "Achieved significant improvements over baseline models.",
                "limitations": ["Computational complexity under large-scale inputs.", "Hardware acceleration dependencies."],
                "future_work": ["Efficiency optimizations.", "Edge deployment."]
            })
            # Add analysis
            await analysis_col.insert_one({
                "_id": f"analysis-{pid}",
                "paper_id": pid,
                "user_id": demo_uid,
                "abstract": p["abstract"],
                "research_problem": ana_data["research_problem"],
                "objectives": ana_data["objectives"],
                "methodology": ana_data["methodology"],
                "key_contributions": ana_data["key_contributions"],
                "results": ana_data["results"],
                "limitations": ana_data["limitations"],
                "future_work": ana_data["future_work"],
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
    is_mongo = db_manager.is_mongo_active()
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database": "mongodb_atlas" if is_mongo else "local_fallback",
        "mongo_connected": is_mongo,
        "mongo_notice": db_manager.last_error or ("Active connection" if is_mongo else "Local persistent storage active"),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
