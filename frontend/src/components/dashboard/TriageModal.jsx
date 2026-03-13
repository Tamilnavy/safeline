import React, { useState } from 'react';
import { X, ShieldAlert, Tag, CheckCircle } from 'lucide-react';

const TriageModal = ({ isOpen, onClose, complaint, onTriage }) => {
  const [priority, setPriority] = useState(complaint?.priority || 'NORMAL');
  const [classification, setClassification] = useState(complaint?.classification || 'GENERAL');
  const [status, setStatus] = useState(complaint?.status || 'TRIAGED');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'];
  const classifications = [
    'GENERAL', 'HR_AND_EMPLOYEE', 'SAFETY_AND_HEALTH', 
    'POLICY_VIOLATION', 'LEGAL_AND_COMPLIANCE', 
    'FINANCIAL_INFRACTION', 'HARASSMENT_OR_DISCRIMINATION'
  ];

  const handleTriage = async () => {
    setLoading(true);
    try {
      await onTriage(complaint.id, { priority, classification, status });
      onClose();
    } catch (err) {
      alert('Failed to triage complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem'
    }}>
      <div className="glass flex flex-col gap-6" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
        <button onClick={onClose} className="btn btn-secondary" style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.4rem' }}>
          <X size={18} />
        </button>

        <header>
          <div className="flex items-center gap-3 mb-2">
            <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)' }}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Case Triage</h3>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Set priority and classify the report.</p>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-5">
          <div className="input-group">
            <label className="input-label"><Tag size={12} /> Priority Level</label>
            <select 
              className="input-field" 
              value={priority} 
              onChange={(e) => setPriority(e.target.value)}
            >
              {priorities.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label"><ShieldAlert size={12} /> Classification</label>
            <select 
              className="input-field" 
              value={classification} 
              onChange={(e) => setClassification(e.target.value)}
            >
              {classifications.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label"><CheckCircle size={12} /> Update Status</label>
            <select 
              className="input-field" 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="SUBMITTED">STAY AT SUBMITTED</option>
              <option value="TRIAGED">TRIAGED (READY FOR ASSIGNMENT)</option>
              <option value="ASSIGNED">SKIP TO ASSIGNED</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-4">
          <button onClick={onClose} className="btn btn-secondary" style={{ border: 'none' }}>Cancel</button>
          <button 
            onClick={handleTriage} 
            disabled={loading}
            className="btn btn-primary"
            style={{ minWidth: '120px' }}
          >
            {loading ? 'Processing...' : 'Complete Triage'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TriageModal;
