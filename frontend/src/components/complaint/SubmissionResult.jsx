import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Check, Copy, QrCode } from 'lucide-react';

const SubmissionResult = ({ result, copiedType, onCopy }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-6 space-y-8"
    >
      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[32px] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/20 animate-bounce-subtle">
        <CheckCircle size={40} />
      </div>
      <div className="space-y-4">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Report Submitted</h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">
          Your complaint has been successfully received by the committee. Please save your credentials to track its progress.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
        <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-200/60 shadow-inner group relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Tracking ID</p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-lg font-black text-slate-900 tracking-tight font-mono">{result.trackingId}</span>
              <button
                onClick={() => onCopy(result.trackingId, 'id')}
                className={`p-2 rounded-xl transition-all ${copiedType === 'id' ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400 hover:text-indigo-600 shadow-sm hover:shadow'
                  }`}
              >
                {copiedType === 'id' ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-200/60 shadow-inner group relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Security PIN</p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-lg font-black text-slate-900 tracking-tight font-mono">{result.rawPin}</span>
              <button
                onClick={() => onCopy(result.rawPin, 'pin')}
                className={`p-2 rounded-xl transition-all ${copiedType === 'pin' ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400 hover:text-indigo-600 shadow-sm hover:shadow'
                  }`}
              >
                {copiedType === 'pin' ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={() => {
            const token = localStorage.getItem('token');
            window.location.href = token ? '/dashboard' : '/';
          }}
          className="w-full sm:w-auto px-10 py-4 bg-slate-900 text-white rounded-[24px] font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
        >
          Done
        </button>
        <button className="w-full sm:w-auto px-10 py-4 bg-white border border-slate-200 text-slate-900 rounded-[24px] font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-sm">
          <QrCode size={18} />
          Save Voucher
        </button>
      </div>
    </motion.div>
  );
};

export default SubmissionResult;
