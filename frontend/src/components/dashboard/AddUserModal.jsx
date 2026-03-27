import React, { useState, useEffect } from 'react';
import { X, UserPlus, ChevronRight, Shield, User, Settings, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Roles are now handled via committeePermissions checkboxes

const AddUserModal = ({
  isOpen,
  onClose,
  onSave,
  title = "Add Employee",
}) => {
  const { user: currentUser } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    employeeId: '',
    role: 'EMPLOYEE',
    committeePermissions: [],
  });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm({
        fullName: '',
        email: '',
        password: '',
        employeeId: '',
        role: 'EMPLOYEE',
        committeePermissions: [],
      });
      setMsg({ text: '', type: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;



  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    setLoading(true);
    try {
      await onSave(form);
      setMsg({ text: '✅ Employee added successfully!', type: 'success' });
      setTimeout(() => {
        onClose();
        setMsg({ text: '', type: '' });
      }, 1500);
    } catch (err) {
      setMsg({
        text: '❌ ' + (err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : 'Failed to add employee')),
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm font-medium text-slate-900";
  const selectClass = "w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer";
  const labelClass = "text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1";

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg p-8 rounded-2xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Fill in employee details below</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Name ── */}
          <div className="space-y-1.5">
            <label className={labelClass}>Name</label>
            <input
              type="text"
              className={inputClass}
              required
              placeholder="e.g. Jane Doe"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>

          {/* ── Email ── */}
          <div className="space-y-1.5">
            <label className={labelClass}>Email</label>
            <input
              type="email"
              className={inputClass}
              required
              placeholder="jane@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          {/* ── Password ── */}
          <div className="space-y-1.5">
            <label className={labelClass}>Password</label>
            <input
              type="password"
              className={inputClass}
              required
              placeholder="Secure password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {/* ── Employee ID ── */}
          <div className="space-y-1.5">
            <label className={labelClass}>Employee ID</label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. EMP-001"
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            />
          </div>
          
          {/* ── Role Selection Cards ── */}
          <div className="space-y-4">
            <label className={labelClass}>Select Account Type</label>
            <div className="grid grid-cols-1 gap-3">
              {/* Card 1: Standard Employee */}
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'EMPLOYEE', committeePermissions: [] })}
                className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                  form.role === 'EMPLOYEE' && form.committeePermissions.length === 0
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-600/5'
                    : 'border-slate-100 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  form.role === 'EMPLOYEE' && form.committeePermissions.length === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  <User size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">Standard Employee</p>
                    {form.role === 'EMPLOYEE' && form.committeePermissions.length === 0 && <Check size={16} className="text-indigo-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">Basic access for submitting and tracking personal anonymous reports.</p>
                </div>
              </button>

              {/* Card 2: Investigation Officer */}
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'EMPLOYEE', committeePermissions: form.committeePermissions.length > 0 ? form.committeePermissions : ['COMPLAINT_HANDLER'] })}
                className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                  form.role === 'EMPLOYEE' && form.committeePermissions.length > 0
                    ? 'border-purple-600 bg-purple-50/50 shadow-md shadow-purple-600/5'
                    : 'border-slate-100 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  form.role === 'EMPLOYEE' && form.committeePermissions.length > 0 ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  <Shield size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">Investigation Officer</p>
                    {form.role === 'EMPLOYEE' && form.committeePermissions.length > 0 && <Check size={16} className="text-purple-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">Oversight power to review, triage, or investigate sensitive anonymous cases.</p>
                </div>
              </button>

              {/* Card 3: System Administrator (Only for Org/Owner creators) */}
              {currentUser?.role === 'ORG_ADMIN' && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: 'ADMIN', committeePermissions: [] })}
                  className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                    form.role === 'ADMIN'
                      ? 'border-slate-800 bg-slate-50 shadow-md shadow-slate-900/5'
                      : 'border-slate-100 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    form.role === 'ADMIN' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Settings size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900">System Administrator</p>
                      {form.role === 'ADMIN' && <Check size={16} className="text-slate-900" />}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">Full access for organization setup, team management, and directory control.</p>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* ── Advanced Permissions (Smart Reveal) ── */}
          <AnimatePresence>
            {form.role === 'EMPLOYEE' && form.committeePermissions.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-slate-100 pt-5 mt-2 space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Oversight Authorities</label>
                    <p className="text-[10px] text-slate-400 font-medium px-1">Select the specific investigative powers for this officer.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2.5">
                    {[
                      { id: 'COMMITTEE_LEAD', label: 'Committee Lead', desc: 'Can triage and assign new cases' },
                      { id: 'COMPLAINT_HANDLER', label: 'Complaint Handler', desc: 'Can investigate assigned cases' },
                      { id: 'ESCALATION_HEAD', label: 'Escalation Head', desc: 'Handles high-sensitivity reports' }
                    ].map(perm => (
                      <label key={perm.id} className="flex items-start gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50/50 cursor-pointer hover:bg-white transition-all group">
                        <div className="pt-0.5">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-600/20"
                            checked={form.committeePermissions?.includes(perm.id)}
                            onChange={(e) => {
                              const perms = new Set(form.committeePermissions || []);
                              if (e.target.checked) perms.add(perm.id);
                              else perms.delete(perm.id);
                              setForm({ ...form, committeePermissions: Array.from(perms) });
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 group-hover:text-purple-600 transition-colors">{perm.label}</p>
                          <p className="text-[10px] text-slate-500 font-medium opacity-80">{perm.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Message ── */}
          {msg.text && (
            <div className={`p-4 rounded-xl flex items-center gap-3 border ${msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : 'bg-rose-50 text-rose-700 border-rose-100'
              }`}>
              <p className="text-xs font-bold leading-none">{msg.text}</p>
            </div>
          )}

          {/* ── Submit ── */}
          <button
            type="submit"
            className="w-full h-12 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus size={18} />
                <span>Add Employee</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
