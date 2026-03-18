import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, ShieldCheck } from 'lucide-react';
import Badge from '../ui/Badge';
import MessageBoard from '../ui/MessageBoard';

const ComplaintDetailsModal = ({ 
  isOpen, 
  onClose, 
  complaint, 
  userRole,
  getStatusVariant,
  getPriorityVariant
}) => {
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white relative w-full h-full max-w-6xl max-h-[85vh] overflow-hidden flex flex-col rounded-2xl shadow-2xl border border-slate-200"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600" />
            <div className="h-16 px-8 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant ? getStatusVariant(complaint.status) : 'warning'}>
                    {complaint.status?.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{complaint.trackingId}</span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 flex min-h-0 bg-white">
              <div className="flex-[0.8] p-10 border-r border-slate-100 overflow-y-auto">
                <div className="mb-10">
                  <h3 className="text-2xl font-bold text-slate-900 leading-tight mb-4 uppercase">{complaint.title}</h3>
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl shadow-inner">
                    <p className="text-slate-600 font-medium leading-relaxed italic">"{complaint.description}"</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</p>
                    <p className="font-semibold text-slate-900">{complaint.categoryName || (isEmployee ? 'General Ethics' : 'General')}</p>
                  </div>
                  {!isEmployee && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Classification</p>
                      <p className="font-bold text-indigo-600">{complaint.classification?.replace(/_/g, ' ') || 'GENERAL'}</p>
                    </div>
                  )}
                  {getPriorityVariant && !isEmployee && (
                     <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Priority</p>
                        <Badge variant={getPriorityVariant(complaint.priority)}>{complaint.priority || 'NORMAL'}</Badge>
                     </div>
                  )}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{isEmployee ? 'Submission Date' : 'Received'}</p>
                    <p className="font-bold text-slate-900">{new Date(complaint.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex-[1.2] flex flex-col min-h-0 bg-slate-50/30">
                {!isRestricted ? (
                  <>
                    <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center gap-2 shadow-sm">
                      <MessageSquare size={16} className="text-indigo-600" />
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-900">
                        {isEmployee ? 'Secure Communication Log' : 'Secure Investigation Log'}
                      </span>
                    </div>
                    <div className="flex-1 min-h-0">
                      <MessageBoard complaintId={complaint.id} isStaff={!isEmployee} />
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 p-12">
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                      <ShieldCheck size={32} className="text-slate-200" />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-2">Restricted Access</h4>
                    <p className="text-sm text-center font-medium max-w-xs leading-relaxed">
                      Chat and investigation details are currently restricted for your access level.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ComplaintDetailsModal;
