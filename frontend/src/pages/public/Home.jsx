import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Search,
  ArrowRight,
  Globe,
  Lock,
  Zap,
  ShieldCheck,
  FileEdit
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }
    }
  };

  return (
    <div className="min-h-screen relative bg-slate-50 overflow-hidden">
      <div className="container relative pt-32 pb-24 px-6 mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="max-w-4xl mx-auto text-center mb-32"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-10 shadow-sm">
            <Globe size={16} className="text-indigo-600" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-700">Next-Gen Incident Management</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-6xl md:text-7xl font-bold text-slate-900 tracking-tight mb-8 leading-[1.05]"
          >
            Safe & Anonymous <br />
            <span className="text-indigo-600">Internal Reporting.</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-slate-500 mb-12 max-w-2xl mx-auto text-xl font-medium leading-relaxed">
            SafeLine provides a secure gateway for employees to report concerns with <span className="text-slate-900 font-bold underline decoration-indigo-500/30 underline-offset-4">guaranteed anonymity</span> and enterprise-grade encryption.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:row gap-6 justify-center">
            <button 
              onClick={() => navigate('/submit')} 
              className="px-10 h-14 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 group"
            >
              <span>File a Report</span> 
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => navigate('/track')} 
              className="px-10 h-14 bg-white hover:bg-slate-50 text-slate-900 text-lg font-bold rounded-2xl border border-slate-200 shadow-sm transition-all"
            >
              Track Incident
            </button>
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <FeatureCard
            icon={<Lock className="text-indigo-600" size={28} />}
            title="E2E Encryption"
            description="Reports are encrypted in-browser before transmission, ensuring 100% data privacy."
            variants={itemVariants}
          />
          <FeatureCard
            icon={<Zap className="text-indigo-600" size={28} />}
            title="Instant Tracking"
            description="Follow case progress in real-time using a unique, secure anonymous key."
            variants={itemVariants}
          />
          <FeatureCard
            icon={<ShieldCheck className="text-indigo-600" size={28} />}
            title="Verified Anonymity"
            description="Zero IP tracking or device metadata storage. Your reporting is completely unlinkable."
            variants={itemVariants}
          />
        </motion.div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, variants }) => (
  <motion.div
    variants={variants}
    className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 group hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-600/5 transition-all duration-300"
  >
    <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-4">{title}</h3>
    <p className="text-sm text-slate-500 leading-relaxed font-medium">
      {description}
    </p>
  </motion.div>
);

export default Home;
