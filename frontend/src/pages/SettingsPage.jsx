import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Key, 
  ShieldCheck, 
  Database, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';

export const SettingsPage = () => {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [institution, setInstitution] = useState(user?.institution || '');
  const [interests, setInterests] = useState(user?.research_interests?.join(', ') || '');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setInstitution(user.institution || '');
      setInterests(user.research_interests?.join(', ') || '');
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const interestsArray = interests.split(',').map(s => s.trim()).filter(Boolean);
      const res = await usersAPI.updateProfile({
        name,
        institution,
        research_interests: interestsArray
      });
      setUser(res.data);
      localStorage.setItem('research_user', JSON.stringify(res.data));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account & Workspace Settings</h1>
        <p className="mt-1 text-xs text-slate-500">
          Configure your researcher profile, academic institution, and AI model preferences.
        </p>
      </div>

      {/* Profile Settings */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <User className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-slate-900">Researcher Profile</h2>
        </div>

        {saved && (
          <div className="flex items-center gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profile settings saved successfully.</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Academic Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Academic Institution / Lab</label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. Stanford University / Artificial Intelligence Laboratory"
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Research Interests <span className="text-slate-400 font-normal">(Comma-separated)</span>
            </label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g. Transformers, Low-Rank Adaptation, Robustness, Biomedical AI"
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* AI Orchestration & Vector Store Status */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Database className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-semibold text-slate-900">System & Engine Diagnostics</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-semibold">RAG Retrieval Engine</span>
            <p className="font-semibold text-slate-800">ChromaDB / Vector Embeddings</p>
            <p className="text-slate-500 text-[11px]">User-isolated metadata security filtering enabled</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-semibold">Document Parser</span>
            <p className="font-semibold text-slate-800">PyMuPDF (fitz) Engine</p>
            <p className="text-slate-500 text-[11px]">8-stage live background chunking pipeline active</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-semibold">Literature Index Discovery</span>
            <p className="font-semibold text-slate-800">OpenAlex, Crossref, arXiv</p>
            <p className="text-slate-500 text-[11px]">Real-time open academic API integrations connected</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-semibold">Document Exporter</span>
            <p className="font-semibold text-slate-800">ReportLab & Python-Docx</p>
            <p className="text-slate-500 text-[11px]">Publication-grade PDF, Word, and TXT synthesis</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
