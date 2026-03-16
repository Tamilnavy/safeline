import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Stat from '../../components/ui/Stat';
import { 
  Plus, Globe, Building, ShieldCheck, Users, Activity, X, UserPlus, AlertCircle, RefreshCw, Building2
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

  const openManageUsers = async (tenant) => {
    setManagingTenant(tenant);
    setLoadingUsers(true); setTenantUsers([]);
    try {
      const resp = await api.get(`/tenants/${tenant.id}/users`);
      setTenantUsers(resp.data);
    } catch (err) { console.error('Failed to load users'); }
    finally { setLoadingUsers(false); }
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-1">Platform Overview</h1>
          <p className="text-text-secondary text-sm font-medium">Global governance and infrastructure monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            disabled={loading}
            onClick={fetchData} 
            className="btn btn-secondary"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Sync</span>
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            <span>Provision Tenant</span>
          </button>
        </div>
      </header>

      <div className="metrics-grid">
        <Stat 
          label="Global Tenants" 
          value={metrics.totalTenants} 
          icon={Building2} 
          color="#5e6ad2"
        />
        <Stat 
          label="Platform Users" 
          value={metrics.totalUsers} 
          icon={Users} 
          color="#4ade80"
        />
        <Stat 
          label="Secure Reports" 
          value={metrics.totalComplaints} 
          icon={ShieldCheck} 
          color="#5e6ad2"
        />
        <Stat 
          label="Network Health" 
          value="99.9%" 
          icon={Activity} 
          color="#4ade80"
        />
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card !border-danger/20 !bg-danger/5 p-4 flex items-center gap-4 text-danger font-bold"
        >
          <AlertCircle size={20} />
          <p>Connectivity Alert: {error}</p>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Card title="Organization Directory" subtitle="Real-time listing of all provisioned tenant environments.">
          <div className="overflow-x-auto -mx-8">
            <div className="px-8">
              <TenantTable 
                tenants={tenants} 
                loading={loading} 
                onManage={openManageUsers} 
                onDelete={handleDeleteTenant} 
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Add Tenant Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-bg-primary/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card relative w-full max-w-lg p-10 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-hover" />
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-white">Provision Organization</h3>
                  <p className="text-sm text-text-muted mt-1">Spin up a new secure environment</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-white/5 text-text-muted transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateTenant} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Organization Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all" 
                      placeholder="e.g. Acme Global" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Domain Identifier</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all" 
                        placeholder="acme" 
                        value={formData.domain} 
                        onChange={(e) => setFormData({...formData, domain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})} 
                        required 
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-text-muted">.safeline.io</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Initial Organization Admin</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Admin Username</label>
                      <input 
                        type="text" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all" 
                        placeholder="admin_acme" 
                        value={formData.adminUsername} 
                        onChange={(e) => setFormData({...formData, adminUsername: e.target.value})} 
                        required 
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Admin Email</label>
                        <input 
                          type="email" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all" 
                          placeholder="admin@acme.com" 
                          value={formData.adminEmail} 
                          onChange={(e) => setFormData({...formData, adminEmail: e.target.value})} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Admin Password</label>
                        <input 
                          type="password" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all" 
                          placeholder="••••••••" 
                          value={formData.adminPassword} 
                          onChange={(e) => setFormData({...formData, adminPassword: e.target.value})} 
                          required 
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn btn-primary flex-1 shadow-lg shadow-primary/20" disabled={submitting}>
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
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setManagingTenant(null)}
              className="absolute inset-0 bg-bg-primary/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-[#0b0f1a] border-l border-white/5 p-8 flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-xl font-black text-white">Manage Members</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Building size={14} className="text-primary" />
                    <p className="text-sm font-bold text-primary">{managingTenant.name}</p>
                  </div>
                </div>
                <button onClick={() => setManagingTenant(null)} className="p-2 rounded-xl hover:bg-white/5 text-text-muted transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-6">Current Members</h4>
                
                {loadingUsers ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}
                  </div>
                ) : tenantUsers.length === 0 ? (
                  <div className="text-center py-12 glass-card border-dashed">
                    <Users size={40} className="mx-auto text-white/5 mb-3" />
                    <p className="text-sm text-text-muted font-bold">No users provisioned.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tenantUsers.map(u => (
                      <motion.div 
                         key={u.id} 
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         className="glass-card !p-4 border-white/5 hover:border-white/10 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-white mb-1">{u.username}</p>
                            <p className="text-xs text-text-muted font-medium">{u.email}</p>
                          </div>
                          <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest">
                            {u.role.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-8 border-t border-white/5 mt-8">
                <p className="text-xs text-text-muted text-center italic">
                  User management is restricted to Organization Administrators.
                </p>
              </div>
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
          { value: 'ORG_ADMIN', label: 'Org Admin' },
          { value: 'INVESTIGATOR', label: 'Investigator' },
          { value: 'INTAKE_OFFICER', label: 'Intake Officer' },
          { value: 'HR_MANAGER', label: 'HR Manager' },
          { value: 'COMPLIANCE_OFFICER', label: 'Compliance Officer' },
          { value: 'EMPLOYEE', label: 'Employee' }
        ]}
        initialRole="ORG_ADMIN"
      />
    </motion.div>
  );
};

export default SuperAdminDashboard;
