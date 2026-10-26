import React, { useState, useEffect } from 'react';
import { 
  Highlighter, 
  Search, 
  Plus, 
  Trash2, 
  BookOpen, 
  FileDown, 
  Tag, 
  Calendar,
  Loader2
} from 'lucide-react';
import { notesAPI, papersAPI, exportsAPI } from '../services/api';
import SpotlightCard from '../components/ui/SpotlightCard';

export const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [papers, setPapers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // New Note State
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPaperId, setNewPaperId] = useState('');
  const [newPageNum, setNewPageNum] = useState('');
  const [newTag, setNewTag] = useState('Observation');

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const [notesRes, papersRes] = await Promise.all([
        notesAPI.list({ search: search.trim() || undefined }),
        papersAPI.list(),
      ]);
      setNotes(notesRes.data);
      setPapers(papersRes.data);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      const res = await notesAPI.create({
        title: newTitle.trim() || 'Research Note',
        content: newContent.trim(),
        paper_id: newPaperId || undefined,
        page_number: newPageNum ? parseInt(newPageNum) : undefined,
        tags: [newTag]
      });
      setNotes([res.data, ...notes]);
      setShowNew(false);
      setNewTitle('');
      setNewContent('');
      setNewPaperId('');
      setNewPageNum('');
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Delete this research note?')) return;
    try {
      await notesAPI.delete(id);
      setNotes(notes.filter(n => (n._id || n.id) !== id));
    } catch (err) {
      console.error('Delete note failed:', err);
    }
  };

  const handleExportNotes = async (format) => {
    setExporting(true);
    try {
      const res = await exportsAPI.create({
        export_type: 'notes',
        format: format,
        custom_title: 'Research Notes & Literature Annotations'
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notes & Highlights</h1>
          <p className="mt-1 text-xs text-slate-500">
            Store literature observations, page-linked citations, and collaborative research thoughts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportNotes('pdf')}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export Notes (PDF)</span>
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Note</span>
          </button>
        </div>
      </div>

      {/* New Note Form Drawer/Card */}
      {showNew && (
        <div className="p-6 bg-white rounded-2xl border border-blue-200 shadow-md space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Create New Research Note</h3>
            <button 
              onClick={() => setShowNew(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateNote} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Note title (e.g. Attention Sparsity Trade-off)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
              />
              <select
                value={newPaperId}
                onChange={(e) => setNewPaperId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
              >
                <option value="">Attach to Paper (Optional)</option>
                {papers.map((p) => (
                  <option key={p._id} value={p._id}>{p.title}</option>
                ))}
              </select>
              <input
                type="number"
                value={newPageNum}
                onChange={(e) => setNewPageNum(e.target.value)}
                placeholder="Page number (optional)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
              />
            </div>

            <textarea
              rows={4}
              required
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Enter your research observation, critique, equation insight, or hypothesis..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 resize-none"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {['Observation', 'Methodology', 'Hypothesis', 'Limitation'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewTag(t)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      newTag === t 
                        ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium' 
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                Save Note
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notes Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading research notes...</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Highlighter className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800">No notes saved yet</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">Click "Add Note" to record your literature insights.</p>
          <button
            onClick={() => setShowNew(true)}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Create First Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <SpotlightCard key={note._id || note.id} className="p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {note.tags?.map((t, idx) => (
                      <span key={idx} className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                        {t}
                      </span>
                    ))}
                    {note.page_number && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        Page {note.page_number}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note._id || note.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                  {note.title}
                </h3>

                {note.paper_title && (
                  <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1 truncate">
                    <BookOpen className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{note.paper_title}</span>
                  </p>
                )}

                <p className="text-xs text-slate-700 leading-relaxed pt-1">
                  {note.content}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                {note.created_at ? new Date(note.created_at).toLocaleDateString() : 'Recent'}
              </div>
            </SpotlightCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesPage;
