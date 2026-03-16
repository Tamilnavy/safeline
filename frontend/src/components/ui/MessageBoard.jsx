import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { Send, User, MessageSquare } from 'lucide-react';

const MessageBoard = ({ complaintId, trackingId, pin, isStaff = false, showHeader = true, minimal = false }) => {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [complaintId, trackingId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      let resp;
      if (isStaff) {
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
      if (isStaff) {
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
      className={`flex flex-col h-full bg-white overflow-hidden ${minimal ? '' : 'border border-slate-100 rounded-2xl shadow-sm'}`} 
      style={{ height: '100%', maxHeight: '500px' }}
    >
      {showHeader && (
        <header className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#3b82f6] shadow-sm ring-1 ring-blue-100">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Communication Center</h3>
              <p className="text-[11px] text-slate-400 font-medium">Direct channel with investigative team</p>
            </div>
          </div>
        </header>
      )}

      <div className="flex-1 overflow-y-auto p-4 m-2 bg-slate-50/30 border border-slate-100/80 rounded-2xl space-y-6 scrollbar-hide">
        {safeMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
              <User size={20} className="opacity-20" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest">No messages yet</p>
          </div>
        ) : (
          safeMessages.map((m, idx) => {
            const isMe = (isStaff && m.senderRole === 'STAFF') || (!isStaff && m.senderRole === 'REPORTER');
            return (
              <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`
                  max-w-[85%] px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed
                  ${isMe 
                    ? 'bg-indigo-600 text-white rounded-br-sm shadow-lg shadow-indigo-600/10' 
                    : 'bg-slate-100 text-slate-900 rounded-bl-sm border border-slate-200'}
                `}>
                  {m.content}
                </div>
                <div className="mt-1.5 px-1 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>{m.senderRole === 'STAFF' ? 'Investigator' : 'Reporter'}</span>
                  <span>•</span>
                  <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

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
    </div>
  );
};

export default MessageBoard;
