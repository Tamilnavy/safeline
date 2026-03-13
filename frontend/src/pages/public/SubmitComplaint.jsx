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
    <div className="min-h-screen py-20 flex flex-col items-center bg-bg-primary">
      <div className="container max-w-md mx-auto relative px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 mb-3.5 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
            <ShieldCheck className="text-primary" size={12} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary">Secure Channel Active</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-2">Submit a Report</h1>
          <p className="text-text-secondary text-xs font-medium max-w-xs mx-auto">Provide accurate details to help us investigate the incident effectively.</p>
        </motion.div>

        {step < 4 && (
          <div className="flex gap-3 items-center mb-8 px-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex flex-col gap-1.5">
                <div className="flex justify-between items-center px-0.5">
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${step >= s ? 'text-primary' : 'text-text-secondary opacity-40'}`}>
                    S0{s}
                  </span>
                  {step > s && <CheckCircle size={10} className="text-primary" />}
                </div>
                <div className="h-0.5 rounded-full bg-border-subtle overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: step > s ? '100%' : (step === s ? '50%' : '0%') }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <motion.div
          layout
          className="card !p-6 md:!p-8"
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-center text-primary">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary tracking-tight">Basic Info</h2>
                    <p className="text-text-secondary text-[10px] font-medium">Primary details about the incident</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-text-secondary mb-1 block">Report Title</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g., Financial Irregularity in Sector 7" 
                      value={formData.title} 
                      onChange={(e) => setFormData({...formData, title: e.target.value})} 
                    />
                  </div>
                  
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-secondary block">Category</label>
                        <div className="relative group">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" size={14} />
                          <select 
                            className="input-field pl-10 appearance-none" 
                            value={formData.categoryId} 
                            onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                          >
                            <option value="">Select Category</option>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                          </select>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-secondary block">Location</label>
                        <div className="relative group">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" size={14} />
                          <input 
                            type="text" 
                            className="input-field pl-10" 
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
                  className="btn btn-primary w-full py-2.5 mt-8 font-bold text-sm" 
                  disabled={!formData.title || !formData.categoryId}
                >
                  Continue to Details <ArrowRight size={16} className="ml-1" />
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
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-success/5 border border-success/20 flex items-center justify-center text-success">
                    <Send size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary tracking-tight">Description</h2>
                    <p className="text-text-secondary text-[10px] font-medium">Describe what happened and attach evidence</p>
                  </div>
                </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-secondary block">Incident Description</label>
                      <textarea 
                        className="input-field min-h-[140px] leading-relaxed py-3" 
                        placeholder="Provide a detailed sequence of events including names, dates, and specific incidents..." 
                        value={formData.description} 
                        onChange={(e) => setFormData({...formData, description: e.target.value})} 
                      />
                    </div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.01, backgroundColor: 'rgba(94, 106, 210, 0.05)' }}
                      className="border border-dashed border-border-subtle p-6 text-center rounded-lg bg-white-5 cursor-pointer group transition-all" 
                      onClick={() => document.getElementById('file-input').click()}
                    >
                      <div className="w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center mx-auto mb-2.5 group-hover:bg-primary-10 transition-colors">
                        <Image size={20} className="text-text-secondary group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-xs font-bold text-text-primary mb-0.5">Attach Evidence</p>
                      <p className="text-[10px] text-text-secondary font-medium">Add images, PDF, or documents</p>
                      <input id="file-input" type="file" multiple hidden onChange={handleFileChange} />
                      {files.length > 0 && (
                        <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary-10 text-primary text-[10px] font-bold border border-primary/20">
                          <CheckCircle size={12} /> {files.length} documents attached
                        </div>
                      )}
                    </motion.div>
                  </div>

                <div className="flex gap-3 mt-8">
                  <button onClick={() => setStep(1)} className="btn btn-secondary flex-1 font-bold text-sm">
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button 
                    onClick={() => setStep(3)} 
                    className="btn btn-primary flex-1 font-bold text-sm" 
                    disabled={!formData.description}
                  >
                    Next Step <ChevronRight size={16} />
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
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-center text-primary">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary tracking-tight">Privacy</h2>
                    <p className="text-text-secondary text-[10px] font-medium">Choose your identification level</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.99 }}
                    className={`card !p-4 cursor-pointer border-2 transition-all ${formData.isAnonymous ? 'border-primary bg-primary-5' : 'border-border-subtle opacity-60 hover:opacity-100'}`} 
                    onClick={() => setFormData({...formData, isAnonymous: true})}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${formData.isAnonymous ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-bg-secondary text-text-secondary'}`}>
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-text-primary mb-0.5">Stay Anonymous</h3>
                        <p className="text-[10px] text-text-secondary font-medium leading-relaxed">Identity is completely hidden. No personal data stored.</p>
                      </div>
                    </div>
                  </motion.div>
    
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.99 }}
                    className={`card !p-4 cursor-pointer border-2 transition-all ${!formData.isAnonymous ? 'border-primary bg-primary-5' : 'border-border-subtle opacity-60 hover:opacity-100'}`} 
                    onClick={() => setFormData({...formData, isAnonymous: false})}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${!formData.isAnonymous ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-bg-secondary text-text-secondary'}`}>
                        <CheckCircle size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-text-primary mb-0.5">Disclose Identity</h3>
                        <p className="text-[10px] text-text-secondary font-medium leading-relaxed">Provide details for direct communication.</p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button onClick={() => setStep(2)} className="btn btn-secondary flex-1 font-bold text-sm">
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button 
                    onClick={handleSubmit} 
                    className="btn btn-primary flex-1 font-bold text-sm" 
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit'} 
                    {!loading && <Send size={16} className="ml-1" />}
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
                <div className="w-14 h-14 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-5 border border-success/20">
                  <CheckCircle size={28} />
                </div>
                <h2 className="text-2xl font-bold text-text-primary tracking-tight mb-2">Success</h2>
                <p className="text-text-secondary text-xs font-medium mb-8">Report received and encrypted.</p>

                <div className="space-y-3 mb-8">
                  <div className="card !p-5 bg-bg-secondary/50 border-border-subtle">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-text-secondary mb-3 text-left border-b border-border-subtle pb-1.5 px-0.5">Credentials</p>
                    
                    <div className="flex justify-between items-center mb-4 group px-0.5">
                      <div className="text-left">
                        <p className="text-[9px] font-bold text-text-secondary mb-0.5 uppercase">Track ID</p>
                        <p className="font-mono text-base font-bold text-primary">{result.trackingId}</p>
                      </div>
                      <button onClick={() => copyToClipboard(result.trackingId)} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-text-secondary hover:text-text-primary">
                        <Copy size={16} />
                      </button>
                    </div>

                    <div className="flex justify-between items-center group px-0.5">
                      <div className="text-left">
                        <p className="text-[9px] font-bold text-text-secondary mb-0.5 uppercase">PIN</p>
                        <p className="font-mono text-base font-bold text-success">{result.rawPin}</p>
                      </div>
                      <button onClick={() => copyToClipboard(result.rawPin)} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-text-secondary hover:text-text-primary">
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="card !p-4 flex items-center gap-4 bg-primary/5 border-primary/10">
                    <div className="w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center flex-shrink-0">
                      <QrCode size={20} className="text-primary opacity-80" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-text-primary mb-0.5">Mobile Sync</p>
                      <p className="text-[9px] text-text-secondary font-medium leading-relaxed">Save to your mobile vault.</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button onClick={() => window.location.href = '/track'} className="btn btn-primary w-full py-2.5 font-bold text-sm">
                    Track Status <ArrowRight size={16} className="ml-1" />
                  </button>
                  <button onClick={() => window.location.href = '/'} className="text-[10px] font-bold text-text-secondary hover:text-text-primary transition-colors py-1.5 uppercase tracking-widest">
                    Return Home
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="mt-8 text-center text-[10px] text-text-secondary font-bold uppercase tracking-widest max-w-xs mx-auto opacity-50">
          Encrypted • Anonymous • Secure
        </p>
      </div>
    </div>
  );
};

export default SubmitComplaint;
