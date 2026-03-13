import { motion } from 'framer-motion';

const Stat = ({ label, value, icon: Icon, trend, color = 'var(--primary)' }) => (
  <motion.div 
    whileHover={{ y: -2 }}
    className="bg-bg-surface border border-border-subtle rounded-lg p-5 flex flex-col gap-4 hover:border-border-interactive transition-colors shadow-sm"
  >
    <div className="flex items-center justify-between">
      <div className="p-2 rounded-md bg-white/5 border border-white/5" style={{ color }}>
        {Icon && <Icon size={20} />}
      </div>
      {trend && (
        <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          trend > 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
        }`}>
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
    <div>
      <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-text-primary tracking-tight">{value}</p>
    </div>
  </motion.div>
);

export default Stat;
