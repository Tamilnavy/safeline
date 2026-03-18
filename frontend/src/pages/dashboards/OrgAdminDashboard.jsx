import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Stat from '../../components/ui/Stat';
import {
  FileText, Clock, CheckCircle, Users, UserPlus, MessageSquare, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBoard from '../../components/ui/MessageBoard';
import Badge from '../../components/ui/Badge';

// Modular Components
import AddUserModal from '../../components/dashboard/AddUserModal';
import ComplaintTable from '../../components/dashboard/ComplaintTable';
import TriageModal from '../../components/dashboard/TriageModal';
import ComplaintDetailsModal from '../../components/dashboard/ComplaintDetailsModal';
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
  const userRole = user?.role || 'STAFF';
  const [filterStatus, setFilterStatus] = useState(userRole === 'INTAKE_OFFICER' ? 'SUBMITTED' : 'ALL');

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

  // userRole is now defined at the top for state initialization

  const getDashboardTitle = () => {
    switch (userRole) {
      case 'ORG_ADMIN': return 'Command Center';
      case 'INTAKE_OFFICER': return 'Triage Center';
      case 'EXECUTIVE': return 'Oversight Console';
      case 'HR_MANAGER': return 'Personnel Intelligence';
      case 'COMPLIANCE_OFFICER': return 'Protocol Intelligence';
      default: return 'Field Operations';
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
            {userRole === 'INTAKE_OFFICER' ? 'Triage and prioritize incoming reports' :
              userRole === 'EXECUTIVE' ? 'Oversight and monitoring console for organizational ethics' :
                `Management console for ${tenantDomain}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center gap-2 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Live System Connected</span>
          </div>
          {userRole === 'ORG_ADMIN' && (
            <button className="btn btn-primary h-11 px-6 shadow-lg shadow-indigo-600/20" onClick={() => setShowAddUser(true)}>
              <UserPlus size={18} className="mr-2" />
              <span>Add Team Member</span>
            </button>
          )}
        </div>
      </header>

      <div className="metrics-grid">
        <Stat label="Total Reports" value={stats.total} icon={FileText} />
        <Stat label="Active Cases" value={stats.pending} icon={Clock} />
        <Stat label="Resolved Cases" value={stats.resolved} icon={CheckCircle} />
        {userRole === 'ORG_ADMIN' && (
          <Stat label="Team Members" value={allTeam.length} icon={Users} />
        )}
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
              showAssignment={['ORG_ADMIN', 'EXECUTIVE', 'INTAKE_OFFICER'].includes(userRole)}
            />
          </div>
        </Card>
      </motion.div>

      <TriageModal
        isOpen={!!triageComplaint}
        onClose={() => setTriageComplaint(null)}
        complaint={triageComplaint}
        onTriage={handleTriage}
      />

      <ComplaintDetailsModal 
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        complaint={selectedComplaint}
        userRole={userRole}
        getStatusVariant={getStatusVariant}
        getPriorityVariant={getPriorityVariant}
      />
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
