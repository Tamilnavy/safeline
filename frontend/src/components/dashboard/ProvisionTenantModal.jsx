import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const ProvisionTenantModal = ({ 
  isOpen, 
  onClose, 
  formData, 
  setFormData, 
  onSubmit, 
  submitting 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white relative w-full max-w-lg p-10 rounded-2xl shadow-2xl border border-slate-200"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600 rounded-t-2xl" />
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Provision Organization</h3>
                <p className="text-sm text-slate-500 mt-1">Spin up a new secure environment</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Organization Name</label>
                <input 
                  type="text" 
                  className="input-field h-12" 
                  placeholder="e.g. Acme Global" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Domain Identifier</label>
                <div className="relative">
                  <input 
                    type="text" 
                    className="input-field h-12 pr-28" 
                    placeholder="acme" 
                    value={formData.domain} 
                    onChange={(e) => setFormData({...formData, domain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})} 
                    required 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">.safeline.io</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Admin Username</label>
                  <input 
                    type="text" 
                    className="input-field h-12" 
                    placeholder="admin" 
                    value={formData.adminUsername} 
                    onChange={(e) => setFormData({...formData, adminUsername: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Admin Email</label>
                  <input 
                    type="email" 
                    className="input-field h-12" 
                    placeholder="admin@email.com" 
                    value={formData.adminEmail} 
                    onChange={(e) => setFormData({...formData, adminEmail: e.target.value})} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Initial Password</label>
                <input 
                  type="password" 
                  className="input-field h-12" 
                  placeholder="••••••••" 
                  value={formData.adminPassword} 
                  onChange={(e) => setFormData({...formData, adminPassword: e.target.value})} 
                  required 
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={onClose} className="btn btn-secondary flex-1 h-12">Cancel</button>
                <button type="submit" className="btn btn-primary flex-1 h-12 shadow-md shadow-indigo-600/20" disabled={submitting}>
                  {submitting ? 'Provisioning...' : 'Confirm Launch'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProvisionTenantModal;
