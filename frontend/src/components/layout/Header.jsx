import React from 'react';
import { Menu, Plus, Search, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header = ({ onOpenSidebar, onOpenUpload }) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Academic Search Bar */}
        <div 
          onClick={() => navigate('/search')}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 w-64 md:w-80 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-400 hover:border-slate-300 hover:bg-slate-100/70 cursor-pointer transition-colors"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span>Search arXiv, Crossref, OpenAlex...</span>
          <kbd className="ml-auto text-[10px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-500 font-mono">⌘K</kbd>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={() => navigate('/chat')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">AI Research Chat</span>
        </button>

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Upload Paper</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
