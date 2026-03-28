import { Check, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const CaseDeliveryProgress = ({ status, activities = [] }) => {
  const statusOrder = ['SUBMITTED', 'ASSIGNED', 'UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED', 'CLOSED'];
  
  const steps = [
    { key: 'SUBMITTED', label: 'Submitted', icon: Check, activityType: 'COMPLAINT_SUBMITTED' },
    { key: 'ASSIGNED', label: 'Assigned', icon: Check, activityType: 'INVESTIGATOR_ASSIGNED' },
    { key: 'UNDER_REVIEW', label: 'Under Review', icon: Check, activityType: 'STATUS_UPDATED', statusVal: 'UNDER_REVIEW' },
    { key: 'INVESTIGATING', label: 'Investigating', icon: Check, activityType: 'STATUS_UPDATED', statusVal: 'INVESTIGATING' },
    { key: 'RESOLVED', label: 'Resolved', icon: Check, activityType: 'STATUS_UPDATED', statusVal: 'RESOLVED' },
    { key: 'CLOSED', label: 'Closed', icon: Check, activityType: 'STATUS_UPDATED', statusVal: 'CLOSED' }
  ];

  // Map activities to steps to find timestamps
  const stepData = steps.map((step, index) => {
    // Look for the EXACT first time this milestone was reached
    let activity = activities.find(a => {
      const type = a.activityType;
      const detail = (a.detail || '').toUpperCase();
      const stepKey = step.key;
      const statusVal = step.statusVal || step.key;

      if (stepKey === 'SUBMITTED' && type === 'COMPLAINT_SUBMITTED') return true;
      if (stepKey === 'ASSIGNED' && (type === 'INVESTIGATOR_ASSIGNED' || detail.includes('ASSIGNED'))) return true;
      if (detail.includes(statusVal)) return true;
      return false;
    });

    return {
      ...step,
      timestamp: activity ? new Date(activity.timestamp) : null,
      isCompleted: statusOrder.indexOf(status) >= statusOrder.indexOf(step.key),
      isCurrent: status === step.key
    };
  });

  // Calculate durations between steps
  const getDuration = (start, end) => {
    if (!start || !end) return null;
    const diffMs = Math.abs(end - start);
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "< 1m";
    if (diffMins < 60) return `${diffMins}m`;
    
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ${diffMins % 60}m`;
    
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ${diffHrs % 24}h`;
  };

  const currentIndex = statusOrder.indexOf(status);

  return (
    <div className="w-full py-12 px-6 bg-white border border-slate-100 rounded-[40px] shadow-sm mb-10 overflow-hidden">
      <div className="w-full flex items-start relative pb-4">
        
        {/* The connecting lines & Duration Labels (CALCULATED TO MATCH FLEX-1 DOT CENTERS: 1/12 = 8.33%) */}
        <div className="absolute top-[20px] left-[8.33%] right-[8.33%] h-[4px] bg-slate-100 -z-0">
          {/* Progress fill */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(Math.max(0, currentIndex) / (steps.length - 1)) * 100}%` }}
            className="h-full bg-emerald-500 rounded-full"
          />

          {/* Centered Duration Labels */}
          <div className="absolute inset-0 pointer-events-none">
            {stepData.map((step, index) => {
              if (index === 0) return null;
              
              const isDone = currentIndex >= index;
              const duration = isDone && stepData[index-1].timestamp && stepData[index].timestamp
                ? getDuration(stepData[index-1].timestamp, stepData[index].timestamp)
                : null;

              if (!duration) return null;

              const segmentCount = steps.length - 1;
              const centerPercent = ((index - 0.5) / segmentCount) * 100;

              return (
                <div 
                  key={`dur-${step.key}`}
                  className="absolute -top-10 -translate-x-1/2 flex justify-center w-full max-w-0"
                  style={{ left: `${centerPercent}%` }}
                >
                  <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[12px] font-black text-slate-900 whitespace-nowrap bg-white/60 px-2 py-0.5 rounded-md"
                  >
                    {duration}
                  </motion.span>
                </div>
              );
            })}
          </div>
        </div>

        {stepData.map((step, index) => {
          const isDone = currentIndex >= index;
          const isCurrent = step.isCurrent;
          const isNext = currentIndex === index - 1;
          
          return (
            <div key={step.key} className="flex-1 flex flex-col items-center relative z-10">
              {/* Node (The Dot/Tick) */}
              <div className={`
                w-10 h-10 rounded-full border-4 border-white shadow-xl flex items-center justify-center transition-all duration-700 relative
                ${isDone ? 'bg-emerald-500' : 'bg-slate-100'}
                ${isCurrent ? 'ring-8 ring-emerald-500/10 scale-110' : ''}
              `}>
                {isDone ? (
                  <Check size={18} className="text-white relative z-10" strokeWidth={3} />
                ) : (
                  <div className={`w-2.5 h-2.5 rounded-full ${isNext ? 'bg-slate-400 animate-pulse' : 'bg-slate-300'}`} />
                )}
              </div>

              {/* Label */}
              <div className="mt-8 text-center flex flex-col items-center w-full px-1">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step.label}
                </p>
                {step.timestamp && (
                  <p className="text-[10px] font-bold text-emerald-700 mt-2 flex items-center justify-center gap-1.5 bg-emerald-50/50 py-1 px-2.5 rounded-full border border-emerald-100/50 shadow-sm whitespace-nowrap">
                    <Clock size={11} className="text-emerald-500" strokeWidth={3} />
                    {step.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CaseDeliveryProgress;
