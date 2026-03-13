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
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg-primary">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card w-full max-w-px-380 border border-border-subtle shadow-xl bg-bg-surface p-8 md:p-10"
        >
          <div className="flex flex-col items-center mb-8 text-center">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20 cursor-pointer"
            >
              <Search className="text-white" size={24} />
            </motion.div>
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">Track Case</h2>
            <p className="text-text-secondary text-sm font-medium mt-1">Monitor your submission in real-time</p>
          </div>

          <form onSubmit={handleTrack} className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Access Identifier</label>
              <div className="relative group">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  className="input-field pl-10 font-mono uppercase tracking-wider" 
                  placeholder="CMP-XXXXXXXX" 
                  value={trackingId} 
                  onChange={(e) => setTrackingId(e.target.value.toUpperCase())} 
                  required 
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Secure PIN</label>
              <div className="relative group">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" />
                <input 
                  type="password" 
                  className="input-field pl-10 tracking-widest" 
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
                  className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-[11px] font-bold text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="btn btn-primary w-full py-3 text-sm font-bold shadow-md shadow-primary/20 mt-2" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <span>Initialize Dashboard</span>
                  <ArrowRight size={16} className="ml-1" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen py-12">
      <div className="bg-mesh" />
      
      <div className="container relative">
        <motion.button 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setComplaint(null)} 
          className="btn btn-ghost !px-1 mb-6 group opacity-60 hover:opacity-100"
        >
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> 
            Back to Triage
          </div>
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8 space-y-8"
          >
            <div className="glass-card !p-6">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-6 pb-6 border-b border-white/5">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="px-2 py-0.5 rounded bg-primary/5 border border-primary/20 flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-primary heartbeat shadow-[0_0_8px_var(--primary-glow)]" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary">{complaint.status}</span>
                    </div>
                    <span className="text-[10px] font-mono text-text-muted bg-white/5 px-2 py-0.5 rounded opacity-60 tracking-wider font-bold">{complaint.trackingId}</span>
                  </div>
                  <h1 className="text-xl font-black text-white tracking-tight uppercase leading-tight">{complaint.title}</h1>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-1.5 opacity-40">Incident monitoring console</p>
                </div>
              </div>

              <div className="p-5 rounded-lg bg-bg-secondary border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                  <FileText size={40} />
                </div>
                <p className="text-xs text-text-secondary leading-relaxed relative z-10 font-bold opacity-80">{complaint.description}</p>
              </div>
            </div>

            <div className="glass-card !p-0 overflow-hidden h-[600px]">
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
            <div className="glass-card !p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-1 rounded-full bg-primary heartbeat shadow-[0_0_8px_var(--primary-glow)]" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Event Log</h3>
              </div>
              <div className="space-y-5 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                {activities.map((act, i) => (
                  <div key={i} className="relative pl-6">
                    <div className="absolute left-0.5 top-1.5 w-3 h-3 rounded-full bg-bg-surface border border-primary shadow-[0_0_5px_var(--primary-glow)] z-10" />
                    <p className="text-[10px] font-black text-white uppercase tracking-wider mb-1 opacity-90">{act.action.replace(/_/g, ' ')}</p>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-text-muted uppercase tracking-tight opacity-60">
                      <Clock size={10} />
                      {new Date(act.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card bg-success/5 border-success/10 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/10 text-success">
                <ShieldCheck size={20} />
              </div>
              <p className="text-xs text-secondary font-medium">This session is protected by end-to-end encryption.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TrackComplaint;
