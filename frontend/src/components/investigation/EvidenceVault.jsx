import React from 'react';
import { ShieldCheck, FileText, Download } from 'lucide-react';

const EvidenceVault = ({ complaint, onDownload }) => {
  if (!complaint.evidence || complaint.evidence.length === 0) return null;

  return (
    <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-indigo-500/5 border border-white">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
          <ShieldCheck size={18} />
        </div>
        <h3 className="text-md font-black text-slate-900 tracking-tight uppercase">Evidence Vault ({complaint.evidence.length})</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {complaint.evidence.map((file, idx) => (
          <div key={idx} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-[28px] border border-slate-100 hover:bg-white hover:shadow-xl transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center text-blue-500 shadow-sm group-hover:rotate-6 transition-transform ring-1 ring-slate-100">
                <FileText size={20} />
              </div>
              <span className="text-xs font-black text-slate-900 truncate max-w-[200px]">{file.fileName}</span>
            </div>
            <button 
              onClick={() => onDownload(file.id, file.fileName)}
              className="p-3 bg-white rounded-2xl text-blue-600 shadow-sm hover:bg-blue-600 hover:text-white transition-all ring-1 ring-blue-50"
            >
              <Download size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EvidenceVault;
