import { motion } from 'framer-motion';

const Stat = ({ label, value, icon: Icon, trend }) => (
  <motion.div 
    whileHover={{ y: -2 }}
    className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex items-center justify-between">
      <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
        {Icon && <Icon size={20} />}
      </div>
      {trend && (
        <div className={`text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm ${
          trend > 0 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
            : 'bg-rose-50 text-rose-700 border-rose-100'
        }`}>
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
    </div>
  </motion.div>
);

export default Stat;
