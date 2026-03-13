import React from 'react';
import { Building, Globe, Users, ExternalLink, Trash2 } from 'lucide-react';

const TenantTable = ({ 
  tenants, 
  onManage, 
  onDelete, 
  loading 
}) => {
  if (loading) {
    return (
      <div style={{ padding: '6rem 0', textAlign: 'center' }}>
        <div className="animate-pulse" style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Synchronizing secure registry...</div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', margin: '0 -1.5rem' }}>
      <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
        <thead>
          <tr>
            <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>Organization</th>
            <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>Subdomain</th>
            <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>Status</th>
            <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>Provisioned</th>
            <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map(t => (
            <tr key={t.id} className="animate-fade-in group">
              <td style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderLeft: '1px solid var(--border-subtle)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', borderTopLeftRadius: 'var(--radius-md)', borderBottomLeftRadius: 'var(--radius-md)' }}>
                <div className="flex items-center gap-3">
                  <div style={{ width: '36px', height: '36px', background: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
                    <Building size={16} className="text-primary" />
                  </div>
                  <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{t.name}</span>
                </div>
              </td>
              <td style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-2 text-primary" style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                  <Globe size={14} className="opacity-50" />
                  <span>{t.domain}.safeline.io</span>
                </div>
              </td>
              <td style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <div className="pulse-indicator" style={{ background: 'var(--success)', width: '6px', height: '6px' }}></div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--success)' }}>Active</span>
                </div>
              </td>
              <td style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>
                {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </td>
              <td style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderRight: '1px solid var(--border-subtle)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', borderTopRightRadius: 'var(--radius-md)', borderBottomRightRadius: 'var(--radius-md)', textAlign: 'right' }}>
                <div className="flex gap-2 justify-end">
                  <button
                    className="btn btn-outline"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                    onClick={() => onManage(t)}
                  >
                    <Users size={14} /> Manage
                  </button>
                  <button className="btn btn-outline" style={{ padding: '0.4rem', border: '1px solid var(--border-subtle)' }} onClick={() => window.open(`http://${t.domain}.localhost:5173`, '_blank')}>
                    <ExternalLink size={14} />
                  </button>
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '0.4rem', color: 'var(--danger)', border: '1px solid var(--border-subtle)' }}
                    onClick={() => onDelete(t.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TenantTable;
