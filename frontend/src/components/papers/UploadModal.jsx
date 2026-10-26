import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { papersAPI, jobsAPI } from '../../services/api';
import Modal from '../ui/Modal';

export const UploadModal = ({ isOpen, onClose, onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const STAGES = [
    'Uploading & Validating',
    'Extracting Text',
    'Cleaning Document',
    'Creating Semantic Chunks',
    'Generating Embeddings',
    'Indexing Vector Store',
    'Analyzing Paper Structure',
    'Processing Complete'
  ];

  // Poll background job status
  useEffect(() => {
    let interval = null;
    if (currentJob && currentJob.status === 'processing') {
      interval = setInterval(async () => {
        try {
          const res = await jobsAPI.getStatus(currentJob._id || currentJob.id);
          setCurrentJob(res.data);
          if (res.data.status === 'complete') {
            clearInterval(interval);
            setIsUploading(false);
            if (onUploadComplete) onUploadComplete(res.data);
          } else if (res.data.status === 'failed') {
            clearInterval(interval);
            setIsUploading(false);
            setError(res.data.error || 'Paper processing encountered an issue.');
          }
        } catch (err) {
          console.error('Job polling error:', err);
        }
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [currentJob, onUploadComplete]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (selectedFile) => {
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file.');
      return;
    }
    setError(null);
    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace('.pdf', '').replace(/[-_]/g, ' '));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (title.trim()) formData.append('title', title.trim());

      const res = await papersAPI.upload(formData);
      setCurrentJob({
        _id: res.data.job_id,
        status: 'processing',
        progress: 10,
        current_step: 'Uploading & Validating'
      });
    } catch (err) {
      console.error('Upload failed:', err);
      setIsUploading(false);
      setError(err.response?.data?.detail || 'Failed to upload paper. Please try again.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setTitle('');
    setCurrentJob(null);
    setIsUploading(false);
    setError(null);
  };

  const handleClose = () => {
    if (!isUploading) {
      handleReset();
      onClose();
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Research Paper" maxWidth="max-w-xl">
      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!currentJob ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all
              ${isDragging 
                ? 'border-blue-500 bg-blue-50/50' 
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
            />

            <div className="flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-blue-50 text-blue-600">
              <UploadCloud className="w-6 h-6" />
            </div>

            <p className="text-sm font-medium text-slate-700 text-center">
              Drop your research paper here, or <span className="text-blue-600 underline">Browse PDF</span>
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Supports standard academic papers up to 50MB
            </p>
          </div>

          {/* Selected File Details */}
          {file && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-900 truncate">{file.name}</p>
                  <p className="text-[11px] text-slate-400">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Paper Title (Optional override) */}
          <div>
            <label className="block mb-1 text-xs font-medium text-slate-700">
              Paper Title <span className="text-slate-400 font-normal">(Auto-detected from file)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Attention Is All You Need"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || isUploading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50 transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Upload & Analyze</span>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Multi-Stage Live Processing Tracker */
        <div className="py-2 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-blue-50 text-blue-600">
              {currentJob.status === 'complete' ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              ) : (
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              )}
            </div>
            <h4 className="text-base font-semibold text-slate-900">
              {currentJob.status === 'complete' ? 'Paper Ingestion Complete!' : 'Analyzing Research Paper'}
            </h4>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              {currentJob.current_step}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-slate-600">
              <span>Overall Progress</span>
              <span>{currentJob.progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                style={{ width: `${currentJob.progress}%` }}
              />
            </div>
          </div>

          {/* Live Pipeline Steps */}
          <div className="space-y-2 rounded-xl bg-slate-50 p-4 border border-slate-100">
            {STAGES.map((stepName, idx) => {
              const stepProgress = Math.round(((idx + 1) / STAGES.length) * 100);
              const isPast = currentJob.progress >= stepProgress;
              const isCurrent = currentJob.status === 'processing' && !isPast && (idx === 0 || currentJob.progress >= Math.round((idx / STAGES.length) * 100));

              return (
                <div key={stepName} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2">
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
                        {idx + 1}
                      </div>
                    )}
                    <span className={isPast ? 'text-slate-800 font-medium' : isCurrent ? 'text-blue-600 font-medium' : 'text-slate-400'}>
                      {stepName}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {isPast ? 'Done' : isCurrent ? 'In progress' : 'Queued'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Completion Actions */}
          {currentJob.status === 'complete' && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Go to Paper Library
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default UploadModal;
