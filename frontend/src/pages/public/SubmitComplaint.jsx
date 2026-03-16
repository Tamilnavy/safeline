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
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

const SubmitComplaint = () => {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    location: '',
    isAnonymous: true
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
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
    setLoading(true);
    setError('');
    try {
      const data = new FormData();
      data.append('request', JSON.stringify({
        ...formData,
        anonymous: formData.isAnonymous
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen py-20 flex flex-col items-center bg-slate-50">
      <div className="container max-w-md mx-auto relative px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 shadow-sm">
            <ShieldCheck className="text-indigo-600" size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Secure Channel Active</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Submit a Report</h1>
          <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto">Provide accurate details to help us investigate the incident effectively.</p>
        </motion.div>

        {step < 4 && (
          <div className="flex gap-4 items-center mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex flex-col gap-2">
                <div className="flex justify-between items-center px-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${step >= s ? 'text-indigo-600' : 'text-slate-400'}`}>
                    Step 0{s}
                  </span>
                  {step > s && <CheckCircle size={12} className="text-emerald-500" />}
                </div>
                <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: step > s ? '100%' : (step === s ? '50%' : '0%') }}
                    className="h-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <motion.div
          layout
          className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100"
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Basic Info</h2>
                    <p className="text-slate-500 text-xs font-medium">Primary details about the incident</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Report Title</label>
                    <input 
                      type="text" 
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400" 
                      placeholder="e.g., Financial Irregularity in Sector 7" 
                      value={formData.title} 
                      onChange={(e) => setFormData({...formData, title: e.target.value})} 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Category</label>
                      <div className="relative group">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                        <select 
                          className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer" 
                          value={formData.categoryId} 
                          onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                        >
                          <option value="">Select Category</option>
                          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Location</label>
                      <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                        <input 
                          type="text" 
                          className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400" 
                          placeholder="Building/Dept" 
                          value={formData.location} 
                          onChange={(e) => setFormData({...formData, location: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setStep(2)} 
                  className="w-full h-12 mt-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group" 
                  disabled={!formData.title || !formData.categoryId}
                >
                  <span>Continue to Details</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                    <Send size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Description</h2>
                    <p className="text-slate-500 text-xs font-medium">Describe what happened and attach evidence</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Incident Description</label>
                    <textarea 
                      className="w-full min-h-[160px] p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400 leading-relaxed" 
                      placeholder="Provide a detailed sequence of events including names, dates, and specific incidents..." 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    />
                  </div>
                  
                  <motion.div 
                    whileHover={{ scale: 1.01, backgroundColor: 'rgb(248, 250, 252)' }}
                    className="border-2 border-dashed border-slate-200 p-8 text-center rounded-2xl bg-slate-50/50 cursor-pointer group transition-all" 
                    onClick={() => document.getElementById('file-input').click()}
                  >
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-indigo-50 transition-all duration-300">
                      <Image size={24} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <p className="text-sm font-bold text-slate-900 mb-1">Attach Evidence</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Supports images, PDF, or documents</p>
                    <input id="file-input" type="file" multiple hidden onChange={handleFileChange} />
                    {files.length > 0 && (
                      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold shadow-lg shadow-indigo-600/20 animate-in zoom-in duration-300">
                        <CheckCircle size={14} />
                        <span>{files.length} documents attached</span>
                      </div>
                    )}
                  </motion.div>
                </div>

                <div className="flex gap-4 mt-10">
                  <button onClick={() => setStep(1)} className="flex-1 h-12 px-6 flex items-center justify-center gap-2 text-slate-500 font-bold text-sm bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200">
                    <ChevronLeft size={18} />
                    <span>Back</span>
                  </button>
                  <button 
                    onClick={() => setStep(3)} 
                    className="flex-3 h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 group" 
                    disabled={!formData.description}
                  >
                    <span>Next Step</span>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shadow-sm">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Privacy</h2>
                    <p className="text-slate-500 text-xs font-medium">Choose your identification level</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-5 cursor-pointer rounded-2xl border-2 transition-all relative overflow-hidden ${formData.isAnonymous ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`} 
                    onClick={() => setFormData({...formData, isAnonymous: true})}
                  >
                    {formData.isAnonymous && <div className="absolute top-0 right-0 w-8 h-8 bg-indigo-600 text-white flex items-center justify-center rounded-bl-xl"><CheckCircle size={14} /></div>}
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${formData.isAnonymous ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-100 text-slate-400'}`}>
                        <ShieldCheck size={24} />
                      </div>
                      <div className="pr-4">
                        <h3 className="text-sm font-bold text-slate-900 mb-1">Stay Anonymous</h3>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Identity is completely hidden. No personal data stored. SafeLine encrypts all traffic.</p>
                      </div>
                    </div>
                  </motion.div>
    
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-5 cursor-pointer rounded-2xl border-2 transition-all relative overflow-hidden ${!formData.isAnonymous ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`} 
                    onClick={() => setFormData({...formData, isAnonymous: false})}
                  >
                    {!formData.isAnonymous && <div className="absolute top-0 right-0 w-8 h-8 bg-indigo-600 text-white flex items-center justify-center rounded-bl-xl"><CheckCircle size={14} /></div>}
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${!formData.isAnonymous ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-100 text-slate-400'}`}>
                        <CheckCircle size={24} />
                      </div>
                      <div className="pr-4">
                        <h3 className="text-sm font-bold text-slate-900 mb-1">Disclose Identity</h3>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Provide details for direct communication. Only authorized officers will see your data.</p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className="flex gap-4 mt-10">
                  <button onClick={() => setStep(2)} className="flex-1 h-12 px-6 flex items-center justify-center gap-2 text-slate-500 font-bold text-sm bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200">
                    <ChevronLeft size={18} />
                    <span>Back</span>
                  </button>
                  <button 
                    onClick={handleSubmit} 
                    className="flex-3 h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group" 
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Submit Report</span> 
                        <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
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
                className="text-center"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-sm animate-in zoom-in duration-500">
                  <CheckCircle size={40} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Success</h2>
                <p className="text-slate-500 text-sm font-medium mb-10">Report received and encrypted. Protect these credentials.</p>

                <div className="space-y-4 mb-10">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6 text-center border-b border-slate-200 pb-2">Tracking Credentials</p>
                    
                    <div className="flex justify-between items-center mb-6 group px-2">
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Tracking ID</p>
                        <p className="font-mono text-xl font-bold text-indigo-600">{result.trackingId}</p>
                      </div>
                      <button onClick={() => copyToClipboard(result.trackingId)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-lg transition-all">
                        <Copy size={18} />
                      </button>
                    </div>

                    <div className="flex justify-between items-center group px-2">
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Security PIN</p>
                        <p className="font-mono text-xl font-bold text-emerald-600">{result.rawPin}</p>
                      </div>
                      <button onClick={() => copyToClipboard(result.rawPin)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-lg transition-all">
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="p-5 flex items-center gap-4 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-600 text-white/5 opacity-0 group-hover:opacity-10 transition-opacity flex items-center justify-center rounded-bl-full"><QrCode size={40} /></div>
                    <div className="w-12 h-12 rounded-xl bg-white border border-indigo-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <QrCode size={24} className="text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-indigo-900 mb-0.5">Mobile Sync</p>
                      <p className="text-[11px] text-indigo-600/80 font-medium leading-relaxed">Save to your mobile vault for easy access.</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button onClick={() => window.location.href = '/track'} className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2">
                    <span>Track Status Now</span>
                    <ArrowRight size={18} />
                  </button>
                  <button onClick={() => window.location.href = '/'} className="h-12 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-900 transition-colors">
                    Return Home
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="mt-10 text-center text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] max-w-xs mx-auto drop-shadow-sm">
          Military Grade Encryption • Anonymous Submission
        </p>
      </div>
    </div>
  );
};

export default SubmitComplaint;
