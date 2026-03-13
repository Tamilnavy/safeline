import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, LogIn, LogOut, LayoutDashboard, Send, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass sticky top-4 z-[100] mx-4 my-4 py-3 rounded-2xl border-white/10"
    >
      <div className="container flex justify-between items-center px-6">
        <Link to="/" className="flex items-center gap-2 group decoration-transparent">
          <div className="p-2 rounded-lg bg-primary-subtle group-hover:bg-primary/20 transition-colors">
            <Shield size={22} className="text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-heading">SafeLine</span>
        </Link>

        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6">
            <Link to="/submit" className="flex items-center gap-2 text-secondary hover:text-white transition-colors text-sm font-medium decoration-transparent">
              <Send size={14} /> Report
            </Link>
            <Link to="/track" className="flex items-center gap-2 text-secondary hover:text-white transition-colors text-sm font-medium decoration-transparent">
              <Search size={14} /> Track
            </Link>
          </div>

          <div className="hidden md:block w-px h-5 border-l border-white/10"></div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/dashboard" className="btn btn-primary !py-2 !px-5 !text-xs !shadow-none">
                  <LayoutDashboard size={14} /> Dashboard
                </Link>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="btn btn-ghost !p-2 rounded-xl text-secondary hover:text-danger hover:bg-danger/10 transition-all"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary !py-2 !px-6 !text-sm font-bold">
                <LogIn size={16} /> Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
