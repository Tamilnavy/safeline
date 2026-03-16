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
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Organization</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Subdomain</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Provisioned</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {tenants.map(t => (
            <tr key={t.id} className="table-row group">
              <td className="px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 shadow-sm group-hover:border-indigo-100 transition-colors">
                    <Building size={18} className="text-indigo-600" />
                  </div>
                  <span className="font-bold text-slate-900 text-sm tracking-tight">{t.name}</span>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold">
                  <Globe size={14} className="opacity-60" />
                  <span>{t.domain}.safeline.io</span>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Active</span>
                </div>
              </td>
              <td className="px-6 py-5 text-slate-500 text-sm font-medium">
                {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </td>
              <td className="px-6 py-5 text-right">
                <div className="flex gap-2 justify-end">
                  <button
                    className="btn btn-secondary !py-1.5 !px-3 !text-xs"
                    onClick={() => onManage(t)}
                  >
                    <Users size={14} className="mr-2" /> Manage
                  </button>
                  <button 
                    className="btn btn-secondary !p-2" 
                    onClick={() => window.open(`http://${t.domain}.localhost:5173`, '_blank')}
                    title="Visit Portal"
                  >
                    <ExternalLink size={14} />
                  </button>
                  <button 
                    className="btn btn-secondary !p-2 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100" 
                    onClick={() => onDelete(t.id)}
                    title="Terminate Environment"
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
