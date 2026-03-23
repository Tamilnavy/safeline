import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, ShieldCheck, Clock } from 'lucide-react';
import Badge from '../ui/Badge';
import MessageBoard from '../ui/MessageBoard';
import api from '../../services/api';

const ComplaintDetailsModal = ({ 
  isOpen, 
  onClose, 
  complaint, 
  userRole,
  getStatusVariant,
  getPriorityVariant
}) => {
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    if (isOpen && complaint?.id) {
      fetchActivities();
    }
  }, [isOpen, complaint?.id]);

  const fetchActivities = async () => {
    setLoadingActivities(true);
    try {
      const resp = await api.get(`/complaints/activities/${complaint.id}`);
      setActivities(resp.data);
    } catch (err) {
      console.error('Failed to fetch activity logs');
    } finally {
      setLoadingActivities(false);
    }
  };

  if (!complaint) return null;

  const isRestricted = ['INTAKE_OFFICER', 'EXECUTIVE'].includes(userRole);
  const isEmployee = userRole === 'EMPLOYEE';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            className="bg-white relative w-full h-full max-w-[95vw] max-h-[98vh] overflow-hidden flex flex-col rounded-2xl shadow-2xl border border-slate-200"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600" />
            <div className="h-16 px-8 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant ? getStatusVariant(complaint.status) : 'warning'}>
                    {complaint.status?.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest">{complaint.trackingId}</span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 flex min-h-0 bg-white">
              {/* Left Side: Details & Chat */}
              <div className="flex-[1.6] flex flex-col border-r border-slate-100 min-h-0">
                <div className="p-10 pb-6 overflow-y-auto max-h-[25%] border-b border-slate-50">
                  <div className="flex gap-10">
                    <div className="flex-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Subject</p>
                      <h3 className="text-xl font-bold text-slate-900 leading-tight">{complaint.title}</h3>
                    </div>
                    
                    <div className="flex-[2]">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description</p>
                      <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                        <p className="text-slate-700 text-xs font-medium leading-relaxed italic opacity-90">"{complaint.description}"</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 bg-slate-50/10">
                  <MessageBoard complaintId={complaint.id} isStaff={!isEmployee} />
                </div>
              </div>

              {/* Right Side: Progress & Timeline */}
              <div className="flex-1 bg-slate-50/30 p-8 overflow-y-auto">
                <div className="space-y-8">
                  {/* Case Info Cards */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Clock size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Submission Date</p>
                        <p className="text-sm font-bold text-slate-900">{new Date(complaint.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Category</p>
                        <p className="text-sm font-bold text-slate-900">{complaint.categoryName || 'General Ethics'}</p>
                      </div>
                    </div>
                  </div>

                    {/* Case Progress Timeline */}
                    <div className="pt-4">
                      <div className="flex items-center gap-2 mb-8">
                        <div className="w-6 h-6 rounded-full bg-slate-200/50 flex items-center justify-center">
                          <Clock size={12} className="text-slate-500" />
                        </div>
                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Case Progress</h4>
                      </div>
                      
                      {loadingActivities ? (
                        <div className="py-20 text-center animate-pulse text-slate-400 text-xs font-bold uppercase tracking-widest">
                          Syncing updates...
                        </div>
                      ) : (
                        <div className="max-h-[600px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-200">
                          <div className="space-y-8 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                            {activities.length === 0 ? (
                              <div className="pl-8 text-xs font-medium text-slate-400 italic">No activity yet recorded.</div>
                            ) : (
                              activities.map((act, i) => (
                                <div key={i} className="relative pl-8">
                                  <div className="absolute left-[3px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-indigo-500 z-10 shadow-sm" />
                                  <div>
                                    <p className="text-xs font-bold text-slate-800 mb-1 uppercase tracking-tight">
                                      {act.action.replace(/_/g, ' ')}
                                    </p>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter opacity-80">
                                      {new Date(act.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ComplaintDetailsModal;
