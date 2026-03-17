import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { motion } from 'framer-motion';
import { Search, MessageSquare, Clock, User, Shield, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const resp = await api.get('/messages/all');
      setMessages(resp.data);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Global Messages</h1>
          <p className="text-slate-500 text-sm font-medium">Platform-wide communication across all active investigations.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
             <input type="text" placeholder="Search messages..." className="input-field pl-10 py-2! text-xs! w-64!" />
          </div>
        </div>
      </header>

      <Card className="p-0! overflow-hidden">
        {loading ? (
          <div className="py-20 text-center animate-pulse text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Messages...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Sender</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Complaint ID</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Message Snippet</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Timestamp</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {messages.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-10 text-center text-slate-500 font-medium text-sm">No messages found.</td>
                  </tr>
                ) : messages.map(msg => (
                  <tr key={msg.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                             <User size={14} className="text-indigo-600" />
                          </div>
                          <div>
                             <p className="text-xs font-bold text-slate-900 tracking-tight">{msg.sender ? msg.sender.username : 'Anonymous Reporter'}</p>
                             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{msg.senderRole?.replace(/_/g, ' ')}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-2">
                          <Shield size={14} className="text-slate-400" />
                          <span className="text-xs font-bold text-indigo-600">{msg.complaint?.trackingId}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5 max-w-xs">
                       <p className="text-sm text-slate-600 truncate font-medium">{msg.content}</p>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                          <Clock size={12} className="text-slate-400" />
                          {new Date(msg.createdAt).toLocaleString()}
                       </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <button 
                         onClick={() => navigate(`/dashboard/complaint/${msg.complaint?.id}`)} 
                         className="p-2 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors inline-block"
                       >
                         <ChevronRight size={16} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Messages;
