# ResearchAssist AI — Intelligent Research Paper Analysis & Recommendation System

**ResearchAssist AI** is an intelligent, evidence-grounded research workspace engineered for researchers, professors, and graduate students. It enables users to upload and extract research papers, perform citation-backed AI question answering, discover academic literature across OpenAlex, arXiv, and Crossref, contrast methodologies in a multi-paper comparison matrix, detect literature research gaps with verifiable citations, and build phased academic research roadmaps.

---

## 🎨 Visual Aesthetics & UI/UX Principles

- **Pure Light Academic SaaS Interface**: Clean, professional, and calm light palette (White, Slate `#F8FAFC`, Soft Blue `#2563EB`, Subtle Teal `#0D9488`, Restrained Indigo `#6366F1`).
- **Strictly NOT Dark Mode / Cyberpunk**: Built for sustained scholarly reading and evidence inspection.
- **Selective React Bits Integration**:
  - `SpotlightCard`: Mouse-tracking radial highlight.
  - `CountUp`: Animated dashboard statistics.
  - `BlurText`: Headline entrance reveals.
  - `ShinyBadge`: Status and AI indicators.
  - `Magic Bento`: Modular workspace and feature layout.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React.js 19 with Vite
- **Styling**: Tailwind CSS v4 & custom light academic design tokens
- **Icons**: Lucide React
- **Routing**: React Router v7
- **HTTP Client**: Axios with automatic JWT bearer interceptor

### Backend
- **Framework**: Python FastAPI
- **Validation**: Pydantic v2
- **Authentication**: JWT (JSON Web Tokens) with secure password hashing
- **Database**: Dual-engine architecture supporting native MongoDB (Motor) and local persistent document store fallback (`./data/db/`)
- **Document Processing**: PyMuPDF (`fitz`) for PDF text & section extraction
- **Embeddings & Vector Store**: Isolated semantic projections with ChromaDB persistent storage and user-scoped metadata filtering
- **Academic Discovery**: Live integrations with OpenAlex, arXiv, and Crossref APIs with 1-click import to library
- **Document Exports**: ReportLab (PDF) and Python-Docx (DOCX) + Plain Text (TXT)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Node.js 18+ (tested on Node v24)
- npm

### 2. Backend Setup
```bash
# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r backend/requirements.txt

# Start FastAPI backend server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API documentation is available interactively at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in your browser.

### 4. Demo Login Credentials
For immediate testing, click the **"Instant Test: Sign In as Demo Researcher"** button on the login screen or enter:
- **Email**: `demo@researchassist.ai`
- **Password**: `password123`

---

## 🧪 Automated Testing
Run the automated test suite verifying health check, JWT auth, paper listing, grounded RAG chat, and academic discovery:
```bash
.\venv\Scripts\python.exe -m pytest backend/tests/test_api.py -v
```

---

## 📁 Project Architecture

```text
research-paper-assist/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Modular API routers (auth, papers, chat, search, etc.)
│   │   ├── core/            # Configuration, JWT security, and dual database engine
│   │   ├── schemas/         # Pydantic request/response data models
│   │   ├── services/
│   │   │   ├── pdf/         # PyMuPDF section extraction & chunking
│   │   │   ├── embeddings/  # Semantic vector embeddings
│   │   │   ├── retrieval/   # ChromaDB & isolated vector index
│   │   │   ├── llm/         # Grounded RAG synthesis with page citations
│   │   │   ├── research/    # OpenAlex/arXiv/Crossref search, comparison, and gap detection
│   │   │   └── export/      # PDF, DOCX, and TXT compilation
│   │   ├── workers/         # 8-stage asynchronous paper ingestion pipeline
│   │   └── main.py          # FastAPI application entrypoint
│   ├── tests/               # Pytest automated API suite
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # SpotlightCard, BlurText, CountUp, ShinyBadge, Modal
│   │   │   ├── layout/      # Sidebar, Header, AppShell
│   │   │   └── papers/      # UploadModal with 8-stage live progress
│   │   ├── pages/           # Landing, Login, Dashboard, Library, Details, Chat, Search, etc.
│   │   ├── context/         # AuthContext
│   │   ├── services/        # Axios API client
│   │   └── App.jsx          # Route definitions
│   └── package.json
└── README.md
```
