import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Stat from '../../components/ui/Stat';
import {
  FileText, Clock, CheckCircle, Users, UserPlus, MessageSquare, ChevronRight, Settings, Search, ArrowUpDown, Shield
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
  const [triageComplaint, setTriageComplaint] = useState(null);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const userRole = user?.role || 'EMPLOYEE';
  const [filterStatus, setFilterStatus] = useState(userRole === 'ADMIN' ? 'ASSIGNED' : 'ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt,desc');

  const tenantDomain = localStorage.getItem('tenantDomain') || 'Organization';

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0); // reset page when search actually fires
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    fetchData();
    fetchTeamData();
  }, [page, filterStatus, debouncedSearch, sortBy]);

  const fetchData = async () => {
    if (userRole === 'ADMIN') return;
    
    setLoading(true);
    try {
      let endpoint = `/complaints/all?page=${page}&size=10&sort=${sortBy}`;
      if (filterStatus !== 'ALL') {
        endpoint += `&status=${filterStatus}`;
      }
      if (debouncedSearch.trim() !== '') {
        endpoint += `&category=${encodeURIComponent(debouncedSearch)}`;
      }
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
      case 'ADMIN': return 'Triage / Oversight Center';
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
            {userRole === 'ADMIN' ? 'Triage and prioritize incoming reports and oversight' :
                `Management console for ${tenantDomain}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center gap-2 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-700 tracking-widest">Live System Connected</span>
          </div>
          {userRole === 'ORG_ADMIN' && (
            <div className="flex items-center gap-3">
              <button
                className="btn btn-primary h-11 px-6 shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                onClick={() => setShowAddEmployee(true)}
              >
                <UserPlus size={18} />
                <span>Add Employee</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {['ORG_ADMIN', 'ADMIN'].includes(userRole) && (
      <div className="metrics-grid">
        <Stat label="Total Users Enrolled" value={allTeam.length} icon={Users} />
        <Stat label="Active Personnel" value={allTeam.filter(u => u.active !== false).length} icon={CheckCircle} />
        <Stat label="System Settings" value={4} icon={Settings} />
      </div>
      )}

      {['ORG_ADMIN', 'ADMIN'].includes(userRole) && (
      <motion.div variants={itemVariants}>
        <Card title="Setup Configuration" subtitle="Organization administrative actions">
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Shield className="text-slate-200 mb-6" size={64} />
            <h3 className="text-xl font-bold text-slate-800 mb-2">System Administration Active</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Welcome to the setup console. Use the sidebar navigation to manage workforce registries, roles, and functional configurations.</p>
          </div>
        </Card>
      </motion.div>
      )}

      <TriageModal
        isOpen={!!triageComplaint}
        onClose={() => setTriageComplaint(null)}
        complaint={triageComplaint}
        onTriage={handleTriage}
      />


      <AddUserModal
        isOpen={showAddEmployee}
        onClose={() => setShowAddEmployee(false)}
        onSave={handleSaveUser}
        title="Add Employee"
      />
    </div>
  );
};

const getStatusVariant = (status) => {
  switch (status) {
    case 'RESOLVED': case 'CLOSED': return 'success';
    case 'INVESTIGATING':
    case 'SUBMITTED': case 'TRIAGED': return 'warning';
    case 'UNDER_REVIEW':
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
