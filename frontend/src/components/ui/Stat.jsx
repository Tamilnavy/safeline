import { motion } from 'framer-motion';

const Stat = ({ label, value, icon: Icon, trend }) => (
  <motion.div 
    whileHover={{ y: -5, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="bg-white border border-slate-200 rounded-[2.5rem] p-6 aspect-square flex flex-col items-center justify-center text-center gap-4 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all cursor-default relative overflow-hidden group"
  >
    <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
    
    <div className="p-4 rounded-2xl bg-slate-50 text-indigo-600 border border-slate-100 shadow-inner group-hover:bg-indigo-50 group-hover:scale-105 transition-all duration-300">
      {Icon && <Icon size={24} strokeWidth={2.5} />}
    </div>

    <div className="space-y-1">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
    </div>

    {trend && (
      <div className={`text-[10px] font-black px-3 py-1 rounded-full border ${
        trend > 0 
          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
          : 'bg-rose-50 text-rose-600 border-rose-100'
      }`}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
      </div>
    )}
  </motion.div>
);

export default Stat;
