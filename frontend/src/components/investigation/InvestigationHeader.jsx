import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Settings } from 'lucide-react';

const InvestigationHeader = ({ complaint, isStaff, isReporter, user, setShowStatusModal, navigate }) => {
  return (
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

        {(isStaff && !isReporter && (
          user?.committeePermissions?.includes('COMMITTEE_LEAD') ||
          user?.committeePermissions?.includes('ESCALATION_HEAD') ||
          user?.committeePermissions?.includes('COMPLAINT_HANDLER') ||
          user?.id === complaint.assignedToId
        )) && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowStatusModal(true)}
            className="flex items-center gap-2 px-5 py-2 bg-rose-600 text-white rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all"
          >
            <Settings size={14} />
            {complaint.status === 'RESOLVED' && (user?.committeePermissions?.includes('COMMITTEE_LEAD') || user?.committeePermissions?.includes('ESCALATION_HEAD'))
              ? 'Finalize & Close Case'
              : 'Update Status'}
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default InvestigationHeader;
