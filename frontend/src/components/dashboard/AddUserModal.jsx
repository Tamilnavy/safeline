import React, { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';
import api from '../../services/api';
import { useLevels } from '../../context/LevelContext';

// Access role options
const ACCESS_ROLES = [
  { value: 'ROLE_1', label: 'Role 1 — Basic Access (Submit complaints, limited dashboard)' },
  { value: 'ROLE_2', label: 'Role 2 — Extended Access (Manage complaints, advanced dashboard)' },
];

const AddUserModal = ({
  isOpen,
  onClose,
  onSave,
  title = "Add Employee",
}) => {
  const { levels } = useLevels();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    employeeId: '',
    hierarchyLevel: levels[0]?.id || 'LEVEL_3',
    accessRole: 'ROLE_1',
  });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const defaultLvl = levels[0]?.id || 'LEVEL_1';
      const defaultRole = (defaultLvl === 'LEVEL_1' || defaultLvl === 'LEVEL_2') ? 'ROLE_2' : 'ROLE_1';
      setForm({
        fullName: '',
        email: '',
        password: '',
        employeeId: '',
        hierarchyLevel: defaultLvl,
        accessRole: defaultRole,
      });
      setMsg({ text: '', type: '' });
    }
  }, [isOpen, levels]);

  const handleHierarchyChange = (val) => {
    // Admin (LEVEL_1) or HR (LEVEL_2) -> Always ROLE_2
    const defaultRole = (val === 'LEVEL_1' || val === 'LEVEL_2') ? 'ROLE_2' : 'ROLE_1';
    setForm(prev => ({ ...prev, hierarchyLevel: val, accessRole: defaultRole }));
  };

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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
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

          {/* ── Divider ── */}
          <div className="border-t border-slate-100 pt-1" />

          {/* ── Hierarchy Level ── */}
          <div className="space-y-1.5">
            <label className={labelClass}>Hierarchy Level</label>
            <select
              className={selectClass}
              value={form.hierarchyLevel}
              onChange={(e) => handleHierarchyChange(e.target.value)}
            >
              {levels.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* ── Access Role ── Shown for everything EXCEPT Level 1 (Admin) and Level 2 (HR) */}
          {form.hierarchyLevel !== 'LEVEL_1' && form.hierarchyLevel !== 'LEVEL_2' && (
            <div className="space-y-1.5">
              <label className={labelClass}>Role</label>
              <select
                className={selectClass}
                value={form.accessRole}
                onChange={(e) => setForm({ ...form, accessRole: e.target.value })}
              >
                {ACCESS_ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          )}

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
