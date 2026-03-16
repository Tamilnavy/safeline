import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Stat from '../../components/ui/Stat';
import Badge from '../../components/ui/Badge';
import { PlusCircle, Search, MessageSquare, ArrowUpRight, ShieldCheck, ChevronLeft, ChevronRight, FileText, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const EmployeeDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [summary, setSummary] = useState({ total: 0, pending: 0, resolved: 0 });

  useEffect(() => {
    fetchMyComplaints();
  }, [page]);

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const resp = await api.get(`/complaints/my?page=${page}&size=5`);
      setComplaints(resp.data.content);
      setTotalPages(resp.data.totalPages);
      
      const total = resp.data.totalElements;
      const pending = resp.data.content.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
      setSummary({ total, pending, resolved: total - pending });
    } catch (err) {
      console.error('Failed to fetch personal history');
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-1">My Reports</h1>
          <p className="text-text-secondary text-sm font-medium">Personal reporting console and case tracking</p>
        </div>
        <Link to="/submit" className="btn btn-primary">
          <PlusCircle size={18} />
          <span>New Report</span>
        </Link>
      </header>

      <div className="metrics-grid">
        <Stat label="Total Submissions" value={summary.total} icon={FileText} color="#5e6ad2" />
        <Stat label="Active Cases" value={summary.pending} icon={Clock} color="#facc15" />
        <Stat label="Resolved" value={summary.resolved} icon={ShieldCheck} color="#4ade80" />
        <Stat label="Privacy Status" value="Secure" icon={ShieldCheck} color="#5e6ad2" />
      </div>

      <motion.div variants={itemVariants}>
        <Card 
          title="Recent Activities" 
          subtitle="Tracking logs for your encrypted submissions."
        >
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
              <div className="text-text-muted font-bold animate-pulse">Synchronizing history...</div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-text-muted opacity-20" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No activity logs found</h3>
              <p className="text-text-muted max-w-md mx-auto mb-8 font-medium">
                Your workspace is currently empty. Start by filing a secure report to track its progress here.
              </p>
              <Link to="/submit" className="btn btn-secondary !px-8 decoration-none">Get Started</Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-8 relative">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              <table className="w-full text-left">
                <thead className="border-b border-white/5 bg-white/[0.02]">
                  <tr>
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">Tracking Ref</th>
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">Incident Context</th>
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">Current Stage</th>
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {complaints.map((c, i) => (
                    <motion.tr 
                      key={c.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-white/[0.03] transition-all group cursor-default"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:scale-125 transition-transform shadow-[0_0_8px_rgba(79,70,229,0.3)]" />
                           <span className="text-primary font-black tracking-widest text-[11px] font-mono">{c.trackingId}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="font-bold text-white mb-0.5 uppercase tracking-tight text-xs group-hover:text-primary transition-colors">{c.title}</div>
                        <div className="text-[9px] text-text-muted font-black uppercase tracking-[0.1em] opacity-40">Submitted {new Date(c.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-8 py-5">
                        <Badge variant={c.status === 'RESOLVED' || c.status === 'CLOSED' ? 'success' : 'warning'}>
                          {c.status?.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Link 
                          to="/track" 
                          state={{ trackingId: c.trackingId }} 
                          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-white transition-all decoration-none group/link"
                        >
                          Access Intelligence
                          <ExternalLink size={12} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex justify-end gap-3 px-8 py-6 border-t border-white/5">
                  <button 
                    disabled={page === 0}
                    onClick={() => setPage(prev => prev - 1)}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(prev => prev + 1)}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default EmployeeDashboard;
