import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import MessageBoard from '../../components/ui/MessageBoard';
import {
  ArrowLeft,
  Shield,
  Clock,
  FileText,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Activity,
  ChevronRight,
  User,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';

const InvestigationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCaseData();
  }, [id]);

  const fetchCaseData = async () => {
    setLoading(true);
    try {
      const [compResp, actResp] = await Promise.all([
        api.get(`/complaints/${id}`),
        api.get(`/complaints/activities/${id}`)
      ]);
      setComplaint(compResp.data);
      setActivities(actResp.data);
    } catch (err) {
      console.error('Failed to fetch case details');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status) => {
    try {
      await api.put(`/complaints/${id}/status?status=${status}`);
      fetchCaseData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <span className="text-sm font-bold text-text-muted uppercase tracking-widest">Decrypting Case Data...</span>
    </div>
  );

  if (!complaint) return (
    <div className="card p-20 text-center">
      <AlertTriangle className="mx-auto text-danger mb-4" size={40} />
      <h2 className="text-xl font-bold text-white mb-2">Case Not Found</h2>
      <button onClick={() => navigate(-1)} className="btn btn-secondary">Go Back</button>
    </div>
  );

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-text-secondary hover:text-white hover:border-white/20 transition-all group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Badge variant={getStatusVariant(complaint.status)}>{complaint.status?.replace(/_/g, ' ')}</Badge>
              <span className="text-xs font-mono text-text-muted tracking-widest font-bold">{complaint.trackingId}</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">{complaint.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex flex-col items-end mr-2">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Classification</span>
            <span className="text-sm font-bold text-primary">{complaint.classification?.replace(/_/g, ' ') || 'STANDARD'}</span>
          </div>
          <select
            className="input-field w-auto! py-2.5! px-4! font-bold text-sm bg-primary/10 border-primary/20 hover:border-primary transition-colors cursor-pointer"
            value={complaint.status}
            onChange={(e) => updateStatus(e.target.value)}
          >
            {['SUBMITTED', 'TRIAGED', 'ASSIGNED', 'INVESTIGATION', 'WAITING_FOR_REPORTER', 'RESOLVED', 'CLOSED'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Details & Communication */}
        <div className="lg:col-span-8 space-y-8">
          <Card title="Case Intelligence" subtitle="Detailed information and reporter statement.">
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <FileText size={48} />
                </div>
                <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Reporter Statement</h4>
                <p className="text-text-primary text-base font-medium leading-relaxed italic opacity-90">
                  "{complaint.description}"
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-0.5">Category</p>
                    <p className="text-sm font-bold text-white">{complaint.categoryName || 'Uncategorized'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center text-success">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-0.5">Reported On</p>
                    <p className="text-sm font-bold text-white">{new Date(complaint.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="glass-card p-0! overflow-hidden h-[600px] flex flex-col">
            <div className="px-8 py-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">Secure Communication Log</h3>
              </div>
              <Badge variant="primary">SECURE CHANNEL</Badge>
            </div>
            <div className="flex-1 min-h-0 bg-bg-secondary/30">
              <MessageBoard complaintId={complaint.id} isStaff={true} />
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Meta */}
        <div className="lg:col-span-4 space-y-8">
          <Card title="Activity Audit" subtitle="Full trail of system and staff actions.">
            <div className="space-y-6 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-white/5">
              {activities.map((act, i) => (
                <div key={i} className="relative pl-8">
                  <div className="absolute left-1 top-1.5 w-3 h-3 rounded-full bg-bg-surface border-2 border-primary z-10 shadow-[0_0_8px_var(--primary)]" />
                  <div>
                    <p className="text-xs font-bold text-white mb-1 uppercase tracking-tight">{act.action.replace(/_/g, ' ')}</p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase opacity-60">
                      <Clock size={12} />
                      {new Date(act.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Administrative" subtitle="Case metadata and ownership.">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Assigned To</span>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <User size={12} className="text-primary" />
                  </div>
                  <span className="text-xs font-bold text-white">{complaint.assignedToUsername || 'Unassigned'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Priority</span>
                <Badge variant={getPriorityVariant(complaint.priority)}>{complaint.priority || 'NORMAL'}</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Evidence</span>
                <span className="text-xs font-bold text-white">{complaint.evidenceCount || 0} Files</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
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
    case 'CRITICAL': case 'URGENT': return 'danger';
    case 'HIGH': return 'warning';
    case 'NORMAL': return 'primary';
    case 'LOW': return 'secondary';
    default: return 'secondary';
  }
};

export default InvestigationDetails;
