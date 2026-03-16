import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Stat from '../../components/ui/Stat';
import Badge from '../../components/ui/Badge';
import { 
  Clock, CheckCircle, ShieldAlert, FileText, X, MessageSquare, ChevronRight, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBoard from '../../components/ui/MessageBoard';
import ComplaintTable from '../../components/dashboard/ComplaintTable';
import { useAuth } from '../../context/AuthContext';

const InvestigatorDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 });
  const [selectedCase, setSelectedCase] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.role || 'INVESTIGATOR';

  useEffect(() => {
    fetchData();
    fetchMetrics();
  }, [page, filter]);

  const fetchMetrics = async () => {
    try {
      const resp = await api.get('/complaints/metrics');
      setStats(resp.data);
    } catch (err) {
      console.error('Failed to fetch metrics');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = filter === 'ALL' ? '/complaints/assigned' : `/complaints/assigned?status=${filter}`;
      const resp = await api.get(`${endpoint}${endpoint.includes('?') ? '&' : '?'}page=${page}&size=10`);
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
      fetchMetrics();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const getDashboardTitle = () => {
    switch(userRole) {
      case 'HR_MANAGER': return 'Personnel Workspace';
      case 'COMPLIANCE_OFFICER': return 'Protocol Workspace';
      default: return 'Intelligence Workspace';
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
          <p className="text-text-secondary text-sm font-medium">Incident monitoring and response console</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full bg-success/10 border border-success/20 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] font-bold text-success uppercase tracking-wider">Live System Connected</span>
          </div>
        </div>
      </header>

      <div className="metrics-grid">
        <Stat label="Active Leads" value={stats.total} icon={FileText} color="#5e6ad2" />
        <Stat label="Pending Triage" value={stats.pending} icon={Clock} color="#facc15" />
        <Stat label="Cases Finalized" value={stats.resolved} icon={CheckCircle} color="#4ade80" />
        <Stat label="Service Status" value="Optimal" icon={Activity} color="#5e6ad2" />
      </div>

      <motion.div variants={itemVariants}>
        <Card 
          title="Case Inventory" 
          subtitle="Manage investigation workflow and update complaint status."
        >
          <div className="overflow-x-auto -mx-8">
            <div className="px-8">
              <ComplaintTable 
                complaints={complaints}
                loading={loading}
                page={page}
                totalPages={totalPages}
                filterStatus={filter}
                showAssignment={false}
                onUpdateStatus={updateStatus}
                onPageChange={setPage}
                onFilterChange={(s) => { setFilter(s); setPage(0); }}
                onViewDetails={(c) => navigate(`/dashboard/complaint/${c.id}`)}
              />
            </div>
          </div>
        </Card>
      </motion.div>

      <AnimatePresence>
        {selectedCase && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCase(null)}
              className="absolute inset-0 bg-bg-primary/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="glass-card relative w-full h-full max-w-6xl max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-hover" />
              <div className="h-16 px-8 flex items-center justify-between border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-3">
                   <Badge variant={getStatusVariant(selectedCase.status)}>{selectedCase.status}</Badge>
                   <span className="text-[10px] font-bold text-text-muted tracking-widest">{selectedCase.trackingId}</span>
                </div>
                <button onClick={() => setSelectedCase(null)} className="p-2 rounded-xl hover:bg-white/5 text-text-muted transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 flex min-h-0">
                <div className="flex-[0.7] p-10 border-r border-white/5 overflow-y-auto custom-scrollbar">
                  <div className="mb-10">
                    <h3 className="text-2xl font-black text-white leading-tight mb-4">{selectedCase.title}</h3>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-text-muted font-medium leading-relaxed italic">"{selectedCase.description}"</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Category</p>
                      <p className="font-bold text-white">{selectedCase.categoryName || 'General Ethics'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Classification</p>
                      <p className="font-bold text-primary">{selectedCase.classification?.replace(/_/g, ' ') || 'STANDARD'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-[1.3] flex flex-col min-h-0 bg-white/5">
                  <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-2">
                    <MessageSquare size={16} className="text-primary" />
                    <span className="text-xs font-black uppercase tracking-widest text-white">Secure Investigation Log</span>
                  </div>
                  <div className="flex-1 min-h-0">
                    <MessageBoard complaintId={selectedCase.id} isStaff={true} />
                  </div>
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

export default InvestigatorDashboard;
