import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Stat from '../../components/ui/Stat';
import Badge from '../../components/ui/Badge';
import { PlusCircle, Search, MessageSquare, ArrowUpRight, ShieldCheck, ChevronLeft, ChevronRight, FileText, Clock, AlertTriangle, ExternalLink, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBoard from '../../components/ui/MessageBoard';

const EmployeeDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [summary, setSummary] = useState({ total: 0, pending: 0, resolved: 0 });
  const [selectedComplaint, setSelectedComplaint] = useState(null);

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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">My Reports</h1>
          <p className="text-slate-500 text-sm font-medium">Personal reporting console and case tracking</p>
        </div>
        <Link to="/submit" className="btn btn-primary h-11 px-6 shadow-lg shadow-indigo-600/20">
          <PlusCircle size={18} className="mr-2" />
          <span>New Report</span>
        </Link>
      </header>

      <div className="metrics-grid max-w-5xl mx-auto lg:grid-cols-3">
        <Stat label="Total Submissions" value={summary.total} icon={FileText} />
        <Stat label="Active Cases" value={summary.pending} icon={Clock} />
        <Stat label="Resolved" value={summary.resolved} icon={ShieldCheck} />
      </div>

      <motion.div variants={itemVariants}>
        <Card 
          title="Recent Activities" 
          subtitle="Tracking logs for your encrypted submissions."
        >
          {loading ? (
            <div className="py-24 text-center">
              <div className="inline-block w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <div className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Synchronizing history...</div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Search size={32} className="text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No activity logs found</h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">
                Your workspace is currently empty. Start by filing a secure report to track its progress here.
              </p>
              <Link to="/submit" className="btn btn-secondary px-10! h-11 inline-flex items-center decoration-none">Get Started</Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="w-full text-left">
                <thead>
                  <tr className="table-header">
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Ref ID</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Operational Logs</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Stage</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {complaints.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="table-row group"
                    >
                      <td className="px-8 py-5">
                        <span className="text-indigo-600 font-bold text-xs tracking-tighter">{c.trackingId}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-900 mb-1 tracking-tight text-sm group-hover:text-indigo-600 transition-colors uppercase">{c.title}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Filed {new Date(c.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-8 py-5">
                        <Badge variant={c.status === 'RESOLVED' || c.status === 'CLOSED' ? 'success' : 'warning'}>
                          {c.status?.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => setSelectedComplaint(c)} 
                          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-all decoration-none bg-none border-none p-0 cursor-pointer"
                        >
                          Track Details
                          <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex justify-end items-center gap-4 px-8 py-6 border-t border-slate-50 bg-slate-50/30">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Page {page + 1} of {totalPages}</span>
                  <div className="flex gap-2">
                    <button 
                      disabled={page === 0}
                      onClick={() => setPage(prev => prev - 1)}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button 
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(prev => prev + 1)}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </motion.div>

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
                    <Badge variant={['RESOLVED', 'CLOSED'].includes(selectedComplaint.status) ? 'success' : 'warning'}>
                      {selectedComplaint.status?.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{selectedComplaint.trackingId}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedComplaint(null)} className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 flex min-h-0 bg-white">
                <div className="flex-[0.8] p-10 border-r border-slate-100 overflow-y-auto">
                  <div className="mb-10">
                    <h3 className="text-2xl font-bold text-slate-900 leading-tight mb-4 uppercase">{selectedComplaint.title}</h3>
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl shadow-inner">
                      <p className="text-slate-600 font-medium leading-relaxed italic">"{selectedComplaint.description}"</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</p>
                      <p className="font-semibold text-slate-900">{selectedComplaint.categoryName || 'General Ethics'}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Submission Date</p>
                      <p className="font-bold text-indigo-600">{new Date(selectedComplaint.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-[1.2] flex flex-col min-h-0 bg-slate-50/30">
                  <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center gap-2 shadow-sm">
                    <MessageSquare size={16} className="text-indigo-600" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-900">Secure Communication Log</span>
                  </div>
                  <div className="flex-1 min-h-0">
                    <MessageBoard complaintId={selectedComplaint.id} isStaff={false} />
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

export default EmployeeDashboard;
