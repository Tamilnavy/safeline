import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, FileUp, CloudUpload, FileText, ChevronLeft, ArrowRight } from 'lucide-react';

const DescriptionEvidenceStep = ({ formData, setFormData, files, onFileChange, onNext, onBack }) => {
  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
          <AlertTriangle size={18} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Incident Description</h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center ml-1 mb-2">
            <label className="text-[13px] font-bold text-slate-700">Detailed Description *</label>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 shadow-sm">
              {formData.description.length} / 2000
            </span>
          </div>
          <textarea
            className="w-full min-h-[110px] px-7 py-5 bg-white border border-slate-200/60 rounded-[28px] focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400 leading-relaxed shadow-sm hover:shadow-md"
            placeholder="Please provide specifics: who, what, when, where, and why. Be factual."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-50">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#3b82f6]">
              <FileUp size={18} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Evidence Map</h3>
          </div>

          <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
            Upload any documents, screenshots, or files that support your report. If you are reporting anonymously, <span className="font-bold text-slate-800">ensure your name is not within the files themselves.</span>
          </p>

          <motion.div
            whileHover={{ scale: 1.002, backgroundColor: '#fcfdff' }}
            className="border-2 border-dashed border-slate-200 p-8 text-center rounded-[24px] bg-slate-50/30 cursor-pointer group transition-all relative overflow-hidden"
            onClick={() => document.getElementById('file-input').click()}
          >
            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-all duration-300 ring-1 ring-slate-100">
              <CloudUpload size={24} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <p className="text-[14px] font-bold text-slate-700 mb-0.5">
              <span className="text-slate-900">Click to upload</span> or drag and drop
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
              PDF, PNG, JPG, or MP4 (Max 50MB)
            </p>
            <input
              id="file-input"
              type="file"
              multiple
              className="hidden"
              onChange={onFileChange}
            />
          </motion.div>

          {files.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-sm relative group overflow-hidden">
                  <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors" />
                  <FileText className="text-[#3b82f6] shrink-0" size={16} />
                  <span className="text-[11px] font-bold text-slate-700 truncate">{file.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
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
          onClick={onNext}
          className="h-11 px-8 bg-[#3b82f6] hover:bg-blue-600 text-white text-[13px] font-bold rounded-xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group"
          disabled={!formData.description}
        >
          <span>Next Step</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};

export default DescriptionEvidenceStep;
