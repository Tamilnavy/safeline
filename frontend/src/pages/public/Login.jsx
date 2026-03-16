import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Lock, User, ShieldCheck, Key, Mail, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const resp = await api.post('/auth/login', { username, password });
      login(resp.data, resp.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOtp = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/otp/generate', { username });
      setOtpSent(true);
    } catch (err) {
      setError('Failed to generate OTP. Ensure the username is correct.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const resp = await api.post('/auth/otp/verify', { username, otp });
      login(resp.data, resp.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7ff] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="w-full max-w-md relative"
      >
        {/* Refined Slate Header */}
        <div className="bg-slate-800/95 backdrop-blur-md rounded-t-[32px] p-8 mb-0 relative z-20 shadow-xl overflow-hidden border-x border-t border-slate-700/50">
          <div className="flex flex-col items-center relative z-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#3b82f6]/10 flex items-center justify-center mb-4 ring-1 ring-[#3b82f6]/20">
              <ShieldCheck className="text-[#3b82f6]" size={28} />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isOtpMode ? 'Double Verification' : 'Professional Access'}
            </h2>
            <p className="text-slate-400 text-[12px] font-medium mt-2 leading-relaxed">
              {isOtpMode 
                ? 'Enter your temporary secure access code' 
                : 'Secure workspace access for authorized personnel'}
            </p>
          </div>
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-[#3b82f6]/5 rounded-full blur-3xl" />
        </div>

        {/* Form Container White Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.1 }}
          className="bg-white rounded-b-[32px] rounded-t-none -mt-4 pt-10 pb-8 px-8 shadow-2xl shadow-indigo-500/10 border border-white relative z-10"
        >
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[12px] font-bold flex items-center gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {!isOtpMode ? (
            <form onSubmit={handlePasswordLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700 ml-1">Username</label>
                <div className="relative group">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3b82f6] transition-colors" />
                  <input 
                    type="text" 
                    className="w-full h-11 pl-12 pr-4 bg-white border border-slate-200/60 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400 shadow-sm" 
                    placeholder="Enter your handle"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700 ml-1">Secure Password</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3b82f6] transition-colors" />
                  <input 
                    type="password" 
                    className="w-full h-13 pl-12 pr-4 bg-white border border-slate-200/60 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400 tracking-widest shadow-sm" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit" 
                className="w-full h-11 bg-[#3b82f6] hover:bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group mt-6" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span className="text-[13px]">Authenticating...</span>
                  </div>
                ) : (
                  <>
                    <span className="text-[14px]">Initialize Authorization</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>
          ) : (
            <div className="space-y-6">
              {!otpSent ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-700 ml-1">Account Identifier</label>
                    <div className="relative group">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3b82f6] transition-colors" />
                      <input 
                        type="text" 
                        className="w-full h-13 pl-12 pr-4 bg-white border border-slate-200/60 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400 shadow-sm" 
                        placeholder="Username or email"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleGenerateOtp} 
                    className="w-full h-13 bg-[#3b82f6] hover:bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 mt-4" 
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="text-[14px]">Request Secure Code</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </motion.button>
                </div>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block text-center mb-6">Verification Protocol Internal</label>
                    <div className="relative group">
                      <Key size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#3b82f6] z-10" />
                      <input 
                        type="text" 
                        className="w-full h-14 pl-4 pr-4 bg-slate-50 border border-slate-200 rounded-[24px] focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-2xl font-bold text-slate-900 text-center tracking-[0.5em] placeholder:text-slate-200" 
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                        required 
                      />
                    </div>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit" 
                    className="w-full h-11 bg-[#3b82f6] hover:bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50" 
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="text-[14px]">Establish Final Handshake</span>
                        <ShieldCheck size={18} />
                      </>
                    )}
                  </motion.button>
                  <div className="flex justify-center mt-4">
                    <button onClick={() => setOtpSent(false)} className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] hover:text-[#3b82f6] transition-colors">
                      Protocol Timeout? Resend Code
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col items-center gap-4">
            <button 
              onClick={() => { setIsOtpMode(!isOtpMode); setOtpSent(false); setError(''); }} 
              className="text-[12px] font-bold text-slate-500 hover:text-slate-900 transition-all flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                {isOtpMode ? <Lock size={14} className="group-hover:text-[#3b82f6]" /> : <Mail size={14} className="group-hover:text-[#3b82f6]" />}
              </div>
              {isOtpMode ? 'Switch to Standard Password Access' : 'Switch to MFA / One-Time Access'}
            </button>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] flex items-center gap-2">
              <ShieldCheck size={12} className="text-[#3b82f6]" />
              Military Grade Encryption Active
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
