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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg-primary">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card w-full max-w-px-280 border border-border-subtle shadow-xl bg-bg-surface p-8 md:p-10"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">
            {isOtpMode ? 'OTP Authentication' : 'Welcome back'}
          </h2>
          <p className="text-text-secondary text-sm font-medium mt-1">
            {isOtpMode ? 'Enter your temporary access code' : 'Secure access to your workspace'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-xs font-semibold flex items-center gap-2"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {!isOtpMode ? (
          <form onSubmit={handlePasswordLogin} className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Username</label>
              <div className="relative group">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  className="input-field pl-10" 
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Password</label>
              <div className="relative group">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" />
                <input 
                  type="password" 
                  className="input-field pl-10" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full py-2.5 text-sm font-bold shadow-md shadow-primary/10 mt-2" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            {!otpSent ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Username / Email</label>
                  <div className="relative group">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" />
                    <input 
                      type="text" 
                      className="input-field pl-10" 
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <button onClick={handleGenerateOtp} className="btn btn-primary w-full py-2.5 text-sm font-bold shadow-md shadow-primary/10" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Access Code'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-text-secondary mb-1.5 block text-center">Enter 6-digit code</label>
                  <div className="relative group">
                    <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" />
                    <input 
                      type="text" 
                      className="input-field pl-10 tracking-[0.5em] text-center font-bold text-lg" 
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      required 
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-full py-2.5 text-sm font-bold shadow-md shadow-primary/10" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>
                <button onClick={() => setOtpSent(false)} className="w-full text-xs font-semibold text-text-secondary hover:text-primary transition-colors">
                  Resend code
                </button>
              </form>
            )}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-border-subtle text-center">
          <button 
            onClick={() => { setIsOtpMode(!isOtpMode); setOtpSent(false); setError(''); }} 
            className="text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
          >
            {isOtpMode ? 'Use password instead' : 'Sign in with one-time code'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
