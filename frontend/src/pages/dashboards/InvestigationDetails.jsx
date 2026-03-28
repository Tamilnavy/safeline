import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import MessageBoard from '../../components/ui/MessageBoard';
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
  Search as SearchIcon
} from 'lucide-react';

const InvestigationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [activities, setActivities] = useState([]);
  const [investigators, setInvestigators] = useState([]);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
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
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600">{complaint.status}</span>
            </div>
          </div>
        </div>

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

              {/* Summary Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                {[
                  { icon: Calendar, label: 'Submitted', value: new Date(complaint.createdAt).toLocaleDateString() },
                  { icon: Tag, label: 'Category', value: complaint.categoryName || 'General Ethics' },
                  { icon: MapPin, label: 'Location', value: complaint.location || 'N/A' },
                  { icon: Shield, label: 'Priority', value: complaint.priority || 'UNRATED' }
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

            {/* Communication Center */}
            <div className="bg-white rounded-[40px] shadow-2xl shadow-indigo-500/5 border border-white overflow-hidden flex flex-col min-h-[550px]">
              <div className="px-10 py-6 border-b border-slate-100 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="text-md font-black text-slate-900 tracking-tight">Investigation Communication</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">End-to-end encrypted channel with reporter</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 bg-slate-50/20">
                <MessageBoard complaintId={complaint.id} initialMessages={[]} isStaff={true} />
              </div>
            </div>
          </motion.div>

          {/* Right Column: Progress & Control */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-8"
          >
            {/* Management Oversight Card (For Leads/Heads only) */}
            {(user?.committeePermissions?.includes('COMMITTEE_LEAD') || user?.committeePermissions?.includes('ESCALATION_HEAD')) && (
              <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-indigo-500/5 border border-white relative overflow-hidden ring-1 ring-indigo-50/50 mb-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                      <Users size={18} />
                    </div>
                    <h3 className="text-md font-black text-slate-900 tracking-tight">Staff Oversight</h3>
                  </div>
                  <button 
                    onClick={() => setShowAssignMenu(!showAssignMenu)}
                    className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm ring-1 ring-indigo-100"
                  >
                    <UserPlus size={16} />
                  </button>
                </div>

                <div className="p-6 rounded-[32px] bg-slate-50/50 border border-slate-100 relative group transition-all hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Assignee</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-500 border border-slate-100 font-black text-lg">
                      {(complaint.assignedToFullName || complaint.assignedToUsername || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-tight">
                        {complaint.assignedToFullName || complaint.assignedToUsername || 'Not Assigned'}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-tight">
                        {complaint.assignedToCommitteeRole?.replace(/_/g, ' ') || 'UNASSIGNED ROLE'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Quick-Update (ENABLED for Leads/Heads) */}
                <div className="mt-6 p-6 rounded-[32px] bg-indigo-50/30 border border-indigo-100/50">
                  <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Lifecycle Progress</p>
                  <div className="grid grid-cols-1 gap-2">
                    {['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleUpdateStatus(s)}
                        className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          complaint.status === s 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                            : 'bg-white text-indigo-600 border border-indigo-100 hover:border-indigo-400 outline-none'
                        }`}
                      >
                        {s.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sliding Assign Menu */}
                <AnimatePresence>
                  {showAssignMenu && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-6 pt-6 border-t border-slate-100 overflow-hidden"
                    >
                      <div className="relative mb-4">
                        <SearchIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text"
                          placeholder="Search Investigators..."
                          value={assignSearch}
                          onChange={(e) => setAssignSearch(e.target.value)}
                          className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all"
                        />
                      </div>
                      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {investigators
                          .filter(inv => 
                            (inv.fullName || inv.username).toLowerCase().includes(assignSearch.toLowerCase())
                          )
                          .map(inv => (
                            <button
                              key={inv.id}
                              onClick={() => handleAssign(inv.id)}
                              className="w-full p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-300 hover:shadow-md transition-all text-left flex items-center gap-3 group"
                            >
                              <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 font-bold text-xs">
                                {(inv.fullName || inv.username).charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <p className="text-[11px] font-black text-slate-900 truncate">{inv.fullName || inv.username}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{inv.committeePermissions?.[0]?.replace(/_/g, ' ') || 'STAFF'}</p>
                              </div>
                              {complaint.assignedToId === inv.id && (
                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                              )}
                            </button>
                          ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Professional Timeline */}
            <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-indigo-500/5 border border-white relative overflow-hidden">
              <h3 className="text-md font-black text-slate-900 mb-10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <History size={16} />
                </div>
                Investigation Progress
              </h3>
              <div className="space-y-10 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                {activities.map((act, i) => {
                  const isConflictOfInterest = user?.id === complaint.reporterId;

                  const maskIdentity = (detail) => {
                    if (!detail) return '';
                    if (!isConflictOfInterest) return detail;

                    // Strict masking for reporters (even if they are committee members)
                    if (detail.includes('Status updated to')) return detail.split(' by ')[0];
                    if (detail.includes('assigned case to')) return 'Case assigned for investigation';
                    if (detail.includes('Case triaged by')) return 'Case triaged for priority';
                    return detail;
                  };

                  return (
                    <div key={i} className="relative pl-10 group">
                      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-md z-10 transition-transform ${i === 0 ? 'bg-[#3b82f6] ring-4 ring-blue-50 scale-110' : 'bg-slate-200 group-hover:scale-125'
                        }`}>
                        {i === 0 && <Clock size={10} className="text-white mx-auto mt-[4px]" />}
                      </div>
                      <div>
                        <p className={`text-[12px] font-black uppercase tracking-tight transition-colors ${i === 0 ? 'text-[#3b82f6]' : 'text-slate-800'
                          }`}>
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

            {/* Shield Info */}
            <div className="p-8 bg-slate-900 rounded-[40px] shadow-2xl flex items-center gap-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/10 transition-all duration-700" />
              <div className="w-12 h-12 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-white flex-shrink-0 animate-pulse">
                <ShieldCheck size={26} />
              </div>
              <div>
                <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-1">Encrypted Intelligence</h4>
                <p className="text-[10px] text-slate-400 font-bold leading-relaxed underline decoration-slate-700 decoration-dashed underline-offset-4">Compliant with Global Privacy Protocols</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default InvestigationDetails;
