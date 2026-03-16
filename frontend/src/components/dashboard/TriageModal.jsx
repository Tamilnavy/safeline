import React, { useState } from 'react';
import { X, ShieldAlert, Tag, CheckCircle } from 'lucide-react';

const TriageModal = ({ isOpen, onClose, complaint, onTriage }) => {
  const [priority, setPriority] = useState(complaint?.priority || 'NORMAL');
  const [classification, setClassification] = useState(complaint?.classification || 'GENERAL');
  const [status, setStatus] = useState(complaint?.status || 'TRIAGED');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'];
  const classifications = [
    'GENERAL', 'HR_AND_EMPLOYEE', 'SAFETY_AND_HEALTH', 
    'POLICY_VIOLATION', 'LEGAL_AND_COMPLIANCE', 
    'FINANCIAL_INFRACTION', 'HARASSMENT_OR_DISCRIMINATION'
  ];

  const handleTriage = async () => {
    setLoading(true);
    try {
      await onTriage(complaint.id, { priority, classification, status });
      onClose();
    } catch (err) {
      alert('Failed to triage complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg p-8 rounded-2xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
          <X size={20} />
        </button>

        <header className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl shadow-sm border border-indigo-100">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Case Triage</h3>
              <p className="text-slate-500 text-sm font-medium">Set priority and classify the report.</p>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
              <Tag size={12} className="text-indigo-600" />
              Priority Level
            </label>
            <select 
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer" 
              value={priority} 
              onChange={(e) => setPriority(e.target.value)}
            >
              {priorities.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
              <ShieldAlert size={12} className="text-indigo-600" />
              Classification
            </label>
            <select 
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer" 
              value={classification} 
              onChange={(e) => setClassification(e.target.value)}
            >
              {classifications.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
              <CheckCircle size={12} className="text-indigo-600" />
              Update Status
            </label>
            <select 
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer" 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="SUBMITTED">STAY AT SUBMITTED</option>
              <option value="TRIAGED">TRIAGED (READY FOR ASSIGNMENT)</option>
              <option value="ASSIGNED">SKIP TO ASSIGNED</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-10">
          <button 
            onClick={onClose} 
            className="h-12 px-6 text-slate-500 font-bold text-sm hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleTriage} 
            disabled={loading}
            className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle size={18} />
                <span>Complete Triage</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TriageModal;
