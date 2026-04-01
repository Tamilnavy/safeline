import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, CheckCircle, ArrowRight } from 'lucide-react';

const StatusUpdateModal = ({ show, setShow, complaint, user, handleUpdateStatus }) => {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
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
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update Case Status</p>
                  </div>
                </div>
                <button
                  onClick={() => setShow(false)}
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
                    const isHandler = user?.committeePermissions?.includes('COMPLAINT_HANDLER');
                    const isAssigned = user?.id === complaint.assignedToId;
                    
                    if (s === 'CLOSED') return isLead || isEscalation;
                    if (['UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED', 'ASSIGNED'].includes(s)) {
                      return isAssigned || isLead || isEscalation || isHandler;
                    }
                    return true;
                  })
                  .map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        handleUpdateStatus(s);
                        setShow(false);
                      }}
                      className={`w-full p-5 rounded-[28px] text-[11px] font-black uppercase tracking-widest transition-all text-left flex items-center justify-between group ${complaint.status === s
                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 translate-x-1'
                        : s === 'CLOSED'
                          ? 'bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white'
                          : 'bg-slate-50 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600'
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
  );
};

export default StatusUpdateModal;
