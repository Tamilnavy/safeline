import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Stat from '../../components/ui/Stat';
import {
  FileText, Clock, CheckCircle, Users, UserPlus, X, MessageSquare, ChevronRight, Filter, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBoard from '../../components/ui/MessageBoard';
import Badge from '../../components/ui/Badge';

// Modular Components
import AddUserModal from '../../components/dashboard/AddUserModal';
import ComplaintTable from '../../components/dashboard/ComplaintTable';
import TriageModal from '../../components/dashboard/TriageModal';
import { useAuth } from '../../context/AuthContext';

const OrgAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [investigators, setInvestigators] = useState([]);
  const [allTeam, setAllTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [triageComplaint, setTriageComplaint] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const tenantDomain = localStorage.getItem('tenantDomain') || 'Organization';

  useEffect(() => {
    fetchData();
    fetchTeamData();
  }, [page, filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = filterStatus === 'ALL'
        ? `/complaints/all?page=${page}&size=10`
        : `/complaints/all?status=${filterStatus}&page=${page}&size=10`;
      const resp = await api.get(endpoint);
      setComplaints(resp.data.content || []);
      setTotalPages(resp.data.totalPages || 0);

      const all = resp.data.content || [];
      const pending = all.filter(c => !['RESOLVED', 'CLOSED', 'DISMISSED'].includes(c.status?.toUpperCase())).length;
      setStats({
        total: resp.data.totalElements || 0,
        pending,
        resolved: (resp.data.totalElements || 0) - pending
      });
    } catch (err) {
      console.error('Failed to fetch org complaints', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamData = async () => {
    try {
      const [invResp, allResp] = await Promise.all([
        api.get('/admin/users/investigators'),
        api.get('/admin/users/all')
      ]);
      setInvestigators(invResp.data);
      setAllTeam(allResp.data);
    } catch (err) {
      console.error('Failed to load team data');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/complaints/${id}/status?status=${status}`);
      fetchData();
    } catch (err) { alert('Failed to update status'); }
  };

  const handleAssign = async (complaintId, investigatorId) => {
    try {
      await api.put(`/complaints/${complaintId}/assign?investigatorId=${investigatorId}`);
      fetchData();
    } catch (err) { alert('Failed to assign investigator'); }
  };

  const handleTriage = async (id, data) => {
    try {
      await api.put(`/complaints/${id}/triage?priority=${data.priority}&classification=${data.classification}${data.status ? `&status=${data.status}` : ''}`);
      fetchData();
    } catch (err) {
      alert('Failed to update triage details');
    }
  };

  const handleSaveUser = async (formData) => {
    try {
      await api.post('/admin/users', { ...formData });
      fetchTeamData();
    } catch (err) {
      alert('Failed to enroll member');
    }
  };

  const userRole = user?.role || 'STAFF';

  const getDashboardTitle = () => {
    switch (userRole) {
      case 'ORG_ADMIN': return 'Executive Hub';
      case 'INTAKE_OFFICER': return 'Fleet Operations';
      case 'EXECUTIVE': return 'Executive Suite';
      case 'HR_MANAGER': return 'Personnel Hub';
      case 'COMPLIANCE_OFFICER': return 'Protocol Hub';
      default: return 'Fleet Operational';
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">{getDashboardTitle()}</h1>
          <p className="text-slate-500 text-sm font-medium">
            Management console for <span className="text-indigo-600 font-semibold">{tenantDomain}</span>
          </p>
        </div>
        {userRole === 'ORG_ADMIN' && (
          <button className="btn btn-primary h-11 px-6 shadow-lg shadow-indigo-600/20" onClick={() => setShowAddUser(true)}>
            <UserPlus size={18} className="mr-2" />
            <span>Add Team Member</span>
          </button>
        )}
      </header>

      <div className="metrics-grid">
        <Stat label="Total Reports" value={stats.total} icon={FileText} />
        <Stat label="Active Cases" value={stats.pending} icon={Clock} />
        <Stat label="Resolved Cases" value={stats.resolved} icon={CheckCircle} />
        <Stat label="Team Members" value={allTeam.length} icon={Users} />
      </div>

      <motion.div variants={itemVariants}>
        <Card
          title="Case Management"
          subtitle="Real-time listing of all organization-wide concerns and reports"
        >
          <div className="overflow-x-auto">
            <ComplaintTable
              complaints={complaints}
              investigators={investigators}
              loading={loading}
              page={page}
              totalPages={totalPages}
              filterStatus={filterStatus}
              onAssign={handleAssign}
              onUpdateStatus={handleUpdateStatus}
              onPageChange={setPage}
              onFilterChange={(s) => { setFilterStatus(s); setPage(0); }}
              onViewDetails={setSelectedComplaint}
              onTriage={setTriageComplaint}
              userRole={userRole}
              showAssignment={userRole === 'ORG_ADMIN'}
            />
          </div>
        </Card>
      </motion.div>

      {userRole === 'ORG_ADMIN' && (
        <motion.div variants={itemVariants}>
          <Card title="Team Directory" subtitle="Investigators and department staff">
            <div className="table-container">
              <table className="w-full text-left">
                <thead>
                  <tr className="table-header">
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Username</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Email Authority</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Access Protocol</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {allTeam.length === 0 ? (
                    <tr><td colSpan="3" className="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No team members enrolled yet.</td></tr>
                  ) : allTeam.map(inv => (
                    <tr key={inv.id} className="table-row group">
                      <td className="px-8 py-5 text-sm font-bold text-slate-900 tracking-tight uppercase group-hover:text-indigo-600 transition-colors">{inv.username}</td>
                      <td className="px-8 py-5 text-sm text-slate-500 font-medium">{inv.email}</td>
                      <td className="px-8 py-5 text-right">
                        <Badge variant="primary">{inv.role.replace(/_/g, ' ')}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      <AddUserModal
        isOpen={showAddUser}
        onClose={() => setShowAddUser(false)}
        onSave={handleSaveUser}
      />

      <TriageModal
        isOpen={!!triageComplaint}
        onClose={() => setTriageComplaint(null)}
        complaint={triageComplaint}
        onTriage={handleTriage}
      />

      <AnimatePresence>
        {selectedComplaint && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedComplaint(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white relative w-full h-full max-w-6xl max-h-[85vh] overflow-hidden flex flex-col rounded-2xl shadow-2xl border border-slate-200"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600" />
              <div className="h-16 px-8 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusVariant(selectedComplaint.status)}>{selectedComplaint.status}</Badge>
                    <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{selectedComplaint.trackingId}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedComplaint(null)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 flex min-h-0 bg-white">
                <div className="flex-[0.8] p-10 border-r border-slate-100 overflow-y-auto">
                  <div className="mb-10">
                    <h3 className="text-2xl font-bold text-slate-900 leading-tight mb-4">{selectedComplaint.title}</h3>
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl shadow-inner">
                      <p className="text-slate-600 font-medium leading-relaxed italic">"{selectedComplaint.description}"</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</p>
                      <p className="font-semibold text-slate-900">{selectedComplaint.categoryName || 'General'}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Classification</p>
                      <p className="font-bold text-indigo-600">{selectedComplaint.classification?.replace(/_/g, ' ') || 'GENERAL'}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Priority</p>
                      <Badge variant={getPriorityVariant(selectedComplaint.priority)}>{selectedComplaint.priority || 'NORMAL'}</Badge>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Received</p>
                      <p className="font-bold text-slate-900">{new Date(selectedComplaint.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-[1.2] flex flex-col min-h-0">
                  {(userRole !== 'INTAKE_OFFICER' && userRole !== 'EXECUTIVE') ? (
                    <div className="flex-1 min-h-0 flex flex-col bg-slate-50/30">
                      <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center gap-2 shadow-sm">
                        <MessageSquare size={16} className="text-indigo-600" />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-900">Investigation Log</span>
                      </div>
                      <div className="flex-1 min-h-0">
                        <MessageBoard complaintId={selectedComplaint.id} isStaff={true} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 p-12">
                      <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                        <ShieldCheck size={32} className="text-slate-200" />
                      </div>
                      <h4 className="font-bold text-slate-900 mb-2">Restricted Access</h4>
                      <p className="text-sm text-center font-medium max-w-xs leading-relaxed">Chat and investigation details are currently restricted for your access level.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const getStatusVariant = (status) => {
  switch (status) {
    case 'RESOLVED': case 'CLOSED': return 'success';
    case 'SUBMITTED': case 'TRIAGED': return 'warning';
    case 'INVESTIGATION': case 'ASSIGNED': return 'primary';
    case 'REOPENED': return 'danger';
    default: return 'warning';
  }
};

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

export default OrgAdminDashboard;
