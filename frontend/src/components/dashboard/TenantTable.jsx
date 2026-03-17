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
      <div className="py-24 text-center">
        <div className="animate-pulse text-slate-500 font-semibold">Synchronizing secure registry...</div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="w-full text-left">
        <thead>
          <tr className="table-header">
            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Organization</th>
            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Tenant Admin</th>
            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {tenants.map(t => (
            <tr key={t.id} className="table-row group">
              <td className="px-8 py-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm group-hover:border-indigo-50 transition-colors">
                    <Building size={18} className="text-indigo-600" />
                  </div>
                  <span className="font-bold text-slate-900 tracking-tight">{t.name}</span>
                </div>
              </td>
              <td className="px-8 py-5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                    <Users size={12} className="text-slate-400" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{t.adminUsername || 'Not Assigned'}</span>
                </div>
              </td>
              <td className="px-8 py-5 text-right">
                <div className="flex gap-3 justify-end">
                  <button
                    className="btn btn-secondary py-2! px-4! text-[10px]! font-black! uppercase! tracking-widest!"
                    onClick={() => onManage(t)}
                  >
                    Manage
                  </button>
                  <button 
                    className="btn btn-secondary !p-2" 
                    onClick={() => window.open(`http://${t.domain}.localhost:5173`, '_blank')}
                    title="Visit Portal"
                  >
                    <Globe size={14} className="text-slate-400" />
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
