import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  Sparkles, 
  MessageSquareText, 
  FileText, 
  Highlighter, 
  FileDown, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Loader2,
  Calendar,
  Users
} from 'lucide-react';
import { papersAPI, notesAPI, exportsAPI } from '../services/api';
import ShinyBadge from '../components/ui/ShinyBadge';

export const PaperDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [paper, setPaper] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [fulltext, setFulltext] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchPaperDetails = async () => {
      setLoading(true);
      try {
        const [paperRes, analysisRes, fulltextRes, notesRes] = await Promise.all([
          papersAPI.get(id),
          papersAPI.getAnalysis(id),
          papersAPI.getFullText(id),
          notesAPI.list({ paper_id: id }),
        ]);
        setPaper(paperRes.data);
        setAnalysis(analysisRes.data);
        setFulltext(fulltextRes.data);
        setNotes(notesRes.data);
      } catch (err) {
        console.error('Failed to load paper details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPaperDetails();
  }, [id]);

  const handleRegenerateAnalysis = async () => {
    setRegenerating(true);
    try {
      const res = await papersAPI.regenerateAnalysis(id);
      setAnalysis(res.data);
    } catch (err) {
      console.error('Regenerate analysis failed:', err);
    } finally {
      setRegenerating(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    try {
      const res = await notesAPI.create({
        paper_id: id,
        title: newNoteTitle.trim() || 'Paper Observation',
        content: newNoteContent.trim(),
        tags: ['Review', 'Analysis']
      });
      setNotes([res.data, ...notes]);
      setNewNoteTitle('');
      setNewNoteContent('');
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const handleExportPaper = async (format) => {
    setExporting(true);
    try {
      const res = await exportsAPI.create({
        export_type: 'paper_analysis',
        format: format,
        entity_id: id,
        custom_title: `Analysis - ${paper.title}`
      });
      // Trigger download
      window.open(res.data.download_url, '_blank');
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Loading research document details...</p>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="py-16 text-center bg-white rounded-xl border border-slate-200">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-900">Paper not found</p>
        <button
          onClick={() => navigate('/library')}
          className="mt-4 px-4 py-2 text-xs font-medium text-blue-600 hover:underline"
        >
          Return to Library
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back to Library Navigation */}
      <button
        onClick={() => navigate('/library')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Paper Library</span>
      </button>

      {/* Header Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                {paper.journal || 'Academic Paper'}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>{paper.year || 2024}</span>
              </span>
              {paper.doi && (
                <a
                  href={paper.doi.startsWith('http') ? paper.doi : `https://doi.org/${paper.doi}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <span>DOI</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
              {paper.title}
            </h1>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{paper.authors ? paper.authors.join(', ') : 'Authors'}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => navigate(`/chat?paperId=${paper._id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              <MessageSquareText className="w-3.5 h-3.5" />
              <span>Ask Paper AI</span>
            </button>
            <button
              onClick={() => handleExportPaper('pdf')}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-500" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 overflow-x-auto text-xs font-medium">
          {[
            { id: 'overview', label: 'Structured Overview', icon: BookOpen },
            { id: 'fulltext', label: 'Full Text & Pages', icon: FileText },
            { id: 'notes', label: `Notes (${notes.length})`, icon: Highlighter },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Structured Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Abstract */}
            <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-2">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide text-xs text-slate-400">
                Abstract
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {analysis?.abstract || paper.abstract}
              </p>
            </div>

            {/* Research Problem & Objectives */}
            <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span>Research Problem & Objectives</span>
                  <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium">AI Synthesized</span>
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {analysis?.research_problem}
              </p>
              {analysis?.objectives && analysis.objectives.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-semibold text-slate-600">Primary Objectives:</span>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 pl-1">
                    {analysis.objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Methodology */}
            <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Methodology & Architecture</h3>
                <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium">Grounded</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {analysis?.methodology}
              </p>
            </div>

            {/* Key Contributions & Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide text-slate-400">
                  Key Contributions
                </h4>
                <ul className="space-y-2 text-xs text-slate-700">
                  {analysis?.key_contributions?.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide text-slate-400">
                  Experimental Results
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {analysis?.results}
                </p>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Limitations, Future Work & Re-analysis */}
          <div className="space-y-6">
            <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide text-slate-400">
                Identified Limitations
              </h3>
              <ul className="space-y-2 text-xs text-slate-700">
                {analysis?.limitations?.map((l, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide text-slate-400">
                Future Research Directions
              </h3>
              <ul className="space-y-2 text-xs text-slate-700">
                {analysis?.future_work?.map((fw, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>{fw}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Re-analyze Card */}
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-center">
              <p className="text-xs text-slate-600">Want to refresh or expand the structural analysis?</p>
              <button
                onClick={handleRegenerateAnalysis}
                disabled={regenerating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                <span>{regenerating ? 'Analyzing...' : 'Regenerate Analysis'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Full Text & Pages */}
      {activeTab === 'fulltext' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Document Text Pages</h3>
              <p className="text-xs text-slate-500">Extracted and indexed across {fulltext?.page_count || 1} pages</p>
            </div>
          </div>

          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {fulltext?.pages?.map((p) => (
              <div key={p.page_number} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    Page {p.page_number}
                  </span>
                  <span className="text-[11px] text-slate-400">{p.char_count} characters</span>
                </div>
                <p className="text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
                  {p.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Notes & Observations */}
      {activeTab === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Saved Notes for this Paper</h3>
            {notes.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
                No notes created for this paper yet. Use the form on the right to add observations.
              </div>
            ) : (
              notes.map((n) => (
                <div key={n._id || n.id} className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-900">{n.title}</h4>
                    <span className="text-[10px] text-slate-400">
                      {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Today'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{n.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Add Note Form */}
          <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-3 h-fit">
            <h4 className="text-xs font-semibold text-slate-900">Add Paper Note</h4>
            <form onSubmit={handleAddNote} className="space-y-3">
              <input
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="Note title (e.g. Methodology Observation)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
              />
              <textarea
                rows={4}
                required
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Write your research observation, critique, or hypothesis..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 resize-none"
              />
              <button
                type="submit"
                className="w-full py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                Save Note
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaperDetailsPage;
