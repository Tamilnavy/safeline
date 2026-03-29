import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Send, User, MessageSquare, Paperclip, FileText, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

const MessageBoard = ({ 
  complaintId, 
  trackingId, 
  pin, 
  evidence = [], 
  isStaff = false, 
  showHeader = true, 
  minimal = false,
  hideChat = false,
  title = "",
  description = ""
}) => {
  const [messages, setMessages] = useState([]);
  const { user: currentUser } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  useEffect(() => {
    if (!hideChat) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 10000); // Poll every 10s
      return () => clearInterval(interval);
    }
  }, [complaintId, trackingId, hideChat]);

  useEffect(() => {
    if (!hideChat) {
      scrollToBottom(messages.length > 5); // Smooth only if more than a few messages
    }
  }, [messages, hideChat]);

  // Initial instant scroll
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(false);
    }
  }, [complaintId]);

  const fetchMessages = async () => {
    try {
      let resp;
      if (isStaff || !trackingId) {
        resp = await api.get(`/communication/messages-staff/${complaintId}`);
      } else {
        resp = await api.get(`/communication/messages-reporter?trackingId=${trackingId}&pin=${pin}`);
      }
      const data = resp.data;
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load messages', err);
      setMessages([]);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      if (isStaff || !trackingId) {
        await api.post(`/communication/send-staff/${complaintId}`, content, {
          headers: { 'Content-Type': 'text/plain' }
        });
      } else {
        await api.post('/communication/send-reporter', {
          trackingId,
          pin,
          content
        });
      }
      setContent('');
      fetchMessages();
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  // Safe map check
  const safeMessages = Array.isArray(messages) ? messages : [];

  return (
    <div
      className={`flex flex-col h-full bg-white overflow-hidden ${minimal ? 'rounded-b-[32px]' : 'border border-slate-100 rounded-2xl shadow-sm'}`}
      style={{ minHeight: '100%', maxHeight: '100%' }}
    >
      {showHeader && (
        <header className="p-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#3b82f6] shadow-sm ring-1 ring-blue-100">
              <MessageSquare size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{hideChat ? 'Case Summary' : 'Communication Center'}</h3>
            </div>
          </div>
          
          {evidence && evidence.length > 0 && (
            <button 
              onClick={() => setShowEvidence(!showEvidence)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                showEvidence ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-400 hover:text-indigo-600'
              }`}
            >
              <Paperclip size={14} />
              <span>Evidence ({evidence.length})</span>
              {showEvidence ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </header>
      )}

      {/* Evidence Dropdown/Section */}
      {showEvidence && evidence && evidence.length > 0 && (
        <div className="mx-4 mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl animate-in slide-in-from-top-2 duration-300">
          <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
            <FileText size={12} /> Case Evidence Repository
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {evidence.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-white border border-indigo-100 rounded-xl shadow-sm group">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                    <FileText size={12} />
                  </div>
                  <p className="text-[11px] font-bold text-slate-700 truncate">{file.fileName}</p>
                </div>
                <a 
                  href={`http://localhost:8085/api/evidence/download/${file.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 ml-2 rounded hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 bg-slate-50/10 space-y-6 custom-scrollbar"
      >
        {hideChat ? (
          <div className="p-4 space-y-6 animate-in fade-in duration-500">
            <div className="space-y-2">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Case Title</h4>
              <p className="text-sm font-bold text-slate-800 leading-relaxed bg-white/50 p-4 rounded-xl border border-slate-100">
                {title || 'No Title Available'}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Issue Description</h4>
              <div className="text-sm font-medium text-slate-600 leading-relaxed bg-white/50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                {description || 'No detailed description provided.'}
              </div>
            </div>
            <div className="pt-6 border-t border-slate-100 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                <User size={18} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px]">
                Chat history is restricted for management oversight.
              </p>
            </div>
          </div>
        ) : safeMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
              <User size={20} className="opacity-20" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest">No messages yet</p>
          </div>
        ) : (
          safeMessages.map((m, idx) => {
            // Robust alignment logic: 
            // 1. In Staff/Investigator Console (isStaff is true): Staff on Right, Reporter on Left.
            // 2. In Reporter Public Tracking (isStaff is false): Reporter on Right, Staff on Left.
            const showOnRight = isStaff ? m.senderRole !== 'REPORTER' : m.senderRole === 'REPORTER';
            return (
              <div key={idx} className={`flex flex-col ${showOnRight ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`
                  max-w-[85%] px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed
                  ${showOnRight
                    ? 'bg-indigo-600 text-white rounded-br-sm shadow-lg shadow-indigo-600/10'
                    : 'bg-slate-100 text-slate-900 rounded-bl-sm border border-slate-200'}
                `}>
                  {m.content}
                </div>
                <div className="mt-1.5 px-1 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>
                    {m.senderRole === 'REPORTER' ? 'Reporter' : 'Investigator'}
                  </span>
                  <span>•</span>
                  <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {!hideChat && (
        <form onSubmit={handleSend} className="p-4 bg-slate-50/50 border-t border-slate-100 flex gap-2">
          <input
            type="text"
            className="flex-1 h-11 px-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm font-medium text-slate-900"
            placeholder="Type your message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="w-11 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !content.trim()}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default MessageBoard;
