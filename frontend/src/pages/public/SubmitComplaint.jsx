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
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    location: '',
    isAnonymous: true,
    accusedUserId: '',
    isSensitive: false
  });
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copiedType, setCopiedType] = useState(null); // 'id' or 'pin'

  useEffect(() => {
    fetchCategories();
    fetchEmployees();
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

  const fetchEmployees = async () => {
    try {
      const resp = await api.get('/auth/users');
      setEmployees(resp.data);
    } catch (err) {
      console.error('Failed to fetch employees');
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
        accusedUserId: formData.accusedUserId || null,
        type: formData.isSensitive ? 'SENSITIVE' : 'NORMAL'
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
        {/* Darker Stepper Header */}
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

        {/* Form Container White Card */}
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

                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-700 ml-1">Who is involved? (Optional)</label>
                    <div className="relative">
                      <select
                        className="w-full h-12 px-5 bg-white border border-slate-200/60 rounded-2xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-[13px] font-bold text-slate-900 appearance-none cursor-pointer shadow-sm"
                        value={formData.accusedUserId}
                        onChange={(e) => setFormData({ ...formData, accusedUserId: e.target.value })}
                      >
                        <option value="">Search employee or skip...</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeId})</option>
                        ))}
                      </select>
                      <Users className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">
                      System auto-detects conflicts if this person is part of the committee.
                    </p>
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
                        onChange={handleFileChange}
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
                    onClick={() => setStep(1)}
                    className="h-11 px-6 text-slate-500 hover:text-slate-900 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={16} />
                    <span>Back</span>
                  </button>

                  <button
                    onClick={() => setStep(3)}
                    className="h-11 px-8 bg-[#3b82f6] hover:bg-blue-600 text-white text-[13px] font-bold rounded-xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group"
                    disabled={!formData.description}
                  >
                    <span>Next Step</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
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

                {/* Severity Toggle */}
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
                    onClick={() => setStep(2)}
                    className="h-11 px-6 text-slate-500 hover:text-slate-900 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={16} />
                    <span>Back</span>
                  </button>

                  <button
                    onClick={handleSubmit}
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
            )}

            {step === 4 && result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-8"
              >
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[32px] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/20 animate-bounce-subtle">
                  <CheckCircle size={40} />
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Report Secured</h2>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">
                    Your anonymous report has been encrypted and securely delivered. Please save your credentials to track progress.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
                  <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-200/60 shadow-inner group relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Tracking ID</p>
                      <div className="flex items-center justify-center gap-4">
                        <span className="text-lg font-black text-slate-900 tracking-tight font-mono">{result.trackingId}</span>
                        <button
                          onClick={() => copyToClipboard(result.trackingId, 'id')}
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
                          onClick={() => copyToClipboard(result.rawPin, 'pin')}
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
                    onClick={() => window.location.href = '/'}
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
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SubmitComplaint;
