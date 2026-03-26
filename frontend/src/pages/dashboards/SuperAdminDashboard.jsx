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
import ProvisionTenantModal from '../../components/dashboard/ProvisionTenantModal';
import ManageTenantUsersDrawer from '../../components/dashboard/ManageTenantUsersDrawer';

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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Organization Registry</h1>
          <p className="text-slate-500 text-sm font-medium">Global governance and tenant environment management</p>
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

      <div className="mb-4" />

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

      <ProvisionTenantModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleCreateTenant}
        submitting={submitting}
      />

      <ManageTenantUsersDrawer
        isOpen={!!managingTenant}
        onClose={() => setManagingTenant(null)}
        tenant={managingTenant}
      />

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
