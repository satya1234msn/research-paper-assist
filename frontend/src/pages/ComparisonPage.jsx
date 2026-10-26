import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Columns2, 
  Sparkles, 
  FileDown, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Plus, 
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import { papersAPI, comparisonAPI, exportsAPI } from '../services/api';
import SpotlightCard from '../components/ui/SpotlightCard';

export const ComparisonPage = () => {
  const [searchParams] = useSearchParams();
  const initialIds = searchParams.get('ids') ? searchParams.get('ids').split(',') : [];

  const [papers, setPapers] = useState([]);
  const [selectedIds, setSelectedIds] = useState(initialIds);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const loadLibraryPapers = async () => {
      try {
        const res = await papersAPI.list();
        setPapers(res.data);

        // If no URL IDs provided, preselect the first two papers if available
        if (selectedIds.length < 2 && res.data.length >= 2) {
          const defaultPair = [res.data[0]._id, res.data[1]._id];
          setSelectedIds(defaultPair);
          runComparison(defaultPair);
        } else if (selectedIds.length >= 2) {
          runComparison(selectedIds);
        }
      } catch (err) {
        console.error('Failed to load papers for comparison:', err);
      }
    };
    loadLibraryPapers();
  }, []);

  const runComparison = async (idsToCompare) => {
    if (idsToCompare.length < 2) return;
    setLoading(true);
    try {
      const res = await comparisonAPI.compare(idsToCompare);
      setComparison(res.data);
    } catch (err) {
      console.error('Comparison execution failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (paperId) => {
    let next;
    if (selectedIds.includes(paperId)) {
      next = selectedIds.filter(id => id !== paperId);
    } else {
      if (selectedIds.length >= 4) {
        alert('You can select a maximum of 4 papers to compare.');
        return;
      }
      next = [...selectedIds, paperId];
    }
    setSelectedIds(next);
    if (next.length >= 2) {
      runComparison(next);
    } else {
      setComparison(null);
    }
  };

  const handleExportComparison = async (format) => {
    if (!comparison || selectedIds.length < 2) return;
    setExporting(true);
    try {
      const res = await exportsAPI.create({
        export_type: 'comparison',
        format: format,
        entity_ids: selectedIds,
        custom_title: 'Comparative Literature Analysis'
      });
      window.open(res.data.download_url, '_blank');
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Paper Comparison Workspace</h1>
          <p className="mt-1 text-xs text-slate-500">
            Contrast methodologies, datasets, findings, and uncover contradictions across 2 to 4 papers.
          </p>
        </div>

        {comparison && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportComparison('pdf')}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export Comparison (PDF)</span>
            </button>
            <button
              onClick={() => handleExportComparison('docx')}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
            >
              <span>DOCX</span>
            </button>
          </div>
        )}
      </div>

      {/* Paper Selection Pills */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">Select Papers to Compare (Select 2 to 4):</span>
          <span className="text-slate-400">{selectedIds.length} of 4 selected</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {papers.map((p) => {
            const isSelected = selectedIds.includes(p._id);
            return (
              <button
                key={p._id}
                onClick={() => handleToggleSelect(p._id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  isSelected
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="truncate max-w-[200px]">{p.title}</span>
                {isSelected && <X className="w-3 h-3 text-blue-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      {selectedIds.length < 2 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Columns2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800">Select at least 2 papers</p>
          <p className="text-xs text-slate-500 mt-1">
            Choose two or more research documents from the list above to generate a comprehensive comparison matrix.
          </p>
        </div>
      ) : loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Generating multidimensional comparative synthesis...</p>
        </div>
      ) : comparison ? (
        <div className="space-y-8">
          {/* Side-by-Side Aspect Matrix Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Methodological Dimension Matrix
              </h3>
              <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium">
                Grounded Citations Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="py-3 px-4 font-semibold text-slate-500 w-36 uppercase tracking-wider text-[10px]">
                      Dimension
                    </th>
                    {comparison.papers.map((cp, idx) => (
                      <th key={idx} className="py-3 px-4 font-semibold text-slate-900 min-w-[240px]">
                        {cp.paper_title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-500 bg-slate-50/30">Research Problem</td>
                    {comparison.papers.map((cp, idx) => (
                      <td key={idx} className="py-3 px-4 text-slate-700 leading-relaxed">{cp.problem}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-500 bg-slate-50/30">Methodology</td>
                    {comparison.papers.map((cp, idx) => (
                      <td key={idx} className="py-3 px-4 text-slate-700 leading-relaxed">{cp.methodology}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-500 bg-slate-50/30">Evaluation Dataset</td>
                    {comparison.papers.map((cp, idx) => (
                      <td key={idx} className="py-3 px-4 text-slate-700 leading-relaxed">{cp.dataset}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-500 bg-slate-50/30">Primary Metrics</td>
                    {comparison.papers.map((cp, idx) => (
                      <td key={idx} className="py-3 px-4 text-slate-700 font-mono text-[11px]">{cp.metrics}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-500 bg-slate-50/30">Reported Results</td>
                    {comparison.papers.map((cp, idx) => (
                      <td key={idx} className="py-3 px-4 text-slate-700 leading-relaxed">{cp.results}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-500 bg-slate-50/30">Contributions</td>
                    {comparison.papers.map((cp, idx) => (
                      <td key={idx} className="py-3 px-4 text-slate-700 leading-relaxed">{cp.contributions}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-500 bg-slate-50/30">Known Limitations</td>
                    {comparison.papers.map((cp, idx) => (
                      <td key={idx} className="py-3 px-4 text-slate-700 leading-relaxed">{cp.limitations}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Synthesis Cards: Similarities, Differences, Contradictions, Opportunities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Similarities */}
            <SpotlightCard className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">Key Similarities</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
                {comparison.similarities?.map((sim, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                    <span>{sim}</span>
                  </li>
                ))}
              </ul>
            </SpotlightCard>

            {/* Methodological Differences */}
            <SpotlightCard className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-600" />
                <h3 className="text-sm font-semibold text-slate-900">Methodological Differences</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
                {comparison.differences?.map((diff, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                    <span>{diff}</span>
                  </li>
                ))}
              </ul>
            </SpotlightCard>

            {/* Contradictions */}
            <SpotlightCard className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <h3 className="text-sm font-semibold text-slate-900">Empirical Contradictions</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
                {comparison.contradictions?.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </SpotlightCard>

            {/* Research Opportunities */}
            <SpotlightCard className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                <h3 className="text-sm font-semibold text-slate-900">Research Opportunities</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
                {comparison.research_opportunities?.map((opp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 mt-0.5 shrink-0" />
                    <span>{opp}</span>
                  </li>
                ))}
              </ul>
            </SpotlightCard>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ComparisonPage;
