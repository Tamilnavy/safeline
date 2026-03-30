import React from 'react';
import { History, CheckCircle, Clock } from 'lucide-react';

const InvestigationTimeline = ({ activities, complaint, user }) => {
  const isReporter = user?.id === complaint?.reporterId || (user?.username && complaint?.reporterUsername && user.username === complaint.reporterUsername);
  const isStaff = user?.committeePermissions && user.committeePermissions.length > 0;
  // Mask for ALL reporters (even if they are staff) and non-staff viewers.
  const shouldMask = !isStaff || isReporter;

  const maskIdentity = (detail) => {
    if (!detail || !shouldMask) return detail;
    let masked = detail;

    const lower = masked.toLowerCase();
    const byPatterns = [' by ', ' performed by ', ' created by '];
    for (const p of byPatterns) {
      const idx = lower.indexOf(p);
      if (idx !== -1) {
        masked = masked.substring(0, idx);
        break;
      }
    }

    masked = masked.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();

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
    <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-indigo-500/5 border border-white relative overflow-hidden">
      <h3 className="text-md font-black text-slate-900 mb-10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
          <History size={16} />
        </div>
        Investigation Progress
      </h3>
      <div className="space-y-10 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar pr-4 pb-4">
        {activities.map((act, i) => (
          <div key={i} className="relative pl-10 group">
            <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-md z-10 transition-transform ${act.activityType === 'RESOLUTION_PENDING_REVIEW'
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
        ))}
      </div>
    </div>
  );
};

export default InvestigationTimeline;
