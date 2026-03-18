import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building, Shield, Users } from 'lucide-react';

const ManageTenantUsersDrawer = ({ 
  isOpen, 
  onClose, 
  tenant 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex justify-end">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md bg-white border-l border-slate-200 p-8 flex flex-col shadow-2xl"
          >
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Manage Members</h3>
                <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full w-fit">
                  <Building size={14} className="text-indigo-600" />
                  <p className="text-xs font-bold text-indigo-700 tracking-tight">{tenant.name}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-thin">
              {tenant.adminUsername && (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-100 transition-all group/admin">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-slate-100 text-indigo-600 shadow-sm group-hover/admin:shadow-indigo-100/50 transition-all">
                      <Shield size={22} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Root Organization Admin</p>
                      <p className="text-lg font-bold text-slate-900 leading-tight">{tenant.adminUsername}</p>
                      <p className="text-xs text-slate-500 font-medium">{tenant.adminEmail}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl">
                <Users size={32} className="text-slate-200 mb-4" />
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Sensitive Data Shield Active</p>
                <p className="text-[10px] text-slate-400 mt-2">All internal investigators and staff records are protected. Super Admin authority is restricted to administrative provisioning.</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ManageTenantUsersDrawer;
