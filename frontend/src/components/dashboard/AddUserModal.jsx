import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';

const AddUserModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  title = "Add Team Member",
  roles = [
    { value: 'ORG_ADMIN', label: 'Org Admin' },
    { value: 'INVESTIGATOR', label: 'Investigator' },
    { value: 'INTAKE_OFFICER', label: 'Intake Officer' },
    { value: 'HR_MANAGER', label: 'HR Manager' },
    { value: 'COMPLIANCE_OFFICER', label: 'Compliance Officer' },
    { value: 'EXECUTIVE', label: 'Executive (Read-Only)' },
    { value: 'EMPLOYEE', label: 'Employee' }
  ],
  initialRole = 'INVESTIGATOR'
}) => {
  const [form, setForm] = useState({ username: '', email: '', password: '', roleName: initialRole });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    setLoading(true);
    try {
      await onSave(form);
      setMsg({ text: '✅ User added successfully!', type: 'success' });
      setForm({ username: '', email: '', password: '', roleName: initialRole });
      setTimeout(() => {
        onClose();
        setMsg({ text: '', type: '' });
      }, 1500);
    } catch (err) {
      setMsg({ 
        text: '❌ ' + (err.response?.data?.message || err.response?.data || 'Failed to add user'), 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Username</label>
            <input 
              type="text" 
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm font-medium text-slate-900" 
              required 
              placeholder="e.g. jdoe"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })} 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Email</label>
            <input 
              type="email" 
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm font-medium text-slate-900" 
              required 
              placeholder="jane@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Password</label>
            <input 
              type="password" 
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm font-medium text-slate-900" 
              required 
              placeholder="Secure password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Role</label>
            <select 
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer" 
              value={form.roleName}
              onChange={(e) => setForm({ ...form, roleName: e.target.value })}
            >
              {roles.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          
          {msg.text && (
            <div className={`p-4 rounded-xl flex items-center gap-3 border ${
              msg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                : 'bg-rose-50 text-rose-700 border-rose-100'
            }`}>
              <p className="text-xs font-bold leading-none">{msg.text}</p>
            </div>
          )}
          
          <button 
            type="submit" 
            className="w-full h-12 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={loading}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus size={18} />
                <span>Add Member</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
