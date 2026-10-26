import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Lightbulb
} from 'lucide-react';
import { researchGapsAPI, exportsAPI } from '../services/api';
import SpotlightCard from '../components/ui/SpotlightCard';

export const ResearchGapsPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchGaps = async () => {
      setLoading(true);
      try {
        const res = await researchGapsAPI.detect();
        setData(res.data);
      } catch (err) {
        console.error('Failed to detect research gaps:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGaps();
  }, []);

  const handleExportGaps = async (format) => {
    setExporting(true);
    try {
      const res = await exportsAPI.create({
        export_type: 'research_gaps',
        format: format,
        custom_title: 'Literature Research Gap Analysis'
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Research Gap Detection</h1>
          <p className="mt-1 text-xs text-slate-500">
            Discovered frontiers and unaddressed boundaries based on your currently analyzed literature.
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
          <p className="text-xs text-slate-500">Analyzing corpus boundaries and detecting potential gaps...</p>
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

              {/* Literature Evidence vs AI Interpretation Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Evidence From Literature */}
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Evidence From Literature</span>
                  </div>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    "{gap.evidence_from_literature}"
                  </p>
                  {gap.supporting_papers && (
                    <div className="pt-1 text-[11px] text-blue-600 font-medium truncate">
                      Refs: {gap.supporting_papers.join(', ')}
                    </div>
                  )}
                </div>

                {/* AI Scholarly Interpretation */}
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-900">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>AI Interpretation (Subject to Validation)</span>
                  </div>
                  <p className="text-xs text-purple-800 leading-relaxed">
                    {gap.ai_interpretation}
                  </p>
                </div>
              </div>

              {/* Why it Matters & Proposed Direction */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Why This Matters:</span>
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {gap.why_it_matters}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Potential Research Direction:</span>
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {gap.potential_research_direction}
                  </p>
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResearchGapsPage;
