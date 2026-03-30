import React from 'react';
import { FileText, Calendar, Tag, MapPin, Shield, Lock } from 'lucide-react';

const CaseIntelligence = ({ complaint }) => {
  const metadata = [
    { icon: Calendar, label: 'Submitted', value: new Date(complaint.createdAt).toLocaleDateString() },
    { icon: Tag, label: 'Category', value: complaint.categoryName || 'General Ethics' },
    { icon: MapPin, label: 'Location', value: complaint.location || 'N/A' },
    { icon: Shield, label: 'Priority', value: complaint.priority || 'NORMAL' }
  ];

  return (
    <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-indigo-500/5 border border-white group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:bg-indigo-500/10" />

      <div className="flex items-center gap-3 mb-8 relative z-10">
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
          <FileText size={20} />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Case Intelligence</h3>
          {complaint.type === 'SENSITIVE' && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Lock size={10} className="text-rose-500" />
              <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Highly Sensitive • Selective Access Authorized</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100 relative z-10 mb-8">
        <p className="text-[15px] text-slate-700 leading-relaxed font-medium">
          {complaint.description}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
        {metadata.map((item, idx) => (
          <div key={idx} className="p-5 bg-white border border-slate-100 rounded-[24px] shadow-sm hover:border-indigo-200 transition-all hover:scale-[1.02]">
            <item.icon size={14} className="text-slate-400 mb-2" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
            <p className="text-[11px] font-black text-slate-900 truncate mt-1">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CaseIntelligence;
