import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  CheckCircle2, 
  FolderGit2, 
  Sparkles, 
  Upload, 
  Search, 
  MessageSquareText, 
  Map, 
  ArrowRight, 
  Clock, 
  Plus,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, papersAPI, projectsAPI } from '../services/api';
import CountUp from '../components/ui/CountUp';
import SpotlightCard from '../components/ui/SpotlightCard';
import ShinyBadge from '../components/ui/ShinyBadge';
import UploadModal from '../components/papers/UploadModal';

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total_papers: 0,
    papers_analyzed: 0,
    research_projects: 0,
    saved_notes: 0,
  });
  const [recentPapers, setRecentPapers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, papersRes, projectsRes] = await Promise.all([
          usersAPI.getStats(),
          papersAPI.list({ limit: 4 }),
          projectsAPI.list(),
        ]);
        setStats(statsRes.data);
        setRecentPapers(papersRes.data.slice(0, 4));
        setProjects(projectsRes.data.slice(0, 3));
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {getGreeting()}, {user?.name ? user.name.split(' ')[0] : 'Researcher'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Continue your research from where you left off.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Paper</span>
          </button>
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            <MessageSquareText className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Chat</span>
          </button>
          <button
            onClick={() => navigate('/search')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Search Literature</span>
          </button>
        </div>
      </div>

      {/* Statistics Grid with CountUp Animation */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SpotlightCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Papers</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
            <CountUp to={stats.total_papers} duration={1.2} />
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
            <span>In your library workspace</span>
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Papers Analyzed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
            <CountUp to={stats.papers_analyzed} duration={1.2} />
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600">
            <span>Semantic vectors indexed</span>
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Research Projects</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
            <CountUp to={stats.research_projects} duration={1.2} />
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
            <span>Curated research domains</span>
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Saved Notes</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
            <CountUp to={stats.saved_notes} duration={1.2} />
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
            <span>Page-linked observations</span>
          </div>
        </SpotlightCard>
      </div>

      {/* Main 2-Column Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Recent Papers */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Recent Papers</h2>
              <p className="text-xs text-slate-500">Latest literature added to your personal library</p>
            </div>
            <button
              onClick={() => navigate('/library')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              <span>View all papers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentPapers.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">No papers uploaded yet</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">Upload your first PDF or search literature to begin</p>
                <button
                  onClick={() => setUploadOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Upload Paper
                </button>
              </div>
            ) : (
              recentPapers.map((paper) => (
                <div
                  key={paper._id || paper.id}
                  onClick={() => navigate(`/library/${paper._id || paper.id}`)}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {paper.journal || 'Academic'}
                      </span>
                      <span className="text-xs text-slate-400">{paper.year || 2024}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                      {paper.title}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">
                      {paper.authors ? paper.authors.join(', ') : 'Authors'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/chat?paperId=${paper._id || paper.id}`);
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-md transition-colors"
                    >
                      Chat
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/library/${paper._id || paper.id}`);
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100/80 rounded-md transition-colors"
                    >
                      Analyze
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Projects & Activity */}
        <div className="space-y-6">
          {/* Research Projects */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Research Projects</h2>
              <button 
                onClick={() => navigate('/library')}
                className="text-xs text-blue-600 hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2.5">
              {projects.length === 0 ? (
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-center">
                  <p className="text-xs text-slate-500">No projects created yet</p>
                </div>
              ) : (
                projects.map((proj) => (
                  <div
                    key={proj._id || proj.id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-semibold text-slate-900 truncate">{proj.name}</h4>
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                        {proj.papers_count || 0} papers
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{proj.description || proj.domain}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Research Activity Timeline */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900">Research Activity</h2>
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3.5 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium text-slate-800">AI analysis completed</p>
                  <p className="text-slate-400 text-[11px]">Attention Is All You Need &bull; 10 min ago</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium text-slate-800">New literature saved</p>
                  <p className="text-slate-400 text-[11px]">LoRA: Low-Rank Adaptation &bull; 2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium text-slate-800">Roadmap generated</p>
                  <p className="text-slate-400 text-[11px]">Neural Representation Scaling &bull; Yesterday</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <UploadModal 
        isOpen={uploadOpen} 
        onClose={() => setUploadOpen(false)}
        onUploadComplete={() => {
          setUploadOpen(false);
          navigate('/library');
        }}
      />
    </div>
  );
};

export default DashboardPage;
