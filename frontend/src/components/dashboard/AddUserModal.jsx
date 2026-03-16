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
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', zIndex: 1000, padding: '1rem'
    }}>
      <div className="glass animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}>
        <div className="flex justify-between items-center mb-6">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.4rem' }}>
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="input-group">
            <label className="input-label">Username</label>
            <input 
              type="text" 
              className="input-field" 
              required 
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })} 
            />
          </div>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input 
              type="email" 
              className="input-field" 
              required 
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} 
            />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              required 
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} 
            />
          </div>
          <div className="input-group">
            <label className="input-label">Role</label>
            <select 
              className="input-field" 
              value={form.roleName}
              onChange={(e) => setForm({ ...form, roleName: e.target.value })}
            >
              {roles.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          
          {msg.text && (
            <p style={{ 
              fontSize: '0.85rem', 
              color: msg.type === 'success' ? '#10b981' : '#ef4444',
              padding: '0.5rem',
              background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderRadius: 'var(--radius-sm)'
            }}>
              {msg.text}
            </p>
          )}
          
          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }} disabled={loading}>
            <UserPlus size={16} /> {loading ? 'Processing...' : 'Add Member'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
