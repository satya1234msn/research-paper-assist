import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Upload, 
  Star, 
  Trash2, 
  MessageSquareText, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  Columns2,
  ExternalLink,
  Filter
} from 'lucide-react';
import { papersAPI } from '../services/api';
import SpotlightCard from '../components/ui/SpotlightCard';
import UploadModal from '../components/papers/UploadModal';

export const PaperLibraryPage = () => {
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);

  const filters = [
    { id: 'all', label: 'All Papers' },
    { id: 'analyzed', label: 'Analyzed' },
    { id: 'processing', label: 'Processing' },
    { id: 'favorites', label: 'Favorites' },
  ];

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const res = await papersAPI.list({
        filter: activeFilter,
        search: searchQuery.trim() || undefined,
      });
      setPapers(res.data);
    } catch (err) {
      console.error('Failed to load papers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, [activeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPapers();
  };

  const handleToggleFavorite = async (e, paperId) => {
    e.stopPropagation();
    try {
      const res = await papersAPI.toggleFavorite(paperId);
      setPapers(papers.map((p) => (p._id === paperId ? { ...p, is_favorite: res.data.is_favorite } : p)));
    } catch (err) {
      console.error('Toggle favorite failed:', err);
    }
  };

  const handleDeletePaper = async (e, paperId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this paper and its vector index?')) return;
    try {
      await papersAPI.delete(paperId);
      setPapers(papers.filter((p) => p._id !== paperId));
      setSelectedForCompare(selectedForCompare.filter((id) => id !== paperId));
    } catch (err) {
      console.error('Failed to delete paper:', err);
    }
  };

  const toggleCompareSelection = (e, paperId) => {
    e.stopPropagation();
    if (selectedForCompare.includes(paperId)) {
      setSelectedForCompare(selectedForCompare.filter((id) => id !== paperId));
    } else {
      if (selectedForCompare.length >= 4) {
        alert('You can select a maximum of 4 papers for comparison.');
        return;
      }
      setSelectedForCompare([...selectedForCompare, paperId]);
    }
  };

  const handleStartComparison = () => {
    if (selectedForCompare.length < 2) return;
    navigate(`/comparison?ids=${selectedForCompare.join(',')}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Paper Library</h1>
          <p className="mt-1 text-xs text-slate-500">
            Manage, analyze, and query your research document collection.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {selectedForCompare.length >= 2 && (
            <button
              onClick={handleStartComparison}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>Compare ({selectedForCompare.length})</span>
            </button>
          )}

          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Paper</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors
                ${activeFilter === f.id 
                  ? 'bg-blue-50 text-blue-700 font-semibold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search papers..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        </form>
      </div>

      {/* Comparison selection helper notice */}
      {selectedForCompare.length > 0 && selectedForCompare.length < 2 && (
        <div className="p-2.5 bg-blue-50/70 border border-blue-200 text-xs text-blue-800 rounded-lg flex items-center justify-between">
          <span>Select 1 more paper to enable comparative analysis.</span>
          <button 
            onClick={() => setSelectedForCompare([])}
            className="text-xs text-blue-600 hover:underline"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Papers Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading your research library...</p>
        </div>
      ) : papers.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200 p-8">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No papers found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {searchQuery ? 'Try adjusting your search query or filters.' : 'Upload your first research paper or discover papers from arXiv/OpenAlex.'}
          </p>
          <button
            onClick={() => setUploadOpen(true)}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Upload Paper
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {papers.map((paper) => {
            const isSelected = selectedForCompare.includes(paper._id || paper.id);

            return (
              <SpotlightCard
                key={paper._id || paper.id}
                className={`flex flex-col justify-between p-5 cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-teal-500 border-teal-500' : ''
                }`}
              >
                <div onClick={() => navigate(`/library/${paper._id || paper.id}`)}>
                  {/* Top Row: Year, Status, Favorite */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {paper.journal || 'Research'}
                      </span>
                      <span className="text-xs text-slate-400">{paper.year || 2024}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleToggleFavorite(e, paper._id || paper.id)}
                        className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
                        title={paper.is_favorite ? 'Favorited' : 'Add to favorites'}
                      >
                        <Star className={`w-4 h-4 ${paper.is_favorite ? 'text-amber-500 fill-amber-500' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => handleDeletePaper(e, paper._id || paper.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Delete paper"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Authors */}
                  <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 hover:text-blue-600 transition-colors">
                    {paper.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {paper.authors && paper.authors.length > 0 ? paper.authors.join(', ') : 'Academic Author'}
                  </p>

                  {/* Abstract Preview */}
                  <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                    {paper.abstract || 'Document text extracted and indexed.'}
                  </p>

                  {/* Keywords */}
                  {paper.keywords && paper.keywords.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {paper.keywords.slice(0, 3).map((kw, i) => (
                        <span key={i} className="text-[10px] bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Row: Processing Status & Action Buttons */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs">
                    {paper.processing_status === 'complete' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Analyzed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleCompareSelection(e, paper._id || paper.id)}
                      className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                        isSelected 
                          ? 'bg-teal-50 border-teal-300 text-teal-700' 
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Compare'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/chat?paperId=${paper._id || paper.id}`);
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100/70 rounded transition-colors flex items-center gap-1"
                    >
                      <MessageSquareText className="w-3 h-3" />
                      <span>Chat</span>
                    </button>
                  </div>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      )}

      <UploadModal 
        isOpen={uploadOpen} 
        onClose={() => setUploadOpen(false)}
        onUploadComplete={() => {
          setUploadOpen(false);
          fetchPapers();
        }}
      />
    </div>
  );
};

export default PaperLibraryPage;
