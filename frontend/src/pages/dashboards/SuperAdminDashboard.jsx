import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Stat from '../../components/ui/Stat';
import Badge from '../../components/ui/Badge';
import { 
  Plus, Globe, Building, ShieldCheck, Shield, Users, Activity, X, UserPlus, AlertCircle, RefreshCw, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Modular Components
import AddUserModal from '../../components/dashboard/AddUserModal';
import TenantTable from '../../components/dashboard/TenantTable';

const SuperAdminDashboard = () => {
  const [tenants, setTenants] = useState([]);
  const [metrics, setMetrics] = useState({ totalTenants: 0, totalComplaints: 0, totalUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    domain: '',
    adminUsername: '',
    adminEmail: '',
    adminPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

  // Tenant user management state
  const [managingTenant, setManagingTenant] = useState(null);
  const [tenantUsers, setTenantUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const [tenantsResp, metricsResp] = await Promise.all([api.get('/tenants'), api.get('/tenants/metrics')]);
      setTenants(tenantsResp.data);
      setMetrics(metricsResp.data);
    } catch (err) {
      setError('Connection refused or unauthorized access.');
      console.error('Failed to fetch platform data');
    } finally { setLoading(false); }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/tenants', formData);
      setShowModal(false); 
      setFormData({ 
        name: '', 
        domain: '',
        adminUsername: '',
        adminEmail: '',
        adminPassword: ''
      });
      fetchData();
    } catch (err) { alert('Failed to create organization.'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteTenant = async (id) => {
    if (!window.confirm('Delete organization? Irreversible action.')) return;
    try { await api.delete(`/tenants/${id}`); fetchData(); }
    catch (err) { alert('Failed to delete organization.'); }
  };

  const openManageUsers = (tenant) => {
    setManagingTenant(tenant);
  };

  const handleSaveTenantUser = async (userData) => {
    try {
      await api.post(`/tenants/${managingTenant.id}/users`, userData);
      const resp = await api.get(`/tenants/${managingTenant.id}/users`);
      setTenantUsers(resp.data);
    } catch (err) {
      alert('Failed to save user.');
    }
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
          <p className="text-slate-500 text-sm font-medium">Global governance and infrastructure monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            disabled={loading}
            onClick={fetchData} 
            className="btn btn-secondary h-10 px-4"
          >
            <RefreshCw size={16} className={`${loading ? 'animate-spin' : ''} mr-2`} />
            <span>Refresh Sync</span>
          </button>
          <button className="btn btn-primary h-10 px-4" onClick={() => setShowModal(true)}>
            <Plus size={18} className="mr-2" />
            <span>Provision Tenant</span>
          </button>
        </div>
      </header>

      <div className="metrics-grid">
        <Stat label="Global Tenants" value={metrics.totalTenants} icon={Building2} />
        <Stat label="Platform Users" value={metrics.totalUsers} icon={Users} trend={12} />
        <Stat label="Secure Reports" value={metrics.totalComplaints} icon={ShieldCheck} trend={5} />
        <Stat label="Network Health" value="99.9%" icon={Activity} />
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-4 text-rose-700 font-bold shadow-sm"
        >
          <AlertCircle size={20} />
          <p>Connectivity Alert: {error}</p>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Card title="Organization Directory" subtitle="Real-time listing of all provisioned tenant environments.">
          <div className="overflow-x-auto">
            <TenantTable 
              tenants={tenants} 
              loading={loading} 
              onManage={openManageUsers} 
              onDelete={handleDeleteTenant} 
            />
          </div>
        </Card>
      </motion.div>

      {/* Add Tenant Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white relative w-full max-w-lg p-10 rounded-2xl shadow-2xl border border-slate-200"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600 rounded-t-2xl" />
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Provision Organization</h3>
                  <p className="text-sm text-slate-500 mt-1">Spin up a new secure environment</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateTenant} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Organization Name</label>
                  <input 
                    type="text" 
                    className="input-field h-12" 
                    placeholder="e.g. Acme Global" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Domain Identifier</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="input-field h-12 pr-28" 
                      placeholder="acme" 
                      value={formData.domain} 
                      onChange={(e) => setFormData({...formData, domain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})} 
                      required 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">.safeline.io</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Admin Username</label>
                    <input 
                      type="text" 
                      className="input-field h-12" 
                      placeholder="admin" 
                      value={formData.adminUsername} 
                      onChange={(e) => setFormData({...formData, adminUsername: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Admin Email</label>
                    <input 
                      type="email" 
                      className="input-field h-12" 
                      placeholder="admin@email.com" 
                      value={formData.adminEmail} 
                      onChange={(e) => setFormData({...formData, adminEmail: e.target.value})} 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Initial Password</label>
                  <input 
                    type="password" 
                    className="input-field h-12" 
                    placeholder="••••••••" 
                    value={formData.adminPassword} 
                    onChange={(e) => setFormData({...formData, adminPassword: e.target.value})} 
                    required 
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1 h-12">Cancel</button>
                  <button type="submit" className="btn btn-primary flex-1 h-12 shadow-md shadow-indigo-600/20" disabled={submitting}>
                    {submitting ? 'Provisioning...' : 'Confirm Launch'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Slide-out User Management */}
      <AnimatePresence>
        {managingTenant && (
          <div className="fixed inset-0 z-100 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setManagingTenant(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white border-l border-slate-200 p-8 flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Manage Members</h3>
                  <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full w-fit">
                    <Building size={14} className="text-indigo-600" />
                    <p className="text-xs font-bold text-indigo-700 tracking-tight">{managingTenant.name}</p>
                  </div>
                </div>
                <button onClick={() => setManagingTenant(null)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-thin">
                {managingTenant.adminUsername && (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-100 transition-all group/admin">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-slate-100 text-indigo-600 shadow-sm group-hover/admin:shadow-indigo-100/50 transition-all">
                        <Shield size={22} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Root Organization Admin</p>
                        <p className="text-lg font-bold text-slate-900 leading-tight">{managingTenant.adminUsername}</p>
                        <p className="text-xs text-slate-500 font-medium">{managingTenant.adminEmail}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl">
                  <Users size={32} className="text-slate-200 mb-4" />
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Sensitive Data Shield Active</p>
                  <p className="text-[10px] text-slate-400 mt-2">All internal investigators and staff records are protected. Super Admin authority is restricted to administrative provisioning.</p>
                </div>
              </div>

              {/* Actions removed as per user request to limit Super Admin role to initial provisioning */}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AddUserModal 
        isOpen={showAddUser}
        onClose={() => setShowAddUser(false)}
        onSave={handleSaveTenantUser}
        title={`Add Member to ${managingTenant?.name}`}
        roles={[
          { value: 'ORG_ADMIN', label: 'Org Admin' }
        ]}
        initialRole="ORG_ADMIN"
      />
    </motion.div>
  );
};

export default SuperAdminDashboard;
