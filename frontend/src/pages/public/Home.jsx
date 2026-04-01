import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, FileSearch, ArrowRight, PlusCircle, Search, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.98, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 100, damping: 15 } 
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] relative flex flex-col items-center justify-center bg-[#f4f7ff] px-6 py-8 md:py-10">
      {/* Background Radial Ambient - Very subtle static glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-100/10 rounded-full blur-[100px] -z-10" />

      <div className="container relative mx-auto max-w-6xl flex flex-col items-center">
        {/* Compact Breathable Hero Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-5xl mx-auto text-center mb-8 lg:mb-10"
        >
          <motion.h1
            variants={itemVariants}
            className="text-2xl md:text-3xl lg:text-[44px] font-extrabold text-[#2d3748] tracking-tight mb-4 leading-tight whitespace-nowrap"
          >
            Secure reporting for <span className="text-indigo-600">modern workplaces.</span>
          </motion.h1>

          <motion.p 
            variants={itemVariants} 
            className="text-slate-500 max-w-2xl mx-auto text-sm md:text-base font-medium opacity-85 leading-relaxed mb-8"
          >
            Provide employees with a trusted platform to report concerns while enabling organizations to resolve issues responsibly.
          </motion.p>


        </motion.div>

        {/* Compact Action Cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto items-stretch"
        >
          {/* Submit Card - Blue Theme */}
          <motion.div
            variants={itemVariants}
            whileHover="hover"
            className="group relative bg-white/40 backdrop-blur-xl p-8 rounded-[36px] border border-white/50 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col items-center text-center overflow-hidden"
          >
            {/* Hover-only Glow Background */}
            <motion.div 
              variants={{ hover: { opacity: 0.6, scale: 1.3 } }}
              initial={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 bg-blue-100/50 blur-3xl -z-10 transition-all duration-500"
            />

            <div className="mb-6 relative transition-transform duration-500 group-hover:scale-110">
              {/* Internal glow reduced, prominent on hover */}
              <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
              <div className="relative w-16 h-16 rounded-2xl bg-[#3b82f6] shadow-xl shadow-blue-500/20 flex items-center justify-center">
                <ShieldCheck className="text-white" size={32} />
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-1 uppercase tracking-wider">Submit Safe Report</h3>
            <p className="text-slate-400 text-[12px] font-medium mb-8 max-w-[240px]">Report misconduct securely and anonymously.</p>
            
            <button 
              onClick={() => navigate('/submit')}
              className="mt-auto w-full h-11 bg-[#3b82f6] hover:bg-blue-600 text-white text-[13px] font-bold rounded-xl shadow-lg shadow-blue-600/10 transition-all flex items-center justify-center gap-2 group/btn"
            >
              <span>Submit Report</span>
              <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Track Card - Lavender Theme with Hover Glow */}
          <motion.div
            variants={itemVariants}
            whileHover="hover"
            className="group relative bg-[#f5f3ff]/40 backdrop-blur-xl p-8 rounded-[36px] border border-white/50 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col items-center text-center overflow-hidden"
          >
            {/* Hover-only Glow Background */}
            <motion.div 
              variants={{ hover: { opacity: 0.7, scale: 1.3 } }}
              initial={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 bg-indigo-100/60 blur-3xl -z-10 transition-all duration-500"
            />

            <div className="mb-6 relative transition-transform duration-500 group-hover:scale-110">
              {/* Internal glow reduced, prominent on hover */}
              <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
              <div className="relative w-16 h-16 rounded-2xl bg-[#6366f1] shadow-xl shadow-indigo-500/20 flex items-center justify-center">
                <FileSearch className="text-white" size={28} strokeWidth={2.5} />
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-1 uppercase tracking-wider">Track Existing Report</h3>
            <p className="text-slate-400 text-[12px] font-medium mb-8 max-w-[240px]">Check the status of your submitted report.</p>
            
            <button 
              onClick={() => navigate('/track')}
              className="mt-auto w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-xl shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-2 group/btn"
            >
              <span>Track Report</span>
              <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
