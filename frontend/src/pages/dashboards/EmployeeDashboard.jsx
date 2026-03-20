import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Stat from '../../components/ui/Stat';
import Badge from '../../components/ui/Badge';
import { 
  PlusCircle, Search, ArrowUpRight, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ComplaintDetailsModal from '../../components/dashboard/ComplaintDetailsModal';

const EmployeeDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
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
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 tracking-widest">Ref ID</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 tracking-widest">Operational Logs</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 tracking-widest">Stage</th>
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
                        <div className="font-bold text-slate-900 mb-1 tracking-tight text-sm group-hover:text-indigo-600 transition-colors">{c.title}</div>
                        <div className="text-[10px] text-slate-400 font-bold tracking-widest">Filed {new Date(c.createdAt).toLocaleDateString()}</div>
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

      <ComplaintDetailsModal 
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        complaint={selectedComplaint}
        userRole="EMPLOYEE"
      />
    </div>
  );
};

export default EmployeeDashboard;
