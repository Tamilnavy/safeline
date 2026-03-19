import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, X, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const RoleManager = ({ isOpen, onClose }) => {
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) fetchRoles();
  }, [isOpen]);

  const fetchRoles = async () => {
    try {
      const resp = await api.get('/admin/roles');
      setRoles(resp.data);
    } catch (err) {
      console.error('Failed to fetch roles');
    }
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    if (!newRole.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/admin/roles', { name: newRole });
      setNewRole('');
      fetchRoles();
    } catch (err) {
      setError(err.response?.data || 'Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      await api.delete(`/admin/roles/${id}`);
      fetchRoles();
    } catch (err) {
      alert(err.response?.data || 'Failed to delete role');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg p-8 rounded-2xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Shield size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Organization Levels</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleAddRole} className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">Create New Level (Staff Role)</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              className="flex-1 h-11 px-4 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm font-medium" 
              placeholder="e.g. Senior Investigator"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary px-4 h-11 flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={18} />
              <span>Add Level</span>
            </button>
          </div>
          {error && (
            <div className="mt-3 flex items-center gap-2 text-rose-600 text-[10px] font-bold uppercase tracking-tight px-1">
              <AlertCircle size={12} />
              <span>{error}</span>
            </div>
          )}
        </form>

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
          {roles.map(role => (
            <div key={role.id} className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-indigo-100 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span className="text-sm font-bold text-slate-700">{role.name}</span>
                {['ORG_ADMIN', 'EMPLOYEE'].includes(role.name) && (
                  <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded uppercase">Default</span>
                )}
              </div>
              {!['ORG_ADMIN', 'EMPLOYEE', 'SUPER_ADMIN'].includes(role.name) && (
                <button 
                  onClick={() => handleDeleteRole(role.id)}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          {roles.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-slate-400 font-medium">No custom roles found. Create one above.</p>
            </div>
          )}
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 leading-relaxed">
            <span className="font-bold text-slate-500">Note:</span> <span className="text-indigo-600 font-bold">EMPLOYEE</span> is the default reporter role. These <span className="text-indigo-600 font-bold">Custom Levels</span> are for staff who investigate or review cases. They only see reports explicitly assigned to them.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleManager;
