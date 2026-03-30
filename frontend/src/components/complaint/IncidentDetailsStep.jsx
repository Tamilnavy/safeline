import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Tag, MapPin } from 'lucide-react';

const IncidentDetailsStep = ({ formData, setFormData, categories, onNext }) => {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-4 mb-2">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">What happened?</h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[13px] font-bold text-slate-700 ml-1">Complaint Title *</label>
          <input
            type="text"
            className="w-full h-12 px-5 bg-white border border-slate-200/60 rounded-2xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-sm"
            placeholder="Brief summary of the issue"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-700 ml-1">Category *</label>
            <div className="relative">
              <select
                className="w-full h-12 px-5 bg-white border border-slate-200/60 rounded-2xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer shadow-sm"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                <option value="">Select a category...</option>
                {Array.isArray(categories) && categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <Tag className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-700 ml-1">Location / Platform</label>
            <div className="relative">
              <input
                type="text"
                className="w-full h-12 px-5 bg-white border border-slate-200/60 rounded-2xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-sm"
                placeholder="e.g. 5th Floor office, etc."
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              <MapPin className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-slate-50">
        <button
          onClick={onNext}
          className="h-11 px-8 bg-[#3b82f6] hover:bg-blue-600 text-white text-[13px] font-bold rounded-xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
          disabled={!formData.title || !formData.categoryId}
        >
          <span>Next Step</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};

export default IncidentDetailsStep;
