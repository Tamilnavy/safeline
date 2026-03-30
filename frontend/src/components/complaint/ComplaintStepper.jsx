import React from 'react';
import { Check } from 'lucide-react';

const ComplaintStepper = ({ step, steps }) => {
  return (
    <div className="bg-slate-800/95 backdrop-blur-md rounded-t-3xl p-5 mb-0 relative z-20 shadow-xl overflow-hidden border-x border-t border-slate-700/50">
      <div className="flex justify-between items-center max-w-lg mx-auto px-4 relative z-10">
        {steps.map((s, idx) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step === s.id ? 'bg-[#3b82f6]/20 text-[#3b82f6] border-2 border-[#3b82f6] shadow-lg shadow-blue-500/20' :
                step > s.id ? 'bg-[#3b82f6] text-white' :
                  'bg-slate-700/50 text-slate-400 border border-slate-600/30'
              }`}>
              {step > s.id ? <Check size={14} strokeWidth={4} /> : s.id}
            </div>
            <span className={`text-[11px] font-bold tracking-tight transition-colors hidden sm:block ${step === s.id ? 'text-white' : 'text-slate-500'
              }`}>
              {s.label}
            </span>
            {idx < steps.length - 1 && (
              <div className="w-8 h-px bg-slate-800 mx-1 hidden md:block" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComplaintStepper;
