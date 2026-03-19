import React, { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';
import api from '../../services/api';

const AddUserModal = ({
  isOpen,
  onClose,
  onSave,
  title = "Add Team Member",
  initialRole = 'INVESTIGATOR',
  fixedRole = null
}) => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    roleName: fixedRole || initialRole
  });
  const [roles, setRoles] = useState([]);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen]);

  const fetchRoles = async () => {
    if (fixedRole) {
      setRoles([{ value: fixedRole, label: fixedRole }]);
      return;
    }

    try {
      // Fetch both roles AND current team
      const [roleResp, userResp] = await Promise.all([
        api.get('/admin/roles'),
        api.get('/admin/users/all')
      ]);

      const occupiedRoles = userResp.data.map(u => u.role);

      const filtered = roleResp.data
        .filter(r => !['EMPLOYEE', 'ORG_ADMIN', 'SUPER_ADMIN'].includes(r.name))
        .map(r => ({ 
          value: r.name, 
          label: r.name,
          isOccupied: occupiedRoles.includes(r.name)
        }));

      setRoles(filtered);

      // Select first available (not occupied) role if any
      const available = filtered.find(r => !r.isOccupied);
      if (available) {
        setForm(f => ({ ...f, roleName: available.value }));
      } else if (filtered.length > 0) {
        setForm(f => ({ ...f, roleName: filtered[0].value }));
      }
    } catch (err) {
      console.error('Failed to load roles');
    }
  };

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
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
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
          {!fixedRole && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Role / Level</label>
              <select
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer"
                value={form.roleName}
                onChange={(e) => setForm({ ...form, roleName: e.target.value })}
              >
                {roles.map(r => (
                  <option 
                    key={r.value} 
                    value={r.value} 
                    disabled={r.isOccupied}
                    className={r.isOccupied ? 'text-slate-300' : ''}
                  >
                    {r.label} {r.isOccupied ? '(ALREADY ASSIGNED)' : ''}
                  </option>
                ))}
              </select>
              {roles.length === 0 && (
                <p className="text-[10px] text-rose-500 font-bold px-1 mt-1">
                  No custom levels found. Please create one in "Manage Levels".
                </p>
              )}
              {roles.every(r => r.isOccupied) && roles.length > 0 && (
                <p className="text-[10px] text-rose-500 font-bold px-1 mt-1">
                  All created levels are currently occupied. Please create a new level first.
                </p>
              )}
            </div>
          )}

          {msg.text && (
            <div className={`p-4 rounded-xl flex items-center gap-3 border ${msg.type === 'success'
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
