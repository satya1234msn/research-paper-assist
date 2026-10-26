import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  ArrowRight, 
  Search, 
  FileText, 
  Sparkles, 
  Columns2, 
  Map, 
  Highlighter, 
  FileDown, 
  CheckCircle,
  Quote,
  ShieldCheck,
  Zap,
  Globe2
} from 'lucide-react';
import SpotlightCard from '../components/ui/SpotlightCard';
import BlurText from '../components/ui/BlurText';
import ShinyBadge from '../components/ui/ShinyBadge';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex items-center">
              <span className="font-semibold text-lg text-slate-900 tracking-tight">ResearchAssist</span>
              <span className="text-xs font-semibold text-blue-600 ml-1.5 px-1.5 py-0.5 rounded bg-blue-50">AI</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#workflow" className="hover:text-blue-600 transition-colors">How It Works</a>
            <a href="#discovery" className="hover:text-blue-600 transition-colors">Discovery</a>
            <a href="#about" className="hover:text-blue-600 transition-colors">About</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden bg-grid-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center mb-6">
            <ShinyBadge variant="primary" className="py-1 px-3 text-xs">
              Evidence-Grounded Research Workspace
            </ShinyBadge>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
            <BlurText text="Research Smarter. Discover Deeper." delay={45} />
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            An AI-powered research workspace that helps you analyze papers, discover relevant literature, identify research gaps, and build evidence-backed research roadmaps.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all hover:shadow-md"
            >
              <span>Start Researching</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors"
            >
              Explore Features
            </a>
          </div>

          {/* Clean Research Workspace Preview (Bento Bento Visual) */}
          <div className="mt-16 relative max-w-5xl mx-auto rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xl">
            <div className="rounded-xl bg-slate-50/70 border border-slate-100 p-4 sm:p-6 text-left">
              {/* Workspace Mockup Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 text-xs font-medium text-slate-500">ResearchAssist Workspace &bull; Project: Neural Adaptation</span>
                </div>
                <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  Grounded RAG Active
                </span>
              </div>

              {/* Grid of Preview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Paper Preview */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">PDF EXTRACTED</span>
                    <span className="text-[11px] text-slate-400">14 Pages</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                    LoRA: Low-Rank Adaptation of Large Language Models
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-3">
                    Freezes pretrained model weights and injects trainable rank decomposition matrices into each transformer layer.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>ICLR 2024</span>
                    <span className="text-emerald-600 font-medium">Indexed</span>
                  </div>
                </div>

                {/* AI Chat Interaction Preview */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Evidence-Backed Q&A</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700">
                    "What are the parameter scaling benefits of LoRA?"
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100 text-xs text-slate-800 space-y-1.5">
                    <p>
                      LoRA reduces trainable parameters by up to 10,000x and GPU memory footprint by 3x while preserving full downstream accuracy.
                    </p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="citation-badge">Page 4 &bull; Excerpt</span>
                      <span className="citation-badge">Table 2</span>
                    </div>
                  </div>
                </div>

                {/* Research Roadmap Preview */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                      <Map className="w-3.5 h-3.5 text-teal-600" />
                      <span>Research Roadmap</span>
                    </span>
                    <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-medium">12 Mo Timeline</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800">1. Survey & Gap Analysis</span>
                      <span className="text-slate-400 text-[10px]">Mo 1-3</span>
                    </div>
                    <div className="p-2 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800">2. Architecture Prototype</span>
                      <span className="text-slate-400 text-[10px]">Mo 4-6</span>
                    </div>
                    <div className="p-2 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800">3. Empirical Benchmarking</span>
                      <span className="text-slate-400 text-[10px]">Mo 7-9</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-semibold tracking-wider text-blue-600 uppercase">System Capabilities</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Engineered for Academic Rigor and Research Depth
            </p>
            <p className="mt-4 text-base text-slate-600">
              Unlike generic chatbot tools, ResearchAssist AI is strictly evidence-oriented, verifiable, and designed for researchers, faculty, and graduate students.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <SpotlightCard className="p-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">PDF Analysis</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload research papers to automatically extract sections, mathematical formulas, methodologies, contributions, and limitations.
              </p>
            </SpotlightCard>

            {/* Feature 2 */}
            <SpotlightCard className="p-6">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">AI Research Chat</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ask targeted research questions and receive grounded responses with exact page numbers and clickable source excerpts.
              </p>
            </SpotlightCard>

            {/* Feature 3 */}
            <SpotlightCard className="p-6">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Academic Discovery</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Directly search millions of papers across OpenAlex, Crossref, and arXiv with 1-click import into your workspace.
              </p>
            </SpotlightCard>

            {/* Feature 4 */}
            <SpotlightCard className="p-6">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Columns2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Paper Comparison</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Select 2–4 papers to generate side-by-side matrices comparing problems, datasets, metrics, contradictions, and opportunities.
              </p>
            </SpotlightCard>

            {/* Feature 5 */}
            <SpotlightCard className="p-6">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Research Gap Detection</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Discover unaddressed frontiers across literature, with clear distinctions between literature facts and AI interpretation.
              </p>
            </SpotlightCard>

            {/* Feature 6 */}
            <SpotlightCard className="p-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Map className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Research Roadmaps</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Transform an exploratory research idea into an actionable, phased timeline with objectives, deliverables, and milestones.
              </p>
            </SpotlightCard>

            {/* Feature 7 */}
            <SpotlightCard className="p-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Highlighter className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Notes & Highlights</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Save page-linked observations, hypotheses, and tags attached directly to specific papers and projects.
              </p>
            </SpotlightCard>

            {/* Feature 8 */}
            <SpotlightCard className="p-6">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
                <FileDown className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Export Center</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Export complete summaries, comparative matrices, roadmaps, and citations to beautifully formatted PDF, DOCX, and TXT files.
              </p>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold tracking-wider text-blue-600 uppercase">Seamless Workflow</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">From Idea to Publication</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-semibold flex items-center justify-center mx-auto text-sm border border-blue-200">
                1
              </div>
              <h4 className="text-sm font-semibold text-slate-900">Ingest & Discover</h4>
              <p className="text-xs text-slate-500">Upload PDFs or import published works directly from arXiv, OpenAlex, and Crossref.</p>
            </div>
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-semibold flex items-center justify-center mx-auto text-sm border border-blue-200">
                2
              </div>
              <h4 className="text-sm font-semibold text-slate-900">Semantic Indexing</h4>
              <p className="text-xs text-slate-500">Automatic section extraction, chunking, and isolated vector store embedding.</p>
            </div>
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-semibold flex items-center justify-center mx-auto text-sm border border-blue-200">
                3
              </div>
              <h4 className="text-sm font-semibold text-slate-900">Grounded Synthesis</h4>
              <p className="text-xs text-slate-500">Chat with papers, contrast methodologies, and extract substantiated research gaps.</p>
            </div>
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-semibold flex items-center justify-center mx-auto text-sm border border-blue-200">
                4
              </div>
              <h4 className="text-sm font-semibold text-slate-900">Roadmap & Export</h4>
              <p className="text-xs text-slate-500">Generate structured research proposals and export publications in PDF or DOCX.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Accelerate Your Academic Research Today</h2>
          <p className="text-blue-100 text-base max-w-xl mx-auto">
            Join researchers and students utilizing evidence-grounded AI to review literature and discover novel research opportunities.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-blue-700 bg-white hover:bg-blue-50 rounded-xl shadow-md transition-all"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-slate-100 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-900">ResearchAssist AI</span>
            <span>&bull; Intelligent Research Paper Analysis System</span>
          </div>
          <div>
            Built for rigorous academic exploration and literature discovery.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
