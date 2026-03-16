import { MessageSquare, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import Badge from '../ui/Badge';

const ComplaintTable = ({ 
  complaints, 
  investigators = [], 
  onAssign, 
  onUpdateStatus, 
  onViewDetails,
  onTriage,
  loading,
  page,
  totalPages,
  onPageChange,
  filterStatus,
  onFilterChange,
  showAssignment = true,
  userRole = 'STAFF'
}) => {
  const statusStages = ['ALL', 'SUBMITTED', 'TRIAGED', 'INVESTIGATION', 'RESOLVED', 'CLOSED'];
  const updateStages = ['SUBMITTED','TRIAGED','ASSIGNED','INVESTIGATION','WAITING_FOR_REPORTER','RESOLVED','CLOSED'];

  const getPriorityVariant = (priority) => {
    switch (priority) {
      case 'CRITICAL':
      case 'URGENT': return 'danger';
      case 'HIGH': return 'warning';
      case 'NORMAL': return 'primary';
      case 'LOW': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED': return 'success';
      case 'SUBMITTED':
      case 'TRIAGED': return 'warning';
      case 'INVESTIGATION':
      case 'ASSIGNED': return 'primary';
      case 'REOPENED': return 'danger';
      default: return 'warning';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Status filter */}
      <div className="flex gap-2 mb-2 overflow-x-auto pb-2 scrollbar-none">
        {statusStages.map(s => (
          <button
            key={s}
            onClick={() => onFilterChange(s)}
            className={`btn transition-all ${
              filterStatus === s 
                ? 'btn-primary' 
                : 'btn-secondary text-xs py-1.5'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-500 font-semibold animate-pulse bg-white border border-slate-200 rounded-xl">
          Loading case data...
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="w-full text-left">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Tracking ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Summary</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Priority</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  {showAssignment && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Owner</th>}
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan={showAssignment ? 6 : 5} className="py-24 text-center text-slate-500 font-medium">
                      No matching records found.
                    </td>
                  </tr>
                ) : complaints.map(c => (
                  <tr key={c.id} className="table-row group">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-indigo-600 font-bold text-sm tracking-tight">{c.trackingId}</span>
                      <div className="text-slate-400 text-[10px] mt-1 font-medium">{new Date(c.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1 min-w-[200px]">
                        <div className="font-bold text-slate-900 text-sm truncate max-w-[280px]">{c.title}</div>
                        <div className="text-slate-500 text-[10px] uppercase tracking-wider font-bold opacity-70">
                          {c.categoryName || 'General Ethics'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge variant={getPriorityVariant(c.priority)}>{c.priority || 'NORMAL'}</Badge>
                    </td>
                    <td className="px-6 py-5">
                      <Badge variant={getStatusVariant(c.status)}>{c.status?.replace(/_/g, ' ')}</Badge>
                    </td>
                    {showAssignment && (
                      <td className="px-6 py-5">
                        <select
                          className="input-field !py-1 !px-2 !text-[11px] !w-auto min-w-[130px] shadow-sm"
                          value={c.assignedToId || ""}
                          onChange={(e) => { if (e.target.value) onAssign(c.id, e.target.value); }}
                        >
                          <option value="">Unassigned</option>
                          {investigators.map(inv => (
                            <option key={inv.id} value={inv.id}>{inv.username}</option>
                          ))}
                        </select>
                      </td>
                    )}
                    <td className="px-6 py-5 text-right">
                      <div className="flex gap-3 justify-end items-center">
                        {(userRole === 'ORG_ADMIN' || userRole === 'INVESTIGATOR') && (
                          <select
                            className="input-field !py-1 !px-2 !text-[11px] !w-auto min-w-[110px] shadow-sm"
                            value={c.status}
                            onChange={(e) => onUpdateStatus(c.id, e.target.value)}
                          >
                            {updateStages.map(s => (
                              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                        )}

                        <div className="flex gap-2">
                          {(userRole === 'ORG_ADMIN' || userRole === 'INTAKE_OFFICER') && (
                            <button 
                              onClick={() => onTriage?.(c)}
                              className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors border border-transparent hover:border-amber-100 shadow-sm" 
                              title="Triage Case"
                            >
                              <ShieldAlert size={16} />
                            </button>
                          )}
                          
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onViewDetails(c)}
                            className="p-2 rounded-lg text-indigo-600 transition-all border border-slate-200 hover:border-indigo-200 bg-white hover:bg-indigo-50 shadow-sm" 
                            title="Open Investigation Console"
                          >
                            <MessageSquare size={16} />
                          </motion.button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center py-4 px-2 border-t border-slate-200 mt-4">
              <p className="text-slate-500 font-medium text-xs">Page {page + 1} of {totalPages}</p>
              <div className="flex gap-2">
                <button 
                  disabled={page === 0} 
                  onClick={() => onPageChange(page - 1)} 
                  className="btn btn-secondary !py-1.5 !px-3 disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  disabled={page >= totalPages - 1} 
                  onClick={() => onPageChange(page + 1)} 
                  className="btn btn-secondary !py-1.5 !px-3 disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ComplaintTable;
