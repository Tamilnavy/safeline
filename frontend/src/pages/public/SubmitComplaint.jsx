import { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Image,
  CheckCircle,
  Copy,
  QrCode,
  ArrowRight,
  ShieldCheck,
  FileText,
  MapPin,
  Tag,
  Users,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Check,
  AlertTriangle,
  FileUp,
  CloudUpload
} from 'lucide-react';

const SubmitComplaint = () => {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    location: '',
    isAnonymous: true,
    assignToRole: ''
  });
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copiedType, setCopiedType] = useState(null); // 'id' or 'pin'

  useEffect(() => {
    fetchCategories();
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      setFormData(prev => ({ ...prev, isAnonymous: false }));
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const resp = await api.get('/complaints/categories');
      setCategories(resp.data);
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleSubmit = async () => {
    if (!declarationChecked) return;
    setLoading(true);
    setError('');
    try {
      const data = new FormData();
      data.append('request', JSON.stringify({
        ...formData,
        anonymous: formData.isAnonymous,
        assignToRole: formData.assignToRole || null
      }));

      files.forEach(file => {
        data.append('files', file);
      });

      const resp = await api.post('/complaints/submit', data);
      setResult(resp.data);
      setStep(4);
    } catch (err) {
      setError('Submission failed. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const steps = [
    { id: 1, label: 'Incident Details' },
    { id: 2, label: 'Details' },
    { id: 3, label: 'Evidence & Review' }
  ];

  return (
    <div className="min-h-screen bg-[#f4f7ff] pb-24 pt-12 px-6 flex flex-col items-center">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="w-full max-w-2xl relative"
      >
        {/* Darker Stepper Header - Reverted to preferred tint */}
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
                  <div className="w-8 h-[1px] bg-slate-800 mx-1 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Container White Card - Subtler curves */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.1 }}
          className="bg-white rounded-b-3xl rounded-t-none -mt-6 pt-16 pb-12 px-8 md:px-12 shadow-2xl shadow-indigo-500/10 border border-white relative z-10"
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
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
                          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
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

                  {/* Assign To Role */}
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-700 ml-1">Assign To Role</label>
                    <div className="relative">
                      <select
                        className="w-full h-12 px-5 bg-white border border-slate-200/60 rounded-2xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer shadow-sm"
                        value={formData.assignToRole}
                        onChange={(e) => setFormData({ ...formData, assignToRole: e.target.value })}
                      >
                        <option value="">Select who handles this...</option>
                        <option value="HR">HR — Human Resources / Management</option>
                        <option value="ADMIN">Admin — Organisation Administrator</option>
                      </select>
                      <Users className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-50">
                  <button
                    onClick={() => setStep(2)}
                    className="h-11 px-8 bg-[#3b82f6] hover:bg-blue-600 text-white text-[13px] font-bold rounded-xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                    disabled={!formData.title || !formData.categoryId}
                  >
                    <span>Next Step</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#3b82f6] shadow-sm ring-1 ring-blue-100">
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
                      <p className="text-[11px] text-slate-400 font-medium tracking-tight mt-1">
                        PDF, PNG, JPG or DOCX (max. 15MB)
                      </p>

                      <input id="file-input" type="file" multiple hidden onChange={handleFileChange} />

                      {files.length > 0 && (
                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3b82f6] text-white text-[11px] font-bold shadow-lg shadow-blue-500/20 animate-in zoom-in">
                          <CheckCircle size={14} />
                          <span>{files.length} documents attached</span>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-slate-50">
                  <button onClick={() => setStep(1)} className="h-11 px-8 flex items-center justify-center gap-2 border-2 border-slate-900 text-slate-900 font-bold text-[13px] rounded-xl hover:bg-slate-50 transition-all active:scale-95">
                    <ChevronLeft size={16} />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="h-11 px-8 bg-[#3b82f6] hover:bg-blue-600 text-white text-[13px] font-bold rounded-xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group"
                    disabled={!formData.description}
                  >
                    <span>Last Step</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-8 pt-4">
                  {/* Identity / Anonymity Section */}
                  <div 
                    className={`p-6 rounded-[32px] border flex items-start gap-4 shadow-sm mx-1 transition-all duration-300 ${
                      formData.isAnonymous ? 'bg-[#f8faff] border-blue-100' : 'bg-emerald-50 border-emerald-100'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg ${
                      formData.isAnonymous ? 'bg-[#9333ea] shadow-purple-500/20' : 'bg-emerald-600 shadow-emerald-500/20'
                    }`}>
                      {formData.isAnonymous ? <ShieldCheck size={20} className="text-white" strokeWidth={3} /> : <Check size={20} className="text-white" strokeWidth={3} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-[15px] font-bold text-slate-900">
                          {formData.isAnonymous ? 'Submit Anonymously' : 'Submit as Identified Reporter'}
                        </h4>
                        
                        {/* Toggle - Only show if logged in */}
                        {localStorage.getItem('token') && (
                          <div 
                            className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${formData.isAnonymous ? 'bg-slate-300' : 'bg-emerald-500'}`}
                            onClick={() => setFormData({...formData, isAnonymous: !formData.isAnonymous})}
                          >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.isAnonymous ? 'left-1' : 'right-1'}`} />
                          </div>
                        )}
                      </div>
                      <p className="text-[12px] text-slate-500 font-medium leading-[1.6]">
                        {formData.isAnonymous 
                          ? "Your identity will be strictly hidden. Your employer will not know who submitted this report."
                          : `You are submitting as a logged-in member. Your identity will be visible to investigators.`}
                      </p>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 ml-2 pt-2">Declaration</h3>

                  {/* High-Fidelity Declaration Box - Fixed Alignment */}
                  <div
                    className="p-6 rounded-[32px] bg-white border border-slate-200 flex items-start gap-5 cursor-pointer group hover:border-blue-400 transition-all duration-300 shadow-sm mx-1"
                    onClick={() => setDeclarationChecked(!declarationChecked)}
                  >
                    <div className={`mt-0.5 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-500 ${declarationChecked ? 'bg-[#3b82f6] border-[#3b82f6]' : 'bg-white border-slate-300 group-hover:border-blue-500'
                      }`}>
                      {declarationChecked && <CheckCircle size={18} className="text-white" strokeWidth={3} />}
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[14px] font-bold text-slate-800 leading-tight select-none">
                        I declare that the information provided is true and correct to the best of my knowledge.
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium leading-relaxed select-none">
                        Submitting false or malicious reports intentionally may be subject to disciplinary action depending on your organization's policies.
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-[12px] font-bold">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex justify-between pt-6 border-t border-slate-50">
                  <button onClick={() => setStep(2)} className="h-11 px-8 flex items-center justify-center gap-2 border-2 border-slate-900 text-slate-900 font-bold text-[13px] rounded-xl hover:bg-slate-50 transition-all active:scale-95">
                    <ChevronLeft size={16} />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="h-11 px-10 bg-[#3b82f6] hover:bg-blue-600 text-white text-[13px] font-bold rounded-xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
                    disabled={loading || !declarationChecked}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Submit Secure Report</span>
                        <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && result && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-16 h-16 rounded-full bg-blue-50 text-[#3b82f6] flex items-center justify-center mx-auto mb-6 ring-1 ring-blue-100 shadow-xl shadow-blue-500/10 animate-in zoom-in duration-500">
                  <CheckCircle size={32} />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Success!</h2>
                <p className="text-slate-500 text-sm font-medium mb-8 max-w-sm mx-auto leading-relaxed">Report encrypted. Save these credentials safely.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="p-5 bg-slate-50 rounded-[32px] border border-slate-100 group">
                    <div className="flex justify-between items-center mb-2 mx-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tracking ID</p>
                      {copiedType === 'id' && <span className="text-[10px] font-bold text-blue-600 animate-bounce">Copied!</span>}
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm transition-all group-hover:shadow-md">
                      <span className="font-mono text-lg font-bold text-blue-600 tracking-wider transition-all">{result.trackingId}</span>
                      <button onClick={() => copyToClipboard(result.trackingId, 'id')} className="p-2 text-slate-400 hover:text-blue-600 transition-all active:scale-90">
                        {copiedType === 'id' ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="p-5 bg-slate-50 rounded-[32px] border border-slate-100 group">
                    <div className="flex justify-between items-center mb-2 mx-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Security PIN</p>
                      {copiedType === 'pin' && <span className="text-[10px] font-bold text-emerald-600 animate-bounce">Copied!</span>}
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm transition-all group-hover:shadow-md">
                      <span className="font-mono text-lg font-bold text-emerald-600 tracking-wider transition-all">{result.rawPin}</span>
                      <button onClick={() => copyToClipboard(result.rawPin, 'pin')} className="p-2 text-slate-400 hover:text-emerald-600 transition-all active:scale-90">
                        {copiedType === 'pin' ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={() => window.location.href = '/track'} className="h-12 px-8 bg-[#3b82f6] hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm">
                    <span>Track Status Now</span>
                    <ArrowRight size={18} />
                  </button>
                  <button onClick={() => window.location.href = '/'} className="h-12 px-8 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 font-bold rounded-xl transition-all flex items-center justify-center text-sm">
                    Return Home
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Info Footer */}
      <p className="mt-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.25em]">
        Military Grade Encryption • Full Anonymity Active
      </p>
    </div>
  );
};

export default SubmitComplaint;
