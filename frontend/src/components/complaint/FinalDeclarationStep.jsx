import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Shield, Lock, AlertCircle, ChevronLeft, Send } from 'lucide-react';

const FinalDeclarationStep = ({ 
  formData, 
  setFormData, 
  declarationChecked, 
  setDeclarationChecked, 
  isCommitteeMember, 
  loading, 
  onSubmit, 
  onBack 
}) => {
  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <ShieldCheck size={18} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Final Declaration</h2>
      </div>

      <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200/60 shadow-inner relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-600/10 transition-colors" />
        <div className="relative z-10 space-y-4">
          <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
            By submitting this report, you confirm that the information provided is accurate and truthful to the best of your knowledge.
          </p>
          <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm">
            <label className="flex items-start gap-3 cursor-pointer group/label">
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-[#3b82f6] focus:ring-[#3b82f6]/20 transition-all"
                  checked={declarationChecked}
                  onChange={(e) => setDeclarationChecked(e.target.checked)}
                />
              </div>
              <span className="text-[12px] font-bold text-slate-700 leading-tight group-hover/label:text-indigo-600 transition-colors">
                I declare that the information provided is true and I am reporting this in good faith.
              </span>
            </label>
          </div>
        </div>
      </div>

      {isCommitteeMember && (
        <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-start gap-4 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Shield size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-snug">Committee Confidentiality Protection</p>
            <p className="text-[12px] text-slate-600 font-medium leading-relaxed mt-1">
              As a committee member, your report is <span className="text-indigo-600 font-bold">automatically escalated</span> to the Escalation Head. This keeps your identity protected from local committee triage.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between p-6 bg-indigo-50/50 border border-indigo-100/30 rounded-3xl shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Lock size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Report Anonymously</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Hide your identity from management</p>
          </div>
        </div>
        <button
          onClick={() => setFormData({ ...formData, isAnonymous: !formData.isAnonymous })}
          className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative border ${formData.isAnonymous ? 'bg-indigo-600 border-indigo-700' : 'bg-slate-200 border-slate-300'
            }`}
        >
          <motion.div
            animate={{ x: formData.isAnonymous ? 24 : 0 }}
            className="w-4 h-4 bg-white rounded-full shadow-sm"
          />
        </button>
      </div>

      <div className="flex items-center justify-between p-6 bg-rose-50/50 border border-rose-100/30 rounded-3xl shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Mark as Sensitive Case</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Direct escalation to compliance head</p>
          </div>
        </div>
        <button
          onClick={() => setFormData({ ...formData, isSensitive: !formData.isSensitive })}
          className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative border ${formData.isSensitive ? 'bg-rose-600 border-rose-700' : 'bg-slate-200 border-slate-300'
            }`}
        >
          <motion.div
            animate={{ x: formData.isSensitive ? 24 : 0 }}
            className="w-4 h-4 bg-white rounded-full shadow-sm"
          />
        </button>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-slate-50">
        <button
          onClick={onBack}
          className="h-11 px-6 text-slate-500 hover:text-slate-900 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <ChevronLeft size={16} />
          <span>Back</span>
        </button>

        <button
          onClick={onSubmit}
          className="h-11 px-10 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-black rounded-xl shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider overflow-hidden group relative"
          disabled={!declarationChecked || loading}
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Submit Report</span>
              <Send size={16} />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default FinalDeclarationStep;
