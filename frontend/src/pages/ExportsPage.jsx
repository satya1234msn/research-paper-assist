import React, { useState, useEffect } from 'react';
import { 
  FileDown, 
  FileText, 
  Download, 
  CheckCircle2, 
  Loader2, 
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { exportsAPI } from '../services/api';
import SpotlightCard from '../components/ui/SpotlightCard';

export const ExportsPage = () => {
  const [exportsList, setExportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportType, setExportType] = useState('paper_analysis');
  const [format, setFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchExports = async () => {
    setLoading(true);
    try {
      const res = await exportsAPI.list();
      setExportsList(res.data);
    } catch (err) {
      console.error('Failed to load exports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExports();
  }, []);

  const handleCreateNewExport = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await exportsAPI.create({
        export_type: exportType,
        format: format,
      });
      setExportsList([res.data, ...exportsList]);
      window.open(res.data.download_url, '_blank');
    } catch (err) {
      console.error('Export creation failed:', err);
      alert('Export generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Research Export Center</h1>
        <p className="mt-1 text-xs text-slate-500">
          Generate publication-ready PDF, Word (DOCX), and plain text exports of research analyses, matrices, roadmaps, and notes.
        </p>
      </div>

      {/* Quick Export Generator Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Generate New Research Export</span>
        </h2>

        <form onSubmit={handleCreateNewExport} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Export Category</label>
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white"
            >
              <option value="paper_summary">Paper Structured Summary</option>
              <option value="research_gaps">Identified Research Gaps</option>
              <option value="roadmap">Research Roadmap & Timeline</option>
              <option value="notes">All Saved Research Notes</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Document Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white"
            >
              <option value="pdf">PDF Document (.pdf)</option>
              <option value="docx">Microsoft Word (.docx)</option>
              <option value="txt">Academic Plain Text (.txt)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Preparing & Generating...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>Compile & Download</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Generated Documents History */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Generated Research Exports</h3>

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading export archives...</p>
          </div>
        ) : exportsList.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-800">No export archives yet</p>
            <p className="text-xs text-slate-500 mt-1">Generate your first research export using the form above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exportsList.map((item) => (
              <SpotlightCard key={item._id || item.id} className="p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                      {item.format.toUpperCase()}
                    </span>
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ready</span>
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-900 leading-snug truncate">
                    {item.file_name}
                  </h4>

                  <p className="text-xs text-slate-500 capitalize">
                    {item.export_type.replace('_', ' ')}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Today'}
                  </span>

                  <a
                    href={item.download_url}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100/80 rounded-lg transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </a>
                </div>
              </SpotlightCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportsPage;
