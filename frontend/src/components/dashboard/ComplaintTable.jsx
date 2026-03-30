import { useState } from 'react';
import { MessageSquare, Eye, ChevronLeft, ChevronRight, X, ArrowUpDown } from 'lucide-react';
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
  isLead = false,
  isEscalation = false,
  isHandler = false,
  user = {},
  viewMode = 'HANDLER',
  sortBy,
  onSortChange
}) => {
  const statusStages = ['ALL', 'SUBMITTED', 'ASSIGNED', 'UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED', 'CLOSED'];
  const updateStages = ['SUBMITTED', 'ASSIGNED', 'UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED', 'CLOSED'];

  // Track open role popover
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [activeRoleLevel, setActiveRoleLevel] = useState(null);
  const [rolePopupStyle, setRolePopupStyle] = useState({});
  // Track which complaint row has its status dropdown open
  const [editingStatusId, setEditingStatusId] = useState(null);
  const [popupStyle, setPopupStyle] = useState({});

  const toggleRolePopup = (e, complaint) => {
    e.stopPropagation();
    if (editingRoleId === complaint.id) {
      setEditingRoleId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setRolePopupStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      zIndex: 201,
      width: 'max-content'
    });
    setEditingRoleId(complaint.id);
    setActiveRoleLevel(null);
  };

  const toggleStatusPopup = (e, id) => {
    e.stopPropagation();
    if (editingStatusId === id) {
      setEditingStatusId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setPopupStyle({
      position: 'fixed',
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
      zIndex: 201,
      width: 'max-content'
    });
    setEditingStatusId(id);
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED': return 'success';
      case 'INVESTIGATING':
      case 'SUBMITTED':
      case 'TRIAGED': return 'warning';
      case 'UNDER_REVIEW':
      case 'INVESTIGATION':
      case 'ASSIGNED': return 'primary';
      case 'REOPENED': return 'danger';
      default: return 'warning';
    }
  };

  const getAssignedInvestigator = (complaint) => {
    if (!complaint.assignedToUsername) return null;
    return investigators.find(i => i.username === complaint.assignedToUsername || i.id === complaint.assignedToId);
  };

  const getRoleLabel = (complaint) => {
    const inv = getAssignedInvestigator(complaint);
    if (!inv) return 'Unassigned';

    if (inv.committeePermissions?.includes('ESCALATION_HEAD')) return 'Escalation Head';
    if (inv.committeePermissions?.includes('COMMITTEE_LEAD')) return 'Committee Lead';
    if (inv.committeePermissions?.includes('COMPLAINT_HANDLER')) return 'Complaint Handler';

    return 'Employee';
  };

  const handleAssignUser = (complaintId, assignId) => {
    if (assignId && onAssign) {
      onAssign(complaintId, assignId);
    }
    setEditingRoleId(null);
  };

  const groupedInvestigators = (() => {
    const groups = {
      'ESCALATION_HEAD': [],
      'COMMITTEE_LEAD': [],
      'COMPLAINT_HANDLER': [],
      'MEMBER': []
    };

    investigators.forEach(inv => {
      const perms = inv.committeePermissions || [];
      let matched = false;
      if (perms.includes('ESCALATION_HEAD')) { groups['ESCALATION_HEAD'].push(inv); matched = true; }
      if (perms.includes('COMMITTEE_LEAD')) { groups['COMMITTEE_LEAD'].push(inv); matched = true; }
      if (perms.includes('COMPLAINT_HANDLER')) { groups['COMPLAINT_HANDLER'].push(inv); matched = true; }
      
      if (!matched) groups['MEMBER'].push(inv);
    });
    return groups;
  })();

  const roleOrder = [
    { id: 'COMMITTEE_LEAD', name: 'Committee Leads' },
    { id: 'COMPLAINT_HANDLER', name: 'Complaint Handlers' },
    { id: 'ESCALATION_HEAD', name: 'Escalation Heads' },
    { id: 'MEMBER', name: 'Other Personnel' }
  ];

  // Filter assignment options by viewer's role:
  // Escalation Head → can only assign to other Escalation Heads
  // Committee Lead → can only assign to Complaint Handlers (their job is to route, not investigate)
  const getFilteredRoleOrder = () => {
    // If Admin/SuperAdmin, see everything
    if (user?.role && ['SUPER_ADMIN', 'ORG_ADMIN', 'ADMIN'].includes(user.role)) return roleOrder;

    if (viewMode === 'LEAD') return roleOrder.filter(r => r.id === 'COMPLAINT_HANDLER');
    if (viewMode === 'ESCALATION') return roleOrder.filter(r => r.id === 'ESCALATION_HEAD');
    
    return []; // No investigative powers in other modes (like HANDLER mode)
  };
  const filteredRoleOrder = getFilteredRoleOrder();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 pb-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-none flex-1">
          {statusStages.map(s => (
            <button
              key={s}
              onClick={() => onFilterChange(s)}
              className={`btn transition-all whitespace-nowrap ${filterStatus === s ? 'btn-primary' : 'btn-secondary text-xs py-1.5'
                }`}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {onSortChange && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 shadow-sm transition-all shrink-0">
            <ArrowUpDown size={14} className="text-slate-400" />
            <select
              className="bg-transparent text-sm text-slate-600 font-medium outline-none border-none cursor-pointer focus:ring-0 flex-1 min-w-[120px]"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="createdAt,desc">Newest First</option>
              <option value="createdAt,asc">Oldest First</option>
            </select>
          </div>
        )}
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
                  <th className="px-4 py-4 text-xs font-bold text-slate-500 tracking-widest">Type</th>
                  <th className="px-4 py-4 text-xs font-bold text-slate-500 tracking-widest">Summary</th>
                  <th className="px-4 py-4 text-xs font-bold text-slate-500 tracking-widest">Reporter</th>
                  <th className="px-4 py-4 text-xs font-bold text-slate-500 tracking-widest">Status</th>
                  {showAssignment && <th className="px-4 py-4 text-xs font-bold text-slate-500 tracking-widest">Handling Role</th>}
                  <th className="px-2 py-4 text-xs font-bold text-slate-500 tracking-widest text-center">Actions</th>
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
                    <td className="px-4 py-5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-indigo-600 font-bold text-sm tracking-tight">{c.trackingId}</span>
                        <div className="text-slate-400 text-[10px] mt-1 font-medium">{new Date(c.createdAt).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap">
                      <Badge variant={c.type === 'SENSITIVE' ? 'danger' : 'secondary'} className="px-2 py-0.5 text-[9px] font-black tracking-tighter">
                        {c.type || 'NORMAL'}
                      </Badge>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex flex-col gap-1 min-w-[180px]">
                        <div className="flex items-center gap-2">
                          <div className={`font-bold text-sm truncate max-w-[200px] ${c.type === 'SENSITIVE' ? 'text-rose-600' : 'text-slate-900'}`}>{c.title}</div>
                        </div>
                        <div className="text-slate-500 text-[10px] uppercase tracking-wider font-bold opacity-70">
                          {c.categoryName || 'General Ethics'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">
                          {c.anonymous ? (c.anonymousId || 'ANON-REPORTER') : (c.reporterUsername || 'Public User')}
                        </span>
                        {c.anonymous ?
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Anonymous</span> :
                          <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-tighter">Identified</span>}
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <Badge variant={getStatusVariant(c.status)}>{c.status?.replace(/_/g, ' ')}</Badge>
                    </td>

                    {showAssignment && (
                      <td className="px-4 py-5">
                        <div className="relative">
                          <button
                            onClick={(e) => toggleRolePopup(e, c)}
                            className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border shadow-sm transition-all focus:outline-none min-w-[140px] ${getRoleLabel(c) === 'Unassigned'
                              ? 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-white hover:border-slate-300'
                              : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                              } ${editingRoleId === c.id ? 'ring-2 ring-indigo-500/20 border-indigo-300' : ''}`}
                          >
                            <span className="text-[11px] font-bold tracking-wide truncate max-w-[220px]">
                              {getAssignedInvestigator(c)
                                ? `${getRoleLabel(c)} - ${getAssignedInvestigator(c).fullName || getAssignedInvestigator(c).username}`
                                : 'Untriaged / Unassigned'}
                            </span>
                            <ChevronRight size={14} className={`shrink-0 transition-transform ${editingRoleId === c.id ? 'rotate-90' : ''}`} />
                          </button>

                          {editingRoleId === c.id && (
                            <>
                              <div className="fixed inset-0 z-200" onClick={(e) => { e.stopPropagation(); setEditingRoleId(null); }} />
                              <div style={rolePopupStyle} className="bg-white rounded-xl shadow-lg border border-slate-200 p-2 w-fit max-w-sm animate-in fade-in zoom-in-95 duration-150">
                                {activeRoleLevel ? (
                                  <div className="flex flex-col space-y-1">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setActiveRoleLevel(null); }}
                                      className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 text-slate-500 font-semibold text-[10px] uppercase tracking-wider hover:bg-slate-100 hover:text-slate-800 transition-colors"
                                    >
                                      <ChevronLeft size={12} />
                                      Back to Groups
                                    </button>
                                    <div className="max-h-[220px] overflow-y-auto space-y-1">
                                      {(groupedInvestigators[activeRoleLevel] || []).length === 0 ? (
                                        <div className="px-3 py-2 text-sm text-slate-400 font-medium italic">No personnel found.</div>
                                      ) : (
                                        groupedInvestigators[activeRoleLevel].map(inv => (
                                          <button
                                            key={inv.id}
                                            onClick={() => handleAssignUser(c.id, inv.id)}
                                            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors hover:bg-slate-100 ${getAssignedInvestigator(c)?.id === inv.id
                                              ? 'bg-indigo-50 text-indigo-600 font-semibold'
                                              : 'text-slate-600 font-medium'
                                              }`}
                                          >
                                            {inv.fullName || inv.username} ({inv.employeeId || 'ID UNKNOWN'})
                                          </button>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col space-y-1">
                                    {filteredRoleOrder.map(role => {
                                      const count = (groupedInvestigators[role.id] || []).length;
                                      return (
                                        <button
                                          key={role.id}
                                          disabled={count === 0}
                                          onClick={(e) => { e.stopPropagation(); setActiveRoleLevel(role.id); }}
                                          className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent group/role"
                                        >
                                          <span className="font-medium text-slate-600 group-disabled/role:text-slate-400">{role.name}</span>
                                          <span className="ml-4 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-bold group-hover:bg-white">{count}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    )}

                    <td className="px-2 py-5">
                      <div className="flex gap-1.5 justify-center items-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onViewDetails(c)}
                          className="p-2 rounded-lg text-indigo-600 transition-all border border-slate-200 hover:border-indigo-200 bg-white hover:bg-indigo-50 shadow-sm"
                          title="Open Investigation Console"
                        >
                          {isLead ? <Eye size={16} /> : <MessageSquare size={16} />}
                        </motion.button>
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
                  className="btn btn-secondary py-1.5! px-3! disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => onPageChange(page + 1)}
                  className="btn btn-secondary py-1.5! px-3! disabled:opacity-30"
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
