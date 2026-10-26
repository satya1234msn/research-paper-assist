import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Map, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileDown, 
  Loader2, 
  ArrowRight,
  RefreshCw,
  Bookmark,
  Target,
  ListTodo
} from 'lucide-react';
import { roadmapsAPI, exportsAPI } from '../services/api';
import SpotlightCard from '../components/ui/SpotlightCard';

export const RoadmapPage = () => {
  const [searchParams] = useSearchParams();
  const initialIdea = searchParams.get('idea') || '';

  const [idea, setIdea] = useState(initialIdea || 'Adaptive Quantization in Edge Large Language Models');
  const [domain, setDomain] = useState('Artificial Intelligence & Edge Computing');
  const [problem, setProblem] = useState('');
  const [constraints, setConstraints] = useState('Resource-constrained edge microcontrollers with sub-100ms latency requirement.');
  const [duration, setDuration] = useState(12);

  const [roadmaps, setRoadmaps] = useState([]);
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchExistingRoadmaps = async () => {
      try {
        const res = await roadmapsAPI.list();
        setRoadmaps(res.data);
        if (res.data.length > 0) {
          setActiveRoadmap(res.data[0]);
        } else if (idea) {
          handleGenerate();
        }
      } catch (err) {
        console.error('Failed to load roadmaps:', err);
      }
    };
    fetchExistingRoadmaps();
  }, []);

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!idea.trim() || generating) return;

    setGenerating(true);
    try {
      const res = await roadmapsAPI.generate({
        research_idea: idea.trim(),
        domain: domain.trim(),
        problem_statement: problem.trim() || undefined,
        constraints: constraints.trim() || undefined,
        duration_months: parseInt(duration),
      });
      setActiveRoadmap(res.data);
      setRoadmaps([res.data, ...roadmaps]);
    } catch (err) {
      console.error('Roadmap generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleExportRoadmap = async (format) => {
    if (!activeRoadmap) return;
    setExporting(true);
    try {
      const res = await exportsAPI.create({
        export_type: 'roadmap',
        format: format,
        entity_id: activeRoadmap._id,
        custom_title: activeRoadmap.research_title
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Interactive Research Roadmap</h1>
          <p className="mt-1 text-xs text-slate-500">
            Transform an exploratory research idea into an evidence-backed academic proposal and timeline.
          </p>
        </div>

        {activeRoadmap && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportRoadmap('pdf')}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export Roadmap (PDF)</span>
            </button>
          </div>
        )}
      </div>

      {/* Generation Input Box */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>What do you want to research?</span>
        </h2>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Research Idea / Focus *
              </label>
              <input
                type="text"
                required
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="e.g. Robust Vision-Language Models Under Adversarial Perturbations"
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Research Domain
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. Computer Vision, Biomedical AI, NLP"
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Constraints & Context (Optional)
              </label>
              <input
                type="text"
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                placeholder="e.g. Limited compute budget, open-source datasets only"
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white"
              >
                <option value={6}>6 Months (Fast Track)</option>
                <option value={12}>12 Months (Standard Thesis)</option>
                <option value={24}>24 Months (Multi-Year Grant)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              type="submit"
              disabled={generating || !idea.trim()}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Academic Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Research Roadmap</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Generated Roadmap Display */}
      {activeRoadmap && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Main Title & Problem Overview Card */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                AI Research Roadmap
              </span>
              <span className="text-xs text-slate-400">Target Duration: {duration} Months</span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 leading-snug">
              {activeRoadmap.research_title}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Problem Statement</span>
                <p className="text-xs text-slate-700 leading-relaxed">{activeRoadmap.problem_statement}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Academic Motivation</span>
                <p className="text-xs text-slate-700 leading-relaxed">{activeRoadmap.motivation}</p>
              </div>
            </div>

            {/* Research Questions & Objectives */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-blue-600" />
                  <span>Research Objectives</span>
                </h4>
                <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
                  {activeRoadmap.research_objectives?.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Research Questions</span>
                </h4>
                <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
                  {activeRoadmap.research_questions?.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Visual Interactive Timeline Phases */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Structured Execution Timeline</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeRoadmap.timeline_phases?.map((phase, idx) => (
                <SpotlightCard key={idx} className="p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                      Phase {phase.phase_number}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{phase.duration}</span>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-900">{phase.title}</h4>

                  {/* Objectives */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Objectives</span>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {phase.objectives?.map((o, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Deliverables */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Key Deliverables</span>
                    <div className="flex flex-wrap gap-1.5">
                      {phase.deliverables?.map((del, i) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {del}
                        </span>
                      ))}
                    </div>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </div>

          {/* Datasets, Metrics, and Methodology */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-semibold text-slate-800">Proposed Methodology</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{activeRoadmap.proposed_methodology}</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-semibold text-slate-800">Datasets to Explore</h4>
              <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
                {activeRoadmap.datasets_to_explore?.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-semibold text-slate-800">Evaluation Metrics</h4>
              <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
                {activeRoadmap.evaluation_metrics?.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapPage;
