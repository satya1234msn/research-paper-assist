from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# Authentication & User
class UserRegister(BaseModel):
    email: str
    password: str
    name: str
    institution: Optional[str] = "Academic / Independent"
    research_interests: Optional[List[str]] = []

class UserLogin(BaseModel):
    email: str
    password: str

class ForgotPasswordReq(BaseModel):
    email: str

class ResetPasswordReq(BaseModel):
    token: str
    new_password: str

class UserOut(BaseModel):
    id: str = Field(alias="_id")
    email: str
    name: str
    institution: Optional[str] = None
    research_interests: Optional[List[str]] = []
    created_at: Optional[str] = None

    class Config:
        populate_by_name = True

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# Research Projects
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    domain: Optional[str] = "General"

class ProjectOut(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    name: str
    description: Optional[str] = ""
    domain: Optional[str] = "General"
    papers_count: Optional[int] = 0
    created_at: Optional[str] = None

    class Config:
        populate_by_name = True

# Papers
class PaperOut(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    project_id: Optional[str] = None
    title: str
    authors: List[str] = []
    year: Optional[int] = None
    doi: Optional[str] = None
    abstract: Optional[str] = None
    journal: Optional[str] = None
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = 0
    page_count: Optional[int] = 0
    processing_status: str = "pending" # pending, extracting, chunking, indexing, complete, failed
    is_favorite: bool = False
    keywords: List[str] = []
    created_at: Optional[str] = None

    class Config:
        populate_by_name = True

# Paper Structured Analysis
class PaperAnalysisOut(BaseModel):
    id: str = Field(alias="_id")
    paper_id: str
    user_id: str
    abstract: Optional[str] = ""
    research_problem: Optional[str] = ""
    objectives: List[str] = []
    methodology: Optional[str] = ""
    key_contributions: List[str] = []
    results: Optional[str] = ""
    limitations: List[str] = []
    future_work: List[str] = []
    created_at: Optional[str] = None

    class Config:
        populate_by_name = True

# Chat & Citations
class CitationItem(BaseModel):
    paper_id: str
    paper_title: str
    page_number: Optional[int] = None
    excerpt: str

class ChatMessage(BaseModel):
    role: str # user, assistant, system
    content: str
    citations: Optional[List[CitationItem]] = []
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    paper_id: Optional[str] = None
    message: str
    selected_paper_ids: Optional[List[str]] = []

class ConversationOut(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    title: str
    paper_id: Optional[str] = None
    messages: List[ChatMessage] = []
    created_at: Optional[str] = None

    class Config:
        populate_by_name = True

# Academic Search
class SearchQuery(BaseModel):
    query: str
    source: Optional[str] = "all" # all, openalex, crossref, arxiv
    year_start: Optional[int] = None
    year_end: Optional[int] = None
    limit: Optional[int] = 10

class AcademicPaperItem(BaseModel):
    title: str
    authors: List[str] = []
    year: Optional[int] = None
    abstract: Optional[str] = None
    journal: Optional[str] = None
    doi: Optional[str] = None
    url: Optional[str] = None
    pdf_url: Optional[str] = None
    source: str # OpenAlex, Crossref, arXiv
    relevance_score: Optional[float] = 1.0

# Paper Comparison
class ComparisonRequest(BaseModel):
    paper_ids: List[str] # 2 to 4 papers

class PaperComparisonAspect(BaseModel):
    paper_id: str
    paper_title: str
    problem: str
    methodology: str
    dataset: str
    metrics: str
    results: str
    contributions: str
    limitations: str

class ComparisonResult(BaseModel):
    papers: List[PaperComparisonAspect]
    similarities: List[str]
    differences: List[str]
    contradictions: List[str]
    research_opportunities: List[str]

# Research Gaps
class ResearchGapItem(BaseModel):
    gap_title: str
    explanation: str
    supporting_papers: List[str]
    evidence_from_literature: str
    ai_interpretation: str
    confidence_strength: str # High, Moderate, Exploratory
    why_it_matters: str
    potential_research_direction: str

class ResearchGapsResult(BaseModel):
    gaps: List[ResearchGapItem]
    analyzed_paper_count: int
    disclaimer: str = "Potential research gap based on currently analyzed literature. Requires human validation."

# Research Roadmap
class RoadmapRequest(BaseModel):
    research_idea: str
    problem_statement: Optional[str] = ""
    domain: Optional[str] = "Artificial Intelligence"
    constraints: Optional[str] = ""
    duration_months: Optional[int] = 12

class RoadmapPhase(BaseModel):
    phase_number: int
    title: str
    duration: str
    objectives: List[str]
    deliverables: List[str]
    milestones: List[str]

class RoadmapResult(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    research_title: str
    problem_statement: str
    motivation: str
    research_objectives: List[str]
    research_questions: List[str]
    literature_review_summary: str
    identified_research_gap: str
    proposed_methodology: str
    datasets_to_explore: List[str]
    evaluation_metrics: List[str]
    expected_outcomes: List[str]
    risks_and_limitations: List[str]
    timeline_phases: List[RoadmapPhase]
    key_references: List[str]
    created_at: Optional[str] = None

    class Config:
        populate_by_name = True

# Notes & Highlights
class NoteCreate(BaseModel):
    paper_id: Optional[str] = None
    project_id: Optional[str] = None
    page_number: Optional[int] = None
    title: str
    content: str
    tags: Optional[List[str]] = []

class NoteOut(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    paper_id: Optional[str] = None
    paper_title: Optional[str] = None
    project_id: Optional[str] = None
    page_number: Optional[int] = None
    title: str
    content: str
    tags: List[str] = []
    created_at: Optional[str] = None

    class Config:
        populate_by_name = True

# Export
class ExportRequest(BaseModel):
    export_type: str # paper_summary, comparison, research_gaps, roadmap, notes
    format: str # pdf, docx, txt
    entity_id: Optional[str] = None
    entity_ids: Optional[List[str]] = []
    custom_title: Optional[str] = None

class ExportOut(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    export_type: str
    format: str
    file_name: str
    download_url: str
    status: str
    created_at: Optional[str] = None

    class Config:
        populate_by_name = True

# Background Jobs
class JobOut(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    paper_id: Optional[str] = None
    job_type: str
    status: str # pending, processing, complete, failed
    progress: int # 0 to 100
    current_step: str
    error: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        populate_by_name = True
