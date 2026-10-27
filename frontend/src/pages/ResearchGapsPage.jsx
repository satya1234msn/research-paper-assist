import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Sparkles, 
  Map, 
  FileDown, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Lightbulb,
  BookOpen,
  Filter,
  Layers,
  ChevronDown,
  X
} from 'lucide-react';
import { researchGapsAPI, papersAPI, exportsAPI } from '../services/api';
import SpotlightCard from '../components/ui/SpotlightCard';

export const ResearchGapsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPaperId = searchParams.get('paper_id') || '';

  const [papers, setPapers] = useState([]);
  const [selectedPaperId, setSelectedPaperId] = useState(initialPaperId);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPapers, setLoadingPapers] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Load available library papers
  useEffect(() => {
    const fetchLibraryPapers = async () => {
      try {
        const res = await papersAPI.list();
        setPapers(res.data);
      } catch (err) {
        console.error('Failed to load papers:', err);
      } finally {
        setLoadingPapers(false);
      }
    };
    fetchLibraryPapers();
  }, []);

  // Fetch gaps whenever selectedPaperId changes
  useEffect(() => {
    fetchGaps(selectedPaperId);
  }, [selectedPaperId]);

  const fetchGaps = async (paperId = '') => {
    setLoading(true);
    try {
      const params = paperId ? { paper_id: paperId } : {};
      const res = await researchGapsAPI.detect(params);
      setData(res.data);
    } catch (err) {
      console.error('Failed to detect research gaps:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPaper = (paperId) => {
    setSelectedPaperId(paperId);
    if (paperId) {
      setSearchParams({ paper_id: paperId });
    } else {
      setSearchParams({});
    }
  };

  const handleExportGaps = async (format) => {
    setExporting(true);
    try {
      const res = await exportsAPI.create({
        export_type: 'research_gaps',
        format: format,
        custom_title: selectedPaperId
          ? `Research Gaps - ${papers.find(p => p._id === selectedPaperId)?.title || 'Selected Paper'}`
          : 'Literature Research Gap Analysis'
      });
      window.open(res.data.download_url, '_blank');
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const getConfidenceBadge = (confidence) => {
    if (confidence === 'High') {
      return <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">High Confidence</span>;
    }
    if (confidence === 'Moderate') {
      return <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">Moderate Confidence</span>;
    }
    return <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">Exploratory</span>;
  };

  const selectedPaperObj = papers.find(p => p._id === selectedPaperId);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Research Gap Detection</h1>
          <p className="mt-1 text-xs text-slate-500">
            Uncover empirical frontiers, unresolved questions, and literature boundaries from your research papers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportGaps('pdf')}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export Gaps (PDF)</span>
          </button>
        </div>
      </div>

      {/* Interactive Paper Selector Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-800">
              Analysis Scope:
            </span>
          </div>

          {/* Scope Dropdown */}
          <div className="flex-1 max-w-md">
            <select
              value={selectedPaperId}
              onChange={(e) => handleSelectPaper(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
            >
              <option value="">All Library Papers (Cross-Literature Discovery)</option>
              {papers.map((p) => {
                const isUploaded = !p._id.startsWith('paper-sample-');
                return (
                  <option key={p._id} value={p._id}>
                    {isUploaded ? '📄 [Uploaded] ' : '📚 '} {p.title} ({p.year || '2025'})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Quick Selection Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 font-medium">Quick Select:</span>
          <button
            onClick={() => handleSelectPaper('')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              !selectedPaperId
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Papers
          </button>

          {papers.slice(0, 5).map((p) => {
            const isSelected = selectedPaperId === p._id;
            return (
              <button
                key={p._id}
                onClick={() => handleSelectPaper(p._id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  isSelected
                    ? 'bg-blue-50 border-blue-300 text-blue-700 ring-1 ring-blue-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate max-w-[160px]">{p.title}</span>
                {isSelected && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPaper('');
                    }}
                    className="hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Focus Banner */}
      {selectedPaperObj && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-blue-950">Grounded Gap Analysis for: </span>
              <span className="font-medium text-blue-800">{selectedPaperObj.title}</span>
              <span className="text-blue-500 text-[11px] ml-2">({selectedPaperObj.journal || 'Academic Paper'})</span>
            </div>
          </div>
          <button
            onClick={() => handleSelectPaper('')}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline shrink-0 ml-4"
          >
            Switch to All Papers
          </button>
        </div>
      )}

      {/* Mandatory Academic Disclaimer Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-800">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-amber-900">Academic Review Guidance</p>
          <p className="leading-relaxed">
            Potential research gaps are synthesized strictly from the papers currently indexed in your library. Literature evidence is separated from AI interpretation to support human scholarly validation.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">
            {selectedPaperId 
              ? 'Analyzing selected paper limitations and future work...' 
              : 'Analyzing corpus boundaries and detecting cross-literature gaps...'}
          </p>
        </div>
      ) : !data || data.gaps.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800">No research gaps detected yet</p>
          <p className="text-xs text-slate-500 mt-1">Upload additional papers to enable cross-literature gap discovery.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.gaps.map((gap, idx) => (
            <SpotlightCard key={idx} className="p-6 space-y-5">
              {/* Gap Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Gap #{idx + 1}
                    </span>
                    {getConfidenceBadge(gap.confidence_strength)}
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {gap.gap_title}
                  </h3>
                </div>

                <button
                  onClick={() => navigate(`/roadmap?idea=${encodeURIComponent(gap.potential_research_direction)}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100/80 rounded-lg transition-colors shrink-0"
                >
                  <Map className="w-3.5 h-3.5 text-blue-600" />
                  <span>Build Roadmap from Gap</span>
                </button>
              </div>

              {/* Explanation */}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {gap.explanation}
              </p>

              {/* Literature Evidence & AI Assessment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Evidence From Literature */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Evidence from Literature
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 italic leading-relaxed pl-2 border-l-2 border-slate-300">
                    "{gap.evidence_from_literature}"
                  </p>
                  {gap.supporting_papers && gap.supporting_papers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {gap.supporting_papers.map((sp, sIdx) => (
                        <span key={sIdx} className="text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                          {sp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Interpretation */}
                <div className="p-4 rounded-lg bg-blue-50/40 border border-blue-100 space-y-2">
                  <div className="flex items-center gap-1.5 text-blue-800">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
                      Scholarly Interpretation
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed pl-2 border-l-2 border-blue-300">
                    {gap.ai_interpretation}
                  </p>
                </div>
              </div>

              {/* Research Direction Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-700">Why It Matters: </span>
                  <span className="text-slate-600">{gap.why_it_matters}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50/80 border border-dashed border-slate-200 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="font-medium text-slate-800">
                    Direction: <span className="text-slate-600 font-normal">{gap.potential_research_direction}</span>
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/roadmap?idea=${encodeURIComponent(gap.potential_research_direction)}`)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0"
                >
                  <span>Explore</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </SpotlightCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResearchGapsPage;
