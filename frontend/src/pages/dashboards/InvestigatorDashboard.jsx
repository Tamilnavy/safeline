import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Stat from '../../components/ui/Stat';
import Badge from '../../components/ui/Badge';
import {
  Clock, CheckCircle, ShieldAlert, FileText, ChevronRight, Activity, Search, ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBoard from '../../components/ui/MessageBoard';
import ComplaintTable from '../../components/dashboard/ComplaintTable';
import TriageModal from '../../components/dashboard/TriageModal';
import { useAuth } from '../../context/AuthContext';

const InvestigatorDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt,desc');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedCase, setSelectedCase] = useState(null);
  const [triageComplaint, setTriageComplaint] = useState(null);
  const [investigators, setInvestigators] = useState([]);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const isLead = user?.committeePermissions?.includes('COMMITTEE_LEAD');
  const isEscalation = user?.committeePermissions?.includes('ESCALATION_HEAD');
  const isHandler = user?.committeePermissions?.includes('COMPLAINT_HANDLER');
  const isOrgAdmin = ['ORG_ADMIN', 'ADMIN'].includes(user?.role);
  
  const statusStages = ['ALL', 'SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'];

  useEffect(() => {
    // Wait until auth context has finished loading before fetching
    if (authLoading || !user) return;
    fetchData();
    // Allow management roles to see investigator list for re-assignment if needed
    if (isLead || isEscalation || ['ORG_ADMIN', 'ADMIN'].includes(user?.role)) {
      fetchInvestigators();
    }
  }, [page, filter, searchTerm, sortBy, user, authLoading]);


  const fetchInvestigators = async () => {
    try {
      const resp = await api.get('/admin/users/investigators');
      setInvestigators(resp.data);
    } catch (err) {
      console.error('Failed to fetch investigators');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Logic: Leads, Escalation Heads, and Org Admins see the "all" view (filtered by backend)
      // Standard handlers see only "assigned"
      const baseEndpoint = (isLead || isEscalation || isOrgAdmin) ? '/complaints/all' : '/complaints/assigned';

      const queryParams = [];
      if (filter !== 'ALL') queryParams.push(`status=${filter}`);
      if (searchTerm.trim() !== '') queryParams.push(`search=${encodeURIComponent(searchTerm.trim())}`);
      queryParams.push(`sort=${sortBy}`);
      queryParams.push(`page=${page}&size=10`);

      const endpoint = `${baseEndpoint}?${queryParams.join('&')}`;
      const resp = await api.get(endpoint);
      setComplaints(resp.data.content);
      setTotalPages(resp.data.totalPages);
    } catch (err) {
      console.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Debounced Search implementation
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(0);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/complaints/${id}/status?status=${status}`);
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleAssign = async (complaintId, investigatorId) => {
    try {
      await api.put(`/complaints/${complaintId}/assign?investigatorId=${investigatorId}`);
      fetchData();
    } catch (err) {
      alert('Failed to assign investigator');
    }
  };

  const handleTriage = async (id, data) => {
    try {
      await api.put(`/complaints/${id}/triage?priority=${data.priority}&classification=${data.classification}${data.status ? `&status=${data.status}` : ''}`);
      fetchData();
    } catch (err) {
      alert('Failed to update triage details');
    }
  };

  const getDashboardTitle = () => {
    if (isEscalation) return 'Escalation Intelligence';
    if (isLead || isOrgAdmin) return 'Committee Oversight';
    if (isHandler) return 'Case Investigation';
    return 'Specialized Intelligence';
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">{getDashboardTitle()}</h1>
          <p className="text-slate-500 text-sm font-medium">
            {isLead || isEscalation ? 'Global organization oversight and routing' : 'Personal assignments and case monitor'}
          </p>
        </div>
      </header>

      {/* Filter and Search Bar */}
      <div className="flex flex-col mb-4">
         <div className="relative w-full sm:max-w-md">
           <input
             type="text"
             placeholder="Search tracking ID, Title, or Reporter..."
             className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm"
             value={searchInput}
             onChange={(e) => setSearchInput(e.target.value)}
           />
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
         </div>
      </div>

      <motion.div variants={itemVariants}>
        <Card
          title="Case Inventory"
          subtitle={isLead || isEscalation ? "Overview of all reports requiring your attention." : "Reports explicitly assigned to you for investigation."}
        >
          <div className="overflow-x-auto table-container border-none shadow-none p-0!">
            <ComplaintTable
              complaints={complaints}
              investigators={investigators}
              loading={loading}
              page={page}
              totalPages={totalPages}
              filterStatus={filter}
              isLead={isLead}
              isEscalation={isEscalation}
              isHandler={isHandler}
              showAssignment={isLead || isOrgAdmin}
              onAssign={handleAssign}
              onUpdateStatus={updateStatus}
              onPageChange={setPage}
              onFilterChange={(s) => { setFilter(s); setPage(0); }}
              onViewDetails={(complaint) => navigate(`/dashboard/complaint/${complaint.id}`)}
              onTriage={setTriageComplaint}
              sortBy={sortBy}
              onSortChange={setSortBy}
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
    </div>
  );
};

const getStatusVariant = (status) => {
  switch (status) {
    case 'RESOLVED': case 'CLOSED': return 'success';
    case 'ASSIGNED': case 'IN_PROGRESS': return 'primary';
    case 'ON_HOLD': return 'warning';
    case 'REOPENED': return 'danger';
    default: return 'warning';
  }
};

export default InvestigatorDashboard;
