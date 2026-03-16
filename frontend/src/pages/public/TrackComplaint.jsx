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
      <div className="min-h-screen bg-[#f4f7ff] pb-24 pt-12 px-6 flex flex-col items-center">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] -z-10" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="w-full max-w-md relative"
        >
          {/* Refined Slate Header */}
          <div className="bg-slate-800/95 backdrop-blur-md rounded-t-3xl p-8 mb-0 relative z-20 shadow-xl overflow-hidden border-x border-t border-slate-700/50">
            <div className="flex flex-col items-center relative z-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#3b82f6]/10 flex items-center justify-center mb-4 ring-1 ring-[#3b82f6]/20">
                <Search className="text-[#3b82f6]" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Track an Issue</h2>
              <p className="text-slate-400 text-[12px] font-medium mt-2 leading-relaxed">
                Enter your secure credentials to view updates, communicate with investigators, and upload evidence.
              </p>
            </div>
          </div>
 
          {/* Form Container White Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.1 }}
            className="bg-white rounded-b-3xl rounded-t-none -mt-4 pt-12 pb-10 px-8 md:px-10 shadow-2xl shadow-indigo-500/10 border border-white relative z-10"
          >
            <form onSubmit={handleTrack} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700 ml-1">Tracking ID</label>
                <div className="relative group">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3b82f6] transition-colors" />
                  <input 
                    type="text" 
                    className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200/60 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400 font-mono uppercase tracking-widest shadow-sm" 
                    placeholder="CMP-XXXXXXXX" 
                    value={trackingId} 
                    onChange={(e) => setTrackingId(e.target.value.toUpperCase())} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700 ml-1">Access PIN</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3b82f6] transition-colors" />
                  <input 
                    type="password" 
                    className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200/60 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400 tracking-widest shadow-sm" 
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
                    className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[12px] font-bold text-center"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit" 
                className="w-full h-12 bg-[#3b82f6] hover:bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group mt-4 h-13" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span className="text-[13px]">Authenticating...</span>
                  </div>
                ) : (
                  <>
                    <span className="text-[13px]">Initialize Case Dashboard</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>

            <p className="mt-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
              Military Grade Encryption Active
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className="min-h-screen bg-[#f4f7ff] pb-12 pt-12 px-6"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setComplaint(null)} 
            className="flex items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-[#3b82f6] group-hover:border-blue-100 transition-all shadow-sm">
              <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Sign Out</span>
          </motion.button>
          
          <div className="flex items-center gap-3">
            <div className="px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 flex items-center gap-2 shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#3b82f6]">{complaint.status}</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-400 bg-white px-4 py-1.5 rounded-full border border-slate-100 tracking-wider shadow-sm">#{complaint.trackingId}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Case Information & Communication */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8 flex flex-col gap-8"
          >
            {/* Case Overview Card */}
            <div className="bg-white p-8 rounded-[32px] shadow-2xl shadow-indigo-500/5 border border-white">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#3b82f6]">
                  <FileText size={16} />
                </div>
                Case Overview
              </h3>
              <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 relative group">
                <h4 className="text-[15px] font-bold text-slate-800 mb-2 leading-tight">{complaint.title}</h4>
                <p className="text-[13px] text-slate-500 font-medium leading-relaxed">{complaint.description}</p>
              </div>
            </div>

            <div className="bg-white rounded-[32px] shadow-2xl shadow-indigo-500/5 border border-white overflow-hidden h-[500px] flex flex-col">
              <div className="flex-1 relative">
                <MessageBoard 
                  complaintId={complaint.id} 
                  trackingId={complaint.trackingId} 
                  pin={pin} 
                  showHeader={true}
                  minimal={true}
                />
              </div>
            </div>
          </motion.div>

          {/* Right Column: Case Progress */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-8"
          >
            {/* High-Fidelity Professional Timeline */}
            <div className="bg-white p-8 rounded-[32px] shadow-2xl shadow-indigo-500/5 border border-white">
              <h3 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#3b82f6]">
                  <Activity size={16} />
                </div>
                Case Progress
              </h3>
              <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                {activities.map((act, i) => (
                  <div key={i} className="relative pl-10 group animate-in slide-in-from-right-2 duration-500" style={{ animationDelay: `${i * 150}ms` }}>
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-md z-10 transition-transform flex items-center justify-center ${
                      i === 0 ? 'bg-[#3b82f6] ring-4 ring-blue-50 scale-110' : 'bg-slate-200'
                    }`}>
                      {i === 0 && <Clock size={10} className="text-white" />}
                    </div>
                    <div>
                      <p className={`text-[13px] font-bold uppercase tracking-wide transition-colors ${
                        i === 0 ? 'text-[#3b82f6]' : 'text-slate-700'
                      }`}>
                        {act.action.replace(/_/g, ' ')}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                          {new Date(act.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shield Info */}
            <div className="p-6 bg-[#f8faff] border border-blue-100 rounded-[28px] flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-white border border-blue-100 shadow-sm flex items-center justify-center text-[#3b82f6] flex-shrink-0">
                <ShieldCheck size={22} />
              </div>
              <p className="text-[11px] text-slate-600 font-bold leading-relaxed">Dedicated end-to-end encrypted secure channel.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default TrackComplaint;
