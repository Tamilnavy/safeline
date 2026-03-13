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
      <div className="flex gap-2 mb-2 overflow-x-auto pb-2" style={{ flexWrap: 'wrap' }}>
        {statusStages.map(s => (
          <button
            key={s}
            onClick={() => onFilterChange(s)}
            className={`btn ${filterStatus === s ? 'btn-primary' : 'btn-secondary shadow-none'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-text-secondary font-medium animate-pulse">Loading case data...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Tracking ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Summary</th>
                  <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                  {showAssignment && <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Owner</th>}
                  <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan={showAssignment ? 6 : 5} className="py-20 text-center text-text-secondary">
                      No matching records found.
                    </td>
                  </tr>
                ) : complaints.map(c => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-primary font-bold text-sm">{c.trackingId}</span>
                      <div className="text-text-secondary text-[10px] mt-0.5">{new Date(c.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="td-summary">
                        <div className="font-semibold text-text-primary text-sm truncate max-w-[280px]">{c.title}</div>
                        <div className="text-text-secondary text-[10px] uppercase tracking-wider font-bold opacity-60">
                          {c.categoryName || 'General Ethics'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getPriorityVariant(c.priority)}>{c.priority || 'NORMAL'}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusVariant(c.status)}>{c.status?.replace(/_/g, ' ')}</Badge>
                    </td>
                    {showAssignment && (
                      <td className="px-6 py-4">
                        <select
                          className="input-field !py-1 !px-2 !text-[11px] !w-auto min-w-[120px]"
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
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end items-center">
                        {(userRole === 'ORG_ADMIN' || userRole === 'INVESTIGATOR') && (
                          <select
                            className="input-field !py-1 !px-2 !text-[11px] !w-auto min-w-[100px]"
                            value={c.status}
                            onChange={(e) => onUpdateStatus(c.id, e.target.value)}
                          >
                            {updateStages.map(s => (
                              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                        )}

                        <div className="flex gap-1">
                          {(userRole === 'ORG_ADMIN' || userRole === 'INTAKE_OFFICER') && (
                            <button 
                              onClick={() => onTriage?.(c)}
                              className="p-1.5 rounded hover:bg-white/5 text-warning transition-colors" 
                              title="Triage Case"
                            >
                              <ShieldAlert size={16} />
                            </button>
                          )}
                          
                          <motion.button 
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(94, 106, 210, 0.1)' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onViewDetails(c)}
                            className="p-2 rounded-lg text-primary transition-all border border-transparent hover:border-primary/20 bg-primary/5" 
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
            <div className="flex justify-between items-center mt-6 pt-4" style={{ borderTop: '1px solid var(--border-light)' }}>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Page {page + 1} of {totalPages}</p>
              <div className="flex gap-2">
                <button disabled={page === 0} onClick={() => onPageChange(page - 1)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', opacity: page === 0 ? 0.5 : 1 }}>
                  <ChevronLeft size={14} />
                </button>
                <button disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', opacity: page >= totalPages - 1 ? 0.5 : 1 }}>
                  <ChevronRight size={14} />
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
