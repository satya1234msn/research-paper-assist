import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ExternalLink, 
  Download, 
  Check, 
  Loader2, 
  BookOpen, 
  Calendar, 
  Filter,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { searchAPI, papersAPI } from '../services/api';
import SpotlightCard from '../components/ui/SpotlightCard';

export const SearchPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('Machine learning transformer architectures');
  const [source, setSource] = useState('all');
  const [yearStart, setYearStart] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [savedTitles, setSavedTitles] = useState([]);

  const sources = [
    { id: 'all', label: 'All Sources' },
    { id: 'openalex', label: 'OpenAlex' },
    { id: 'arxiv', label: 'arXiv' },
    { id: 'crossref', label: 'Crossref' },
  ];

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await searchAPI.search({
        q: query.trim(),
        source: source,
        year_start: yearStart ? parseInt(yearStart) : undefined,
        limit: 12,
      });
      setResults(res.data);
    } catch (err) {
      console.error('Academic search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportToLibrary = async (paper) => {
    setSavingId(paper.title);
    try {
      await papersAPI.importAcademic({
        title: paper.title,
        authors: paper.authors,
        year: paper.year,
        abstract: paper.abstract,
        journal: paper.journal,
        doi: paper.doi,
        url: paper.url,
        pdf_url: paper.pdf_url,
        source: paper.source,
      });
      setSavedTitles([...savedTitles, paper.title]);
    } catch (err) {
      console.error('Import to library failed:', err);
      alert('Failed to import paper into library.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Academic Literature Search</h1>
        <p className="mt-1 text-xs text-slate-500">
          Discover peer-reviewed papers and preprints directly across OpenAlex, Crossref, and arXiv.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you researching? (e.g. AI based crop disease detection or sparse attention)"
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Search Literature</span>
          </button>
        </form>

        {/* Source Pills & Year Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {sources.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSource(s.id)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  source === s.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Published After:</span>
            <select
              value={yearStart}
              onChange={(e) => setYearStart(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white"
            >
              <option value="">Any Year</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2020">2020+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results List */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Querying OpenAlex, Crossref, and arXiv indexes...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200 p-8">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800">No literature results to display</p>
          <p className="text-xs text-slate-500 mt-1">Enter a research query above to search academic papers.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Found {results.length} relevant academic works</span>
            <span>Sorted by relevance score</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((paper, idx) => {
              const isSaved = savedTitles.includes(paper.title);
              const isSaving = savingId === paper.title;

              return (
                <SpotlightCard key={idx} className="p-5 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                        {paper.source}
                      </span>
                      <span className="text-xs text-slate-400">{paper.year || 2024}</span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                      {paper.title}
                    </h3>

                    <p className="text-xs text-slate-500 truncate">
                      {paper.authors ? paper.authors.join(', ') : 'Authors'}
                    </p>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {paper.abstract}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {paper.url && (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600"
                        >
                          <span>Publisher</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {paper.pdf_url && (
                        <a
                          href={paper.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600"
                        >
                          <span>PDF</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => handleImportToLibrary(paper)}
                      disabled={isSaved || isSaving}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        isSaved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100/80 border border-blue-200'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Saved to Library</span>
                        </>
                      ) : isSaving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Save to Library</span>
                        </>
                      )}
                    </button>
                  </div>
                </SpotlightCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
