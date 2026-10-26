import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Send, 
  Sparkles, 
  BookOpen, 
  Plus, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  ChevronRight, 
  Quote,
  Layers,
  Info
} from 'lucide-react';
import { chatAPI, papersAPI } from '../services/api';
import ShinyBadge from '../components/ui/ShinyBadge';

export const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const initialPaperId = searchParams.get('paperId');

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [papers, setPapers] = useState([]);
  const [selectedPaperId, setSelectedPaperId] = useState(initialPaperId || '');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeEvidence, setActiveEvidence] = useState([]);

  const messagesEndRef = useRef(null);

  const suggestedPrompts = [
    'Summarize the core methodology and findings.',
    'What specific research limitations are noted in the text?',
    'What potential research gaps exist in this work?',
    'What dataset and evaluation metrics were employed?',
    'Explain how attention mechanisms are formalized here.'
  ];

  // Load papers and conversations
  useEffect(() => {
    const initChat = async () => {
      setLoading(true);
      try {
        const [papersRes, convsRes] = await Promise.all([
          papersAPI.list(),
          chatAPI.listConversations(),
        ]);
        setPapers(papersRes.data);
        setConversations(convsRes.data);

        if (convsRes.data.length > 0) {
          const first = convsRes.data[0];
          setActiveConvId(first._id || first.id);
          setMessages(first.messages || []);
        }
      } catch (err) {
        console.error('Chat init error:', err);
      } finally {
        setLoading(false);
      }
    };
    initChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = async (conv) => {
    setActiveConvId(conv._id || conv.id);
    setMessages(conv.messages || []);
    if (conv.paper_id) setSelectedPaperId(conv.paper_id);
    // Find top citations from last assistant message
    const lastMsg = [...(conv.messages || [])].reverse().find(m => m.role === 'assistant');
    if (lastMsg && lastMsg.citations) {
      setActiveEvidence(lastMsg.citations);
    } else {
      setActiveEvidence([]);
    }
  };

  const handleNewConversation = () => {
    setActiveConvId(null);
    setMessages([]);
    setActiveEvidence([]);
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    try {
      await chatAPI.deleteConversation(convId);
      const remaining = conversations.filter(c => (c._id || c.id) !== convId);
      setConversations(remaining);
      if (activeConvId === convId) {
        if (remaining.length > 0) {
          handleSelectConversation(remaining[0]);
        } else {
          handleNewConversation();
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleSendMessage = async (msgToSend = null) => {
    const text = (typeof msgToSend === 'string' ? msgToSend : inputMessage).trim();
    if (!text || sending) return;

    setInputMessage('');
    setSending(true);

    // Optimistic user message
    const tempUserMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await chatAPI.sendMessage({
        conversation_id: activeConvId || undefined,
        paper_id: selectedPaperId || undefined,
        selected_paper_ids: selectedPaperId ? [selectedPaperId] : undefined,
        message: text
      });

      const { conversation_id, assistant_message, all_messages } = res.data;
      setActiveConvId(conversation_id);
      setMessages(all_messages || [...messages, tempUserMsg, assistant_message]);

      if (assistant_message.citations && assistant_message.citations.length > 0) {
        setActiveEvidence(assistant_message.citations);
      }

      // Refresh conversations list if new conversation created
      if (!activeConvId) {
        const convsRes = await chatAPI.listConversations();
        setConversations(convsRes.data);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'An error occurred while generating the research answer. Please try again.',
          citations: []
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-7.5rem)] flex flex-col md:flex-row rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs animate-in fade-in duration-200">
      {/* Left Sidebar: Scope & History */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col bg-slate-50/60 shrink-0">
        <div className="p-3 border-b border-slate-200 space-y-2.5">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Research Chat</span>
          </button>

          {/* Paper Context Selector */}
          <div>
            <label className="block text-[10px] font-semibold tracking-wider text-slate-500 uppercase mb-1">
              Document Scope
            </label>
            <select
              value={selectedPaperId}
              onChange={(e) => setSelectedPaperId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-blue-500"
            >
              <option value="">All Papers in Library</option>
              {papers.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.title.length > 28 ? p.title.slice(0, 28) + '...' : p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Conversations
          </div>
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No conversations yet.
            </div>
          ) : (
            conversations.map((conv) => {
              const cid = conv._id || conv.id;
              const isActive = activeConvId === cid;
              return (
                <div
                  key={cid}
                  onClick={() => handleSelectConversation(conv)}
                  className={`group flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate pr-1">{conv.title || 'Research Q&A'}</span>
                  <button
                    onClick={(e) => handleDeleteConversation(e, cid)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Center: Chat Flow */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Chat Header */}
        <div className="h-14 px-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              {selectedPaperId 
                ? (papers.find(p => (p._id || p.id) === selectedPaperId)?.title || 'Paper Focus')
                : 'All Library Literature'}
            </h2>
          </div>
          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Strict Evidence RAG</span>
          </span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Ask Evidence-Backed Questions</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed mb-6">
                All answers are grounded in indexed paper chunks and cite specific page numbers. The AI never fabricates citations.
              </p>

              {/* Suggested Prompts */}
              <div className="w-full space-y-2">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left">
                  Suggested Research Prompts
                </p>
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center justify-between"
                  >
                    <span>{p}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
                >
                  <div
                    className={`max-w-2xl rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-xs space-y-3'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>

                    {/* Citations Tag List */}
                    {!isUser && m.citations && m.citations.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          Sources & Citations:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {m.citations.map((c, cIdx) => (
                            <button
                              key={cIdx}
                              onClick={() => setActiveEvidence([c])}
                              className="citation-badge"
                            >
                              <span>{c.paper_title}</span>
                              {c.page_number && <span className="font-semibold">&bull; P.{c.page_number}</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {sending && (
            <div className="flex justify-start">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Retrieving vector chunks and formulating grounded answer...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a question about the papers (e.g. What are the key limitations?)..."
              disabled={sending}
              className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || sending}
              className="p-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Sidebar: Evidence Panel */}
      {activeEvidence.length > 0 && (
        <div className="hidden lg:flex w-72 border-l border-slate-200 bg-slate-50/70 p-4 flex-col overflow-y-auto space-y-3 shrink-0">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5 text-blue-600" />
              <span>Grounded Evidence</span>
            </h4>
            <span className="text-[10px] text-slate-400">{activeEvidence.length} Excerpts</span>
          </div>

          {activeEvidence.map((ev, i) => (
            <div key={i} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-medium text-blue-700">
                <span className="truncate pr-1">{ev.paper_title}</span>
                <span className="shrink-0 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">
                  Page {ev.page_number || 1}
                </span>
              </div>
              <p className="text-slate-600 italic text-[11px] leading-relaxed">
                "{ev.excerpt}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatPage;
