import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import MessageBoard from '../../components/ui/MessageBoard';
import CaseDeliveryProgress from '../../components/dashboard/CaseDeliveryProgress';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  MessageSquare,
  FileText,
  ShieldCheck,
  Clock,
  ChevronLeft,
  Download,
  Activity,
  History,
  CheckCircle,
  Calendar,
  MapPin,
  Tag,
  Shield,
  ArrowRight,
  UserPlus,
  Users,
  Search as SearchIcon,
  Settings,
  X
} from 'lucide-react';

const InvestigationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [activities, setActivities] = useState([]);
  const [investigators, setInvestigators] = useState([]);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [assignSearch, setAssignSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCaseData();
  }, [id]);

  const fetchCaseData = async () => {
    setLoading(true);
    try {
      const [compResp, actResp] = await Promise.all([
        api.get(`/complaints/${id}`),
        api.get(`/complaints/activities/${id}`)
      ]);
      setComplaint(compResp.data);
      setActivities(actResp.data);

      // Fetch investigators if user is Lead/Escalation
      const isLead = user?.committeePermissions?.includes('COMMITTEE_LEAD');
      const isEscalation = user?.committeePermissions?.includes('ESCALATION_HEAD');
      if ((isLead || isEscalation) && user?.id !== compResp.data.reporterId) {
        try {
          const invResp = await api.get('/admin/users/investigators');
          setInvestigators(invResp.data);
        } catch (invErr) {
          console.warn('Management info restricted, continuing in reporter mode');
        }
      }
    } catch (err) {
      console.error('CRITICAL ERROR: Failed to fetch case details', err.response?.data || err.message);
      if (err.response?.status === 403) {
        console.error('DEBUG: Server returned 403 FORBIDDEN. Check backend logs for SECURITY DEBUG statements.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (investigatorId) => {
    try {
      await api.put(`/complaints/${id}/assign?investigatorId=${investigatorId}`);
      setShowAssignMenu(false);
      fetchCaseData();
    } catch (err) {
      alert('Failed to re-assign case');
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      await api.put(`/complaints/${id}/status?status=${status}`);
      fetchCaseData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f4f7ff] flex flex-col items-center justify-center p-12">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Decrypting Instance...</span>
    </div>
  );

  if (!complaint) return (
    <div className="min-h-screen bg-[#f4f7ff] flex flex-col items-center justify-center p-12">
      <div className="w-16 h-16 rounded-[24px] bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-6">
        <Lock size={32} />
      </div>
      <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Access Restricted / Not Found</h2>
      <button onClick={() => navigate('/dashboard')} className="text-indigo-600 font-bold text-sm hover:underline">Return to Oversight</button>
    </div>
  );

  const isReporter = user?.id === complaint?.reporterId || (user?.username && complaint?.reporterUsername && user.username === complaint.reporterUsername);
  const isStaff = user?.committeePermissions && user.committeePermissions.length > 0;
  // Personnel can only manage cases they DID NOT report themselves
  const canManage = isStaff && !isReporter;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className="min-h-screen bg-[#f4f7ff] pb-12 pt-8 px-6 -mx-8 -my-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className="w-11 h-11 rounded-[20px] bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm group"
            >
              <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            </motion.button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{complaint.trackingId}</span>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">INVESTIGATION CONSOLE</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{complaint.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-5 py-2 rounded-full bg-white border border-slate-100 flex items-center gap-2.5 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600">{complaint.status?.replace(/_/g, ' ')}</span>
            </div>

            {/* Manage Status Trigger - Restricted to Committee Lead & Escalation Head (and NOT the reporter) */}
            {(isStaff && !isReporter && (user?.committeePermissions?.includes('COMMITTEE_LEAD') || user?.committeePermissions?.includes('ESCALATION_HEAD'))) && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowStatusModal(true)}
                className="flex items-center gap-2 px-5 py-2 bg-rose-600 text-white rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all"
              >
                <Settings size={14} />
                Finalize & Close Case
              </motion.button>
            )}
          </div>
        </div>

        {/* Case Delivery Progress Tracker */}
        <CaseDeliveryProgress 
          status={complaint.status} 
          activities={activities} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Intelligence Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-8 space-y-8"
          >
            {/* Case Intelligence Card */}
            <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-indigo-500/5 border border-white group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:bg-indigo-500/10" />

              <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Case Intelligence</h3>
                  {complaint.type === 'SENSITIVE' && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Lock size={10} className="text-rose-500" />
                      <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Highly Sensitive • Selective Access Authorized</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100 relative z-10 mb-8">
                <p className="text-[15px] text-slate-700 leading-relaxed font-medium">
                  {complaint.description}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                {[
                  { icon: Calendar, label: 'Submitted', value: new Date(complaint.createdAt).toLocaleDateString() },
                  { icon: Tag, label: 'Category', value: complaint.categoryName || 'General Ethics' },
                  { icon: MapPin, label: 'Location', value: complaint.location || 'N/A' },
                  { icon: Shield, label: 'Priority', value: complaint.priority || 'NORMAL' }
                ].map((item, idx) => (
                  <div key={idx} className="p-5 bg-white border border-slate-100 rounded-[24px] shadow-sm hover:border-indigo-200 transition-all hover:scale-[1.02]">
                    <item.icon size={14} className="text-slate-400 mb-2" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                    <p className="text-[11px] font-black text-slate-900 truncate mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence Section */}
            {complaint.evidence && complaint.evidence.length > 0 && (
              <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-indigo-500/5 border border-white">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                    <ShieldCheck size={18} />
                  </div>
                  <h3 className="text-md font-black text-slate-900 tracking-tight uppercase">Evidence Vault ({complaint.evidence.length})</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {complaint.evidence.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-[28px] border border-slate-100 hover:bg-white hover:shadow-xl transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center text-blue-500 shadow-sm group-hover:rotate-6 transition-transform ring-1 ring-slate-100">
                          <FileText size={20} />
                        </div>
                        <span className="text-xs font-black text-slate-900 truncate max-w-[200px]">{file.fileName}</span>
                      </div>
                      <button className="p-3 bg-white rounded-2xl text-blue-600 shadow-sm hover:bg-blue-600 hover:text-white transition-all ring-1 ring-blue-50">
                        <Download size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Communication Center - Hidden for Committee Leads (Oversight Mode), unless they are the reporter */}
            {(!user?.committeePermissions?.includes('COMMITTEE_LEAD') || isReporter) && (
              <div className="bg-white rounded-[40px] shadow-2xl shadow-indigo-500/5 border border-white overflow-hidden flex flex-col min-h-[550px]">
                <div className="bg-white rounded-b-[40px] overflow-hidden flex flex-col h-[500px]">
                  <div className="flex-1 relative min-h-0">
                    <MessageBoard 
                      complaintId={complaint.id} 
                      initialMessages={[]} 
                      isStaff={canManage} 
                      showHeader={true}
                      title="Investigation Communication"
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Right Column: Progress Timeline */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-8"
          >
            {/* Inline Lifecycle Status - Restricted to Staff who are NOT the reporter */}
            {(isStaff && !isReporter && (user?.committeePermissions?.includes('COMPLAINT_HANDLER') || user?.committeePermissions?.includes('ESCALATION_HEAD'))) && 
             !user?.committeePermissions?.includes('COMMITTEE_LEAD') && (
              <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-indigo-500/5 border border-white relative overflow-hidden ring-1 ring-indigo-50/50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Lifecycle Update</p>
                <div className="grid grid-cols-1 gap-2">
                  {['SUBMITTED', 'ASSIGNED', 'UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED']
                    .map((s) => (
                      <button
                        key={s}
                        onClick={() => handleUpdateStatus(s)}
                        className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          complaint.status === s 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                            : 'bg-slate-50 text-indigo-600 border border-slate-100 hover:border-indigo-400 outline-none'
                        }`}
                      >
                        {s.replace(/_/g, ' ')}
                      </button>
                    ))}
                </div>
              </div>
            )}

            <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-indigo-500/5 border border-white relative overflow-hidden">
              <h3 className="text-md font-black text-slate-900 mb-10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <History size={16} />
                </div>
                Investigation Progress
              </h3>
              <div className="space-y-10 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar pr-4 pb-4">
                {activities.map((act, i) => {
                  const isReporter = user?.id === complaint?.reporterId || (user?.username && complaint?.reporterUsername && user.username === complaint.reporterUsername);
                  const isStaff = user?.committeePermissions && user.committeePermissions.length > 0;
                  // Mask for ALL reporters (even if they are staff) and non-staff viewers.
                  const shouldMask = !isStaff || isReporter;

                  const maskIdentity = (detail) => {
                    if (!detail || !shouldMask) return detail;
                    let masked = detail;
                    
                    // 1. Hide 'by [Any Identity]' (case-insensitive)
                    // We take everything before the first 'by ' to ensure names are never shown.
                    const lower = masked.toLowerCase();
                    const byPatterns = [' by ', ' performed by ', ' created by '];
                    for (const p of byPatterns) {
                      const idx = lower.indexOf(p);
                      if (idx !== -1) {
                        masked = masked.substring(0, idx);
                        break;
                      }
                    }
                    
                    // 2. Remove all parentheticals (prevents ID leaks like '(004)' or '(jdoe)')
                    masked = masked.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
                    
                    // 3. Scrub sensitive system labels into generic status updates
                    if (masked.toUpperCase().includes('RESOLUTION ALERT')) {
                      return 'The case has been finalized for resolution review.';
                    }
                    if (lower.includes('assigned case to') || lower.includes('case assigned')) {
                      return 'The case has been assigned to a designated investigator.';
                    }
                    if (lower.includes('triaged')) {
                      return 'The case has been triaged and prioritized for investigation.';
                    }
                    
                    return masked;
                  };

                  return (
                    <div key={i} className="relative pl-10 group">
                      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-md z-10 transition-transform ${
                        act.activityType === 'RESOLUTION_PENDING_REVIEW'
                          ? 'bg-amber-500 ring-4 ring-amber-50 scale-110'
                          : i === 0 ? 'bg-indigo-600 ring-4 ring-indigo-50 scale-110' : 'bg-slate-200 group-hover:scale-125'
                        }`}>
                        {act.activityType === 'RESOLUTION_PENDING_REVIEW' && <CheckCircle size={10} className="text-white mx-auto mt-[4px]" />}
                        {act.activityType !== 'RESOLUTION_PENDING_REVIEW' && i === 0 && <Clock size={10} className="text-white mx-auto mt-[4px]" />}
                      </div>
                      <div>
                        <p className={`text-[12px] font-black uppercase tracking-tight ${i === 0 ? 'text-indigo-600' : 'text-slate-800'}`}>
                          {act.activityType?.replace(/_/g, ' ') || 'SYSTEM ACTION'}
                        </p>
                        <p className="text-[11px] font-bold text-slate-500 mt-1 leading-snug">{maskIdentity(act.detail)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                            {new Date(act.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Manage Status Modal (Resolution Center) */}
        <AnimatePresence>
          {showStatusModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden border border-white"
              >
                <div className="p-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Shield size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900">Resolution Center</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update Lifecycle Status</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowStatusModal(false)}
                      className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {['SUBMITTED', 'ASSIGNED', 'UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED', 'CLOSED']
                      .filter(s => {
                        const isLead = user?.committeePermissions?.includes('COMMITTEE_LEAD');
                        const isEscalation = user?.committeePermissions?.includes('ESCALATION_HEAD');
                        
                        // Committee Lead and Escalation Head only have 'CLOSED' option for final oversight review
                        if (isLead || isEscalation) return s === 'CLOSED';
                        
                        const isHandlerOnly = user?.committeePermissions?.includes('COMPLAINT_HANDLER') &&
                          !user?.committeePermissions?.includes('COMMITTEE_LEAD') &&
                          !user?.committeePermissions?.includes('ESCALATION_HEAD');
                        return isHandlerOnly ? s !== 'CLOSED' : true;
                      })
                      .map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          handleUpdateStatus(s);
                          setShowStatusModal(false);
                        }}
                        className={`w-full p-5 rounded-[28px] text-[11px] font-black uppercase tracking-widest transition-all text-left flex items-center justify-between group ${
                          complaint.status === s 
                            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 translate-x-1' 
                            : s === 'CLOSED'
                            ? 'bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white'
                            : 'bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${complaint.status === s ? 'bg-white' : 'bg-current opacity-20'}`} />
                          {s.replace(/_/g, ' ')}
                        </div>
                        {complaint.status === s ? <CheckCircle size={16} /> : <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-all" />}
                      </button>
                    ))}
                  </div>

                  <p className="mt-8 text-[10px] font-bold text-slate-400 text-center uppercase tracking-tighter">
                    Status updates trigger automated audit events & stakeholder notifications.
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default InvestigationDetails;

