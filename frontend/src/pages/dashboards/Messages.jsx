import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { motion } from 'framer-motion';
import { Search, MessageSquare, Clock, User, Shield, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Messages = () => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const resp = await api.get('/messages/all');
      const grouped = groupMessages(resp.data);
      setThreads(grouped);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setLoading(false);
    }
  };

  const groupMessages = (allMsgs) => {
    const map = new Map();

    allMsgs.forEach(msg => {
      const complaintId = msg.complaint?.id || 'none';
      if (!map.has(complaintId)) {
        map.set(complaintId, {
          complaint: msg.complaint,
          latestMessage: msg,
          count: 0,
          senders: new Set()
        });
      }

      const thread = map.get(complaintId);
      thread.count++;
      if (msg.sender) {
        thread.senders.add(msg.sender.username);
      } else {
        thread.senders.add('Anonymous Reporter');
      }

      // Check if this message is newer than the recorded latest
      if (new Date(msg.createdAt) > new Date(thread.latestMessage.createdAt)) {
        thread.latestMessage = msg;
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      new Date(b.latestMessage.createdAt) - new Date(a.latestMessage.createdAt)
    );
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Communication Threads</h1>
          <p className="text-slate-500 text-sm font-medium">Grouped conversation history across all active investigations.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
            <input type="text" placeholder="Search threads..." className="input-field pl-10 py-2! text-xs! w-64!" />
          </div>
        </div>
      </header>

      <Card className="p-0! overflow-hidden">
        {loading ? (
          <div className="py-20 text-center animate-pulse text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Threads...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Thread Context</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Latest Activity</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Participants</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Messages</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {threads.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-10 text-center text-slate-500 font-medium text-sm">No communication history found.</td>
                  </tr>
                ) : threads.map(thread => (
                  <tr key={thread.complaint?.id || 'none'} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                          <Shield size={14} className="text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-indigo-600 tracking-tight">{thread.complaint?.trackingId || 'N/A'}</p>
                          <p className="text-[10px] font-bold text-slate-700 truncate max-w-[200px]">{thread.complaint?.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="max-w-xs">
                        <p className="text-sm text-slate-600 truncate font-semibold mb-1">
                          {thread.latestMessage.sender ? thread.latestMessage.sender.username : 'Reporter'}: {thread.latestMessage.content}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          <Clock size={10} />
                          {new Date(thread.latestMessage.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-1">
                        {Array.from(thread.senders).map(sender => (
                          <Badge key={sender} variant="secondary" className="px-1.5 py-0 text-[8px]!">{sender}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <Badge variant="primary" className="font-mono text-[10px]">{thread.count}</Badge>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => navigate(`/dashboard/complaint/${thread.complaint?.id}`)}
                        className="flex items-center gap-2 ml-auto p-2 px-3 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all font-bold text-xs"
                      >
                        Open Chat
                        <ChevronRight size={14} />
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
