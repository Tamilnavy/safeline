import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, ShieldCheck, Clock, AlertTriangle, Calendar, MapPin, Tag, User, Shield, Download, History, FileText, CheckCircle } from 'lucide-react';
import Badge from '../ui/Badge';
import MessageBoard from '../ui/MessageBoard';
import api from '../../services/api';

const ComplaintDetailsModal = ({ 
  isOpen, 
  onClose, 
  complaint, 
  userRole,
  getStatusVariant: propGetStatusVariant,
  getPriorityVariant: propGetPriorityVariant
}) => {
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Fallback status variant logic if prop is not provided
  const getStatusVariant = (status) => {
    if (typeof propGetStatusVariant === 'function') return propGetStatusVariant(status);
    
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED': return 'success';
      case 'ON_HOLD':
      case 'SUBMITTED':
      case 'TRIAGED': return 'warning';
      case 'IN_PROGRESS':
      case 'INVESTIGATION':
      case 'ASSIGNED': return 'primary';
      case 'REOPENED': return 'danger';
      default: return 'warning';
    }
  };

  // Fallback priority variant logic
  const getPriorityVariant = (priority) => {
    if (typeof propGetPriorityVariant === 'function') return propGetPriorityVariant(priority);
    
    switch (priority) {
      case 'URGENT':
      case 'HIGH': return 'danger';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'warning';
    }
  };

  useEffect(() => {
    if (isOpen && complaint?.id) {
      fetchActivities();
    }
  }, [isOpen, complaint?.id]);

  const fetchActivities = async () => {
    setLoadingActivities(true);
    try {
      const resp = await api.get(`/complaints/${complaint.id}/activities`);
      setActivities(resp.data);
    } catch (err) {
      console.error('Failed to fetch activity logs');
    } finally {
      setLoadingActivities(false);
    }
  };

  if (!isOpen || !complaint) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-white flex flex-col"
        >
          {/* Header */}
          <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{complaint.trackingId}</span>
                <Badge variant={getStatusVariant(complaint.status)}>{complaint.status}</Badge>
                {complaint.type === 'SENSITIVE' && (
                  <Badge variant="danger" className="flex items-center gap-1">
                    <AlertTriangle size={10} />
                    SENSITIVE
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{complaint.title}</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-slate-900 shadow-sm hover:shadow"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Details */}
              <div className="lg:col-span-2 space-y-8">
                {/* Sensitive Warning Card */}
                {complaint.type === 'SENSITIVE' && (
                  <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-rose-900">Sensitive Investigation</h3>
                      <p className="text-xs text-rose-700/80 leading-relaxed mt-1 font-medium">
                        This case is marked as high-priority and sensitive. Access is restricted to authorized committee members only.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={14} />
                    Incident Description
                  </h3>
                  <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium relative z-10">
                      {complaint.description}
                    </p>
                  </div>
                </div>

                {/* Meta Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { icon: Calendar, label: 'Submitted', value: new Date(complaint.createdAt).toLocaleDateString() },
                    { icon: Tag, label: 'Category', value: complaint.categoryName },
                    { icon: MapPin, label: 'Location', value: complaint.location || 'Not specified' },
                    { icon: Shield, label: 'Priority', value: complaint.priority || 'PENDING' }
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                      <item.icon size={14} className="text-slate-400 mb-2" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                      <p className="text-xs font-black text-slate-900 truncate mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Evidence */}
                {complaint.evidence && complaint.evidence.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck size={14} />
                      Evidence Files ({complaint.evidence.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {complaint.evidence.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-white rounded-2xl border border-slate-100 transition-all group shadow-sm hover:shadow-md">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                              <FileText size={16} />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 truncate max-w-[150px]">{file.fileName}</span>
                          </div>
                          <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                            <Download size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Messages & Activity */}
              <div className="space-y-8">
                <div className="space-y-4">
                   <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={14} />
                    Confidential Chat
                  </h3>
                  <div className="h-[300px] border border-slate-100 rounded-[32px] overflow-hidden shadow-inner bg-slate-50/30">
                    <MessageBoard complaintId={complaint.id} initialMessages={[]} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <History size={14} />
                    Activity Logs
                  </h3>
                  <div className="space-y-3">
                    {loadingActivities ? (
                      <div className="p-4 text-center text-xs text-slate-400">Loading history...</div>
                    ) : activities.length > 0 ? (
                      activities.map((log, idx) => (
                        <div key={idx} className="flex gap-3 relative group">
                          {idx !== activities.length - 1 && (
                            <div className="absolute left-[7px] top-px bottom-[-12px] w-px bg-slate-100" />
                          )}
                          <div className={`mt-1.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm ${
                            log.activityType === 'STATUS_CHANGE' ? 'bg-orange-400' : 'bg-blue-400'
                          }`}>
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-slate-900 leading-tight">{log.description}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                              {new Date(log.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                        <p className="text-[10px] font-medium text-slate-400 italic">No activity recorded yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ComplaintDetailsModal;
