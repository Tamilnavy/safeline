import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Stat from '../../components/ui/Stat';
import Badge from '../../components/ui/Badge';
import {
  Clock, CheckCircle, ShieldAlert, FileText, ChevronRight, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBoard from '../../components/ui/MessageBoard';
import ComplaintTable from '../../components/dashboard/ComplaintTable';
import TriageModal from '../../components/dashboard/TriageModal';
import ComplaintDetailsModal from '../../components/dashboard/ComplaintDetailsModal';
import { useAuth } from '../../context/AuthContext';

const InvestigatorDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedCase, setSelectedCase] = useState(null);
  const [triageComplaint, setTriageComplaint] = useState(null);
  const [investigators, setInvestigators] = useState([]);

  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.role || 'INVESTIGATOR';

  useEffect(() => {
    fetchData();
    // Allow management roles to see investigator list for re-assignment if needed
    if (['HR_MANAGER', 'COMPLIANCE_OFFICER', 'ORG_ADMIN'].includes(userRole)) {
      fetchInvestigators();
    }
  }, [page, filter]);


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
      // PER USER REQUEST: All specialized roles only see reports assigned to them.
      const baseEndpoint = '/complaints/assigned';

      const queryParams = [];
      if (filter !== 'ALL') queryParams.push(`status=${filter}`);
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
    switch (userRole) {
      case 'HR_MANAGER': return 'Personnel Intelligence';
      case 'COMPLIANCE_OFFICER': return 'Protocol Intelligence';
      case 'INTAKE_OFFICER': return 'Triage Intelligence';
      case 'EXECUTIVE': return 'Oversight Intelligence';
      case 'INVESTIGATOR': return 'Field Intelligence';
      default: return 'Specialized Intelligence';
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
          <p className="text-slate-500 text-sm font-medium">Personal assignments and case monitor</p>
        </div>
      </header>



      <motion.div variants={itemVariants}>
        <Card
          title="Case Inventory"
          subtitle="Reports explicitly assigned to you for investigation or oversight."
        >
          <div className="overflow-x-auto">
            <ComplaintTable
              complaints={complaints}
              loading={loading}
              page={page}
              totalPages={totalPages}
              filterStatus={filter}
              showAssignment={['HR_MANAGER', 'COMPLIANCE_OFFICER', 'ORG_ADMIN'].includes(userRole)}
              investigators={investigators}
              userRole={userRole}
              onAssign={handleAssign}
              onUpdateStatus={updateStatus}
              onPageChange={setPage}
              onFilterChange={(s) => { setFilter(s); setPage(0); }}
              onViewDetails={setSelectedCase}
              onTriage={setTriageComplaint}
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
        isOpen={!!selectedCase}
        onClose={() => setSelectedCase(null)}
        complaint={selectedCase}
        userRole={userRole}
        getStatusVariant={getStatusVariant}
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

export default InvestigatorDashboard;
