import React, { useState, useEffect, useMemo } from 'react';
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
  ArrowRight,
  Search,
  BookOpen,
  Filter,
  Check
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
  const [searchQuery, setSearchQuery] = useState('');
  const [paperFilter, setPaperFilter] = useState('all'); // all, uploaded, library

  useEffect(() => {
    loadLibraryPapers();
  }, []);

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
        alert('You can select a maximum of 4 papers to compare at once.');
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

  // Filter papers for selection
  const filteredPapers = useMemo(() => {
    return papers.filter((p) => {
      const matchesSearch = 
        !searchQuery.trim() ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.authors && p.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        (p.journal && p.journal.toLowerCase().includes(searchQuery.toLowerCase()));

      const isSample = p._id.startsWith('paper-sample-');
      if (paperFilter === 'uploaded' && isSample) return false;
      if (paperFilter === 'library' && !isSample) return false;

      return matchesSearch;
    });
  }, [papers, searchQuery, paperFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Paper Comparison Workspace</h1>
          <p className="mt-1 text-xs text-slate-500">
            Contrast methodologies, datasets, empirical metrics, and uncover contradictions across 2 to 4 papers.
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

      {/* Paper Selection & Search Container */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <span className="text-xs font-semibold text-slate-800">
              Selected for Comparison ({selectedIds.length} of max 4):
            </span>
            <p className="text-[11px] text-slate-500">
              Pick at least 2 papers below to generate side-by-side dimensions and synthesized contrasts.
            </p>
          </div>

          {/* Quick Search Box */}
          <div className="relative min-w-[240px] sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search uploaded or library papers..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Selected Paper Chips */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 pb-2 border-b border-slate-100">
            <span className="text-[11px] font-medium text-slate-400">Comparing:</span>
            {selectedIds.map((id) => {
              const p = papers.find(x => x._id === id);
              const title = p ? p.title : id;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 border border-blue-200 text-blue-700 shadow-2xs"
                >
                  <BookOpen className="w-3 h-3 text-blue-500 shrink-0" />
                  <span className="truncate max-w-[220px]">{title}</span>
                  <button
                    onClick={() => handleToggleSelect(id)}
                    className="hover:bg-blue-100 rounded p-0.5 text-blue-600"
                    title="Remove paper"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            {selectedIds.length >= 2 && (
              <button
                onClick={() => runComparison(selectedIds)}
                disabled={loading}
                className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>Re-compare</span>
              </button>
            )}
          </div>
        )}

        {/* Filter Badges & Paper Selectors */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPaperFilter('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                paperFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Papers ({papers.length})
            </button>
            <button
              onClick={() => setPaperFilter('uploaded')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                paperFilter === 'uploaded'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              My Uploads ({papers.filter(p => !p._id.startsWith('paper-sample-')).length})
            </button>
            <button
              onClick={() => setPaperFilter('library')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                paperFilter === 'library'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Foundation Benchmarks ({papers.filter(p => p._id.startsWith('paper-sample-')).length})
            </button>
          </div>

          <span className="text-[11px] text-slate-400">
            Showing {filteredPapers.length} papers
          </span>
        </div>

        {/* Papers List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-1 max-h-56 overflow-y-auto pr-1">
          {filteredPapers.length === 0 ? (
            <div className="col-span-full py-6 text-center text-xs text-slate-400">
              No papers found matching "{searchQuery}".
            </div>
          ) : (
            filteredPapers.map((p) => {
              const isSelected = selectedIds.includes(p._id);
              const isUploaded = !p._id.startsWith('paper-sample-');
              return (
                <div
                  key={p._id}
                  onClick={() => handleToggleSelect(p._id)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-300 text-slate-900'
                      : 'bg-slate-50/40 border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                    isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold truncate text-slate-900" title={p.title}>
                        {p.title}
                      </p>
                      {isUploaded && (
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-medium shrink-0">
                          Uploaded
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                      <span>{p.year || '2025'}</span>
                      <span>•</span>
                      <span className="truncate">{p.journal || 'Academic Paper'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Content Area */}
      {selectedIds.length < 2 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Columns2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800">Select at least 2 papers to compare</p>
          <p className="text-xs text-slate-500 mt-1">
            Choose two or more research documents from your library above to generate a comprehensive comparison matrix.
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
                Grounded Literature Evidence
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="py-3 px-4 font-semibold text-slate-500 w-40 uppercase tracking-wider text-[10px]">
                      Dimension
                    </th>
                    {comparison.papers.map((cp, idx) => (
                      <th key={idx} className="py-3 px-4 font-semibold text-slate-900 min-w-[260px]">
                        <span className="text-blue-600 font-bold mr-1">[{idx + 1}]</span> {cp.paper_title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/30">Research Problem</td>
                    {comparison.papers.map((cp, idx) => (
                      <td key={idx} className="py-3 px-4 text-slate-700 leading-relaxed">{cp.problem}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/30">Methodology</td>
                    {comparison.papers.map((cp, idx) => (
                      <td key={idx} className="py-3 px-4 text-slate-700 leading-relaxed">{cp.methodology}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/30">Evaluation Dataset</td>
                    {comparison.papers.map((cp, idx) => (
                      <td key={idx} className="py-3 px-4 text-slate-700 leading-relaxed font-mono text-[11px] bg-slate-50/20">{cp.dataset}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/30">Primary Metrics</td>
                    {comparison.papers.map((cp, idx) => (
                      <td key={idx} className="py-3 px-4 text-slate-700 leading-relaxed font-mono text-[11px] bg-slate-50/20">{cp.metrics}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/30">Key Results</td>
                    {comparison.papers.map((cp, idx) => (
                      <td key={idx} className="py-3 px-4 text-slate-700 leading-relaxed">{cp.results}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/30">Core Contributions</td>
                    {comparison.papers.map((cp, idx) => (
                      <td key={idx} className="py-3 px-4 text-slate-700 leading-relaxed">{cp.contributions}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/30">Limitations</td>
                    {comparison.papers.map((cp, idx) => (
                      <td key={idx} className="py-3 px-4 text-slate-600 leading-relaxed bg-amber-50/10">{cp.limitations}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Deep Synthesis Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Similarities */}
            <SpotlightCard className="p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                  Shared Methodological Traits
                </h4>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                {comparison.similarities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </SpotlightCard>

            {/* Differences */}
            <SpotlightCard className="p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Layers className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                  Key Divergences & Trade-offs
                </h4>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                {comparison.differences.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </SpotlightCard>

            {/* Contradictions */}
            <SpotlightCard className="p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                  Contradictory Conclusions & Tensions
                </h4>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                {comparison.contradictions.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </SpotlightCard>

            {/* Research Opportunities */}
            <SpotlightCard className="p-5 space-y-3 bg-gradient-to-br from-blue-50/40 via-white to-white">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-900">
                  Research Opportunities & Open Frontiers
                </h4>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
                {comparison.research_opportunities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{item}</span>
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
