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
                <div className="flex gap-4 justify-end items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.active ? 'Active' : 'Inactive'}</span>
                    <button 
                      onClick={() => onToggleStatus && onToggleStatus(t.id)}
                      className={`w-11 h-6 rounded-full p-1 transition-all duration-300 relative border cursor-pointer flex items-center ${t.active ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-200 border-slate-300'}`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${t.active ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>
                  <button 
                    className="btn btn-secondary !p-2" 
                    onClick={() => window.open(`http://${t.domain}.localhost:5173`, '_blank')}
                    title="Visit Portal"
                  >
                    <Globe size={14} className="text-slate-400" />
                  </button>
                  <button 
                    className="btn btn-secondary !p-2 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200" 
                    onClick={() => onDelete && onDelete(t.id)}
                    title="Delete Organization"
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
