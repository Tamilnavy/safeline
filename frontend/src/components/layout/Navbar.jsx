import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-4 z-50 mx-auto max-w-7xl px-6 w-full"
    >
      <div className="bg-white/70 backdrop-blur-2xl border border-white/50 rounded-2xl px-6 py-3.5 flex justify-between items-center text-slate-900 shadow-sm">
        <Link to="/" className="flex items-center gap-2 group decoration-transparent">
          <div className="p-1.5 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
            <Shield size={20} className="text-indigo-600" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">SafeLine</span>
        </Link>

        {/* Text-Only Links as requested */}
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-[13px] font-bold text-slate-500 hover:text-indigo-600 transition-colors decoration-transparent">Home</Link>
            <Link to="/submit" className="text-[13px] font-bold text-slate-500 hover:text-indigo-600 transition-colors decoration-transparent">Report</Link>
            <Link to="/track" className="text-[13px] font-bold text-slate-500 hover:text-indigo-600 transition-colors decoration-transparent">Track</Link>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="h-9 px-4 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-[11px] font-bold rounded-lg transition-all"
                >
                  Logout
                </button>
            ) : (
              <Link to="/login" className="h-9 px-6 bg-[#3b82f6] hover:bg-blue-600 text-white text-[13px] font-bold rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
