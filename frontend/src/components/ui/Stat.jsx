import { motion } from 'framer-motion';

const Stat = ({ label, value, icon: Icon, trend }) => (
  <motion.div 
    whileHover={{ y: -5, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-3 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all cursor-default relative overflow-hidden group"
  >
    <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
    
    <div className="p-3 rounded-2xl bg-slate-50 text-indigo-600 border border-slate-100 shadow-inner group-hover:bg-indigo-50 group-hover:scale-105 transition-all duration-300">
      {Icon && <Icon size={24} strokeWidth={2.5} />}
    </div>

    <div className="space-y-1">
      <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
    </div>

  </motion.div>
);

export default Stat;
