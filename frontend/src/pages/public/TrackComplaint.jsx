import { useState, useEffect } from 'react';
import api from '../../services/api';
import MessageBoard from '../../components/ui/MessageBoard';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Lock, 
  MessageSquare, 
  FileText, 
  Send, 
  ShieldCheck, 
  Clock, 
  ArrowLeft,
  Download,
  Paperclip,
  Activity,
  ChevronLeft,
  ArrowRight
} from 'lucide-react';

const TrackComplaint = () => {
  const [trackingId, setTrackingId] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [complaint, setComplaint] = useState(null);
  const [activities, setActivities] = useState([]);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    
    const cleanId = trackingId.trim();
    const cleanPin = pin.trim();

    try {
      const authResp = await api.post('/auth/track', { trackingId: cleanId, pin: cleanPin });
      localStorage.setItem('token', authResp.data.token);
      
      const [compResp, actResp, msgResp] = await Promise.all([
        api.get(`/complaints/public/${cleanId}?pin=${cleanPin}`),
        api.get(`/complaints/activities/${authResp.data.complaintId}`),
        api.get(`/communication/messages-reporter?trackingId=${cleanId}&pin=${cleanPin}`)
      ]);
      
      setComplaint(compResp.data);
      setActivities(actResp.data);
      setMessages(Array.isArray(msgResp.data) ? msgResp.data : []);
    } catch (err) {
      setError('Invalid Tracking ID or SECURE PIN.');
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  if (!complaint) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white w-full max-w-md p-10 rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100"
        >
          <div className="flex flex-col items-center mb-10 text-center">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mb-6 shadow-xl shadow-indigo-600/30 cursor-pointer"
            >
              <Search className="text-white" size={28} />
            </motion.div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Track Case</h2>
            <p className="text-slate-500 text-sm font-medium mt-2">Monitor your submission in real-time</p>
          </div>

          <form onSubmit={handleTrack} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Access Identifier</label>
              <div className="relative group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="text" 
                  className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400 font-mono uppercase tracking-widest" 
                  placeholder="CMP-XXXXXXXX" 
                  value={trackingId} 
                  onChange={(e) => setTrackingId(e.target.value.toUpperCase())} 
                  required 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Secure PIN</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="password" 
                  className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400 tracking-widest" 
                  placeholder="••••••" 
                  value={pin} 
                  onChange={(e) => setPin(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 group mt-2" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <span>Initialize Dashboard</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-slate-50">
      <div className="container max-w-7xl mx-auto px-6">
        <motion.button 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setComplaint(null)} 
          className="flex items-center gap-2 mb-8 group"
        >
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all shadow-sm">
            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Back to Triage</span>
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8 space-y-8"
          >
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-8 pb-8 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">{complaint.status}</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 tracking-wider">#{complaint.trackingId}</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">{complaint.title}</h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Incident monitoring console</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <FileText size={48} />
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed relative z-10">{complaint.description}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden h-[600px]">
              <MessageBoard 
                complaintId={complaint.id} 
                trackingId={complaint.trackingId} 
                pin={pin} 
              />
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-6"
          >
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-900">Event Log</h3>
              </div>
              <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                {activities.map((act, i) => (
                  <div key={i} className="relative pl-8 animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-white border-2 border-indigo-600 shadow-sm z-10 transition-transform hover:scale-125" />
                    <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-1">{act.action.replace(/_/g, ' ')}</p>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                      <Clock size={12} className="text-indigo-600/50" />
                      {new Date(act.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-3xl flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-white border border-emerald-100 shadow-sm flex items-center justify-center text-emerald-600 flex-shrink-0">
                <ShieldCheck size={24} />
              </div>
              <p className="text-xs text-emerald-800 font-bold leading-relaxed">This session is protected by end-to-end encryption.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TrackComplaint;
