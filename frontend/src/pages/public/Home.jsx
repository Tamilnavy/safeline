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
    <div className="min-h-screen relative bg-bg-primary overflow-hidden">
      <div className="container relative pt-32 pb-24 px-6 mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="max-w-3xl mx-auto text-center mb-32"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-8">
            <Globe size={14} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Next-Gen Incident Management</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-6xl font-bold text-text-primary tracking-tight mb-6 leading-[1.1]"
          >
            Safe & Anonymous <br />
            Internal Reporting.
          </motion.h1>

          <motion.p variants={itemVariants} className="text-text-secondary mb-10 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
            SafeLine provides a secure gateway for employees to report concerns with <span className="text-text-primary">guaranteed anonymity</span> and enterprise-grade encryption.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/submit')} className="btn btn-primary px-10 py-3.5 text-base font-bold shadow-lg shadow-primary/20 group">
              File a Report <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => navigate('/track')} className="btn btn-secondary px-10 py-3.5 text-base font-bold bg-bg-surface border border-border-subtle hover:border-text-secondary transition-all">
              Track Incident
            </button>
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <FeatureCard
            icon={<Lock className="text-primary" size={24} />}
            title="E2E Encryption"
            description="Reports are encrypted in-browser before transmission, ensuring 100% data privacy."
            variants={itemVariants}
          />
          <FeatureCard
            icon={<Zap className="text-primary" size={24} />}
            title="Instant Tracking"
            description="Follow case progress in real-time using a unique, secure anonymous key."
            variants={itemVariants}
          />
          <FeatureCard
            icon={<ShieldCheck className="text-primary" size={24} />}
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
    className="card group hover:scale-[1.02] transition-all"
  >
    <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-text-primary mb-3">{title}</h3>
    <p className="text-sm text-text-secondary leading-relaxed font-medium">
      {description}
    </p>
  </motion.div>
);

export default Home;
