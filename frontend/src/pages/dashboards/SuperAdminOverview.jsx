import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Stat from '../../components/ui/Stat';
import { 
  Users, ShieldCheck, Building2, RefreshCw, Activity, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const SuperAdminOverview = () => {
  const [metrics, setMetrics] = useState({ totalTenants: 0, totalComplaints: 0, totalUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const resp = await api.get('/tenants/metrics');
      setMetrics(resp.data);
    } catch (err) {
      setError('Failed to fetch platform metrics.');
      console.error('Metrics fetch failed');
    } finally { setLoading(false); }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Platform Overview</h1>
          <p className="text-slate-500 text-sm font-medium">Aggregated metrics and system-wide performance status</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            disabled={loading}
            onClick={fetchData} 
            className="btn btn-secondary h-10 px-4"
          >
            <RefreshCw size={16} className={`${loading ? 'animate-spin' : ''} mr-2`} />
            <span>Sync Stats</span>
          </button>
        </div>
      </header>

      <div className="metrics-grid max-w-2xl mx-auto lg:grid-cols-2">
        <Stat label="Total Organizations" value={metrics.totalTenants} icon={Building2} />
        <Stat label="Platform Users" value={metrics.totalUsers} icon={Users} />
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-4 text-rose-700 font-bold shadow-sm"
        >
          <AlertCircle size={20} />
          <p>Status Alert: {error}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={itemVariants}>
          <Card title="Platform Distribution" subtitle="Active tenant environments and user allocation.">
             <div className="py-12 flex flex-col items-center justify-center text-center">
                <Building2 size={48} className="text-slate-200 mb-4" />
                <p className="text-slate-500 font-medium">Platform is currently serving {metrics.totalTenants} organizations across distributed nodes.</p>
             </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card title="Quick Actions" subtitle="Frequently used administrative tools.">
             <div className="grid grid-cols-2 gap-4 py-2">
                <button 
                  onClick={() => window.location.href = '/dashboard/registry'}
                  className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100 hover:border-indigo-300 transition-all text-left group"
                >
                   <Building2 className="text-indigo-600 mb-3 group-hover:scale-110 transition-transform" size={24} />
                   <p className="font-bold text-slate-900 text-sm">Manage Registry</p>
                   <p className="text-[10px] text-slate-500 font-medium mt-1">Add or remove organizations</p>
                </button>
             </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SuperAdminOverview;
