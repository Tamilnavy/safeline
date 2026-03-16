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
      const pending = all.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
      setStats({ total: resp.data.totalElements || 0, pending, resolved: (resp.data.totalElements || 0) - pending });
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
    switch(userRole) {
      case 'ORG_ADMIN': return 'Executive Hub';
      case 'INTAKE_OFFICER': return 'Fleet Operations';
      case 'EXECUTIVE': return 'Executive Suite';
      case 'HR_MANAGER': return 'Personnel Hub';
      case 'COMPLIANCE_OFFICER': return 'Protocol Hub';
      default: return 'Fleet Operational';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-1">{getDashboardTitle()}</h1>
          <p className="text-text-secondary text-sm font-medium">
            Management console for <span className="text-primary font-semibold">{tenantDomain}</span>
          </p>
        </div>
        {userRole === 'ORG_ADMIN' && (
          <button className="btn btn-primary" onClick={() => setShowAddUser(true)}>
            <UserPlus size={18} />
            <span>Add Team Member</span>
          </button>
        )}
      </header>

      <div className="metrics-grid">
        <Stat label="Total Reports" value={stats.total} icon={FileText} color="#5e6ad2" />
        <Stat label="Active Cases" value={stats.pending} icon={Clock} color="#facc15" />
        <Stat label="Resolved Cases" value={stats.resolved} icon={CheckCircle} color="#4ade80" />
        <Stat label="Team Members" value={allTeam.length} icon={Users} color="#5e6ad2" />
      </div>

      <motion.div variants={itemVariants}>
        <Card 
          title="Case Management" 
          subtitle="Real-time listing of all organization-wide concerns and reports"
        >
          <div className="overflow-x-auto -mx-8">
            <div className="px-8">
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
                onViewDetails={(c) => navigate(`/dashboard/complaint/${c.id}`)}
                onTriage={setTriageComplaint}
                userRole={userRole}
                showAssignment={userRole === 'ORG_ADMIN'}
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {userRole === 'ORG_ADMIN' && (
        <motion.div variants={itemVariants}>
          <Card title="Team Directory" subtitle="Investigators and department staff">
            <div className="overflow-x-auto -mx-8">
              <table className="w-full text-left">
                <thead className="border-b border-white/5 bg-white/5">
                  <tr>
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">Username</th>
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">Email Authority</th>
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted text-right">Access Protocol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allTeam.length === 0 ? (
                    <tr><td colSpan="3" className="px-8 py-10 text-center text-text-muted font-bold">No team members enrolled yet.</td></tr>
                  ) : allTeam.map(inv => (
                    <tr key={inv.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-5 text-sm font-bold text-white uppercase tracking-tight">{inv.username}</td>
                      <td className="px-8 py-5 text-sm text-text-muted font-medium">{inv.email}</td>
                      <td className="px-8 py-5 text-right">
                        <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black tracking-widest uppercase">
                          {inv.role.replace(/_/g, ' ')}
                        </span>
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
        {/* Detail view is now handled by dedicated InvestigationDetails page */}
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
