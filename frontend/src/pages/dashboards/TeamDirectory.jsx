import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Users, UserPlus, Mail, ShieldCheck, X, Settings } from 'lucide-react';
import AddUserModal from '../../components/dashboard/AddUserModal';
import { useAuth } from '../../context/AuthContext';

const TeamDirectory = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [filterRole, setFilterRole] = useState('ALL');

  useEffect(() => {
    fetchTeam();
  }, []);

  const getCommitteeRoleLabel = (member) => {
    if (member.role === 'ORG_ADMIN') return 'Organization Admin';
    if (member.role === 'ADMIN') return 'Admin';
    const perms = member.committeePermissions || [];
    if (perms.includes('ESCALATION_HEAD')) return 'Escalation Head';
    if (perms.includes('COMMITTEE_LEAD')) return 'Committee Lead';
    if (perms.includes('COMPLAINT_HANDLER')) return 'Complaint Handler';
    return 'Employee';
  };

  const fetchTeam = async () => {
    try {
      const resp = await api.get('/admin/users/all');
      setTeam(resp.data);
    } catch (err) {
      console.error('Failed to fetch team', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (formData) => {
    await api.post('/admin/users', { ...formData });
    fetchTeam();
    setShowAddUser(false);
  };

  const handleUpdateUser = async (formData) => {
    try {
      await api.put(`/admin/users/${selectedMember.id}`, formData);
      fetchTeam();
      setShowEditUser(false);
      setSelectedMember(null);
    } catch (err) {
      alert('Failed to update employee');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.put(`/admin/users/${id}/toggle-status`);
      fetchTeam();
      setSelectedMember(null);
    } catch (err) { alert('Failed to toggle status'); }
  };

  const handleDeleteUser = async (id) => {
    try {
      await api.delete(`/admin/users/${id}`);
      fetchTeam();
      setSelectedMember(null);
    } catch (err) { alert('Failed to delete user'); }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Team Directory</h1>
          <p className="text-slate-500 text-sm font-medium">Manage and view all enrolled organization staff members.</p>
        </div>
        {(user?.role === 'ORG_ADMIN' || user?.role === 'ADMIN') && (
          <button className="btn btn-primary h-11 px-6 shadow-lg shadow-indigo-600/20" onClick={() => setShowAddUser(true)}>
            <UserPlus size={18} className="mr-2" />
            <span>Add Team Member</span>
          </button>
        )}
      </header>

      {loading ? (
        <div className="py-20 text-center animate-pulse text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Personnel Registry...</div>
      ) : (
        <div className="space-y-6">
          {/* Role Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {['ALL', 'ORG_ADMIN', 'ADMIN', 'COMMITTEE_LEAD', 'COMPLAINT_HANDLER', 'ESCALATION_HEAD', 'EMPLOYEE'].map(role => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm whitespace-nowrap ${
                  filterRole === role
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {role === 'ORG_ADMIN' ? 'ORG ADMINS' : role.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <Card title="Personnel Registry" subtitle="Comprehensive list of investigators, managers, and officers.">
            <div className="table-container border-none shadow-none p-0!">
              <table className="w-full text-left">
                <thead>
                  <tr className="table-header">
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 tracking-widest">Team Member</th>
                    <th className="px-12 py-4 text-xs font-bold text-slate-500 tracking-widest text-center">Employee ID</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 tracking-widest text-right">Role</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {Array.isArray(team) && team
                    .filter(m => {
                      if (!m) return false;
                      if (filterRole === 'ALL') return true;
                      if (filterRole === 'ORG_ADMIN') return m.role === 'ORG_ADMIN';
                      if (filterRole === 'ADMIN') return m.role === 'ADMIN';
                      if (filterRole === 'EMPLOYEE') return m.role === 'EMPLOYEE' && (!m.committeePermissions || m.committeePermissions.length === 0);
                      return m.committeePermissions?.includes(filterRole);
                    })
                    .length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                        No personnel found in this category.
                      </td>
                    </tr>
                  ) : team
                    .filter(m => {
                      if (filterRole === 'ALL') return true;
                      if (filterRole === 'ORG_ADMIN') return m.role === 'ORG_ADMIN';
                      if (filterRole === 'ADMIN') return m.role === 'ADMIN';
                      if (filterRole === 'EMPLOYEE') return m.role === 'EMPLOYEE' && (!m.committeePermissions || m.committeePermissions.length === 0);
                      return m.committeePermissions?.includes(filterRole);
                    })
                    .map(member => (
                    <tr key={member.id} className={`table-row group cursor-pointer hover:bg-slate-50 transition-colors ${member.enabled === false ? 'opacity-60 grayscale-[0.3]' : ''}`} onClick={() => setSelectedMember(member)}>
                      <td className="px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200/50 mr-4 group-hover:scale-105 transition-transform shadow-sm text-sm">
                            {(member.fullName || member.username || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors whitespace-nowrap flex items-center gap-2">
                              {member.fullName || member.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-b border-slate-100 text-center">
                        {member.enabled === false ? (
                          <div className="text-[9px] font-black text-rose-600 bg-rose-50 inline-flex items-center px-2 py-1 rounded border border-rose-100 uppercase tracking-widest shadow-sm">
                            DEACTIVATED
                          </div>
                        ) : (member.employeeId || member.username) && (
                          <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 inline-flex items-center px-2 py-0.5 rounded border border-indigo-100/50 tracking-wider shadow-sm transition-colors group-hover:bg-white tracking-widest">
                            {member.employeeId || member.username}
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right border-b border-slate-100">
                        <div className="inline-flex items-center justify-end group-hover:scale-105 transition-transform">
                          <Badge variant="secondary" className="shadow-sm border border-slate-200/60 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] px-2.5 py-1 rounded">
                            {getCommitteeRoleLabel(member)}
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── Employee Details Modal ── */}
      {selectedMember && !showEditUser && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedMember(null)}>
          <div className="bg-white w-full max-w-sm rounded-[28px] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-50/80 px-6 pt-10 pb-8 border-b border-slate-100 flex flex-col items-center text-center relative">
              <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors">
                <X size={18} />
              </button>
              <div className="h-20 w-20 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-xl shadow-indigo-600/30 ring-4 ring-white">
                {(selectedMember.fullName || selectedMember.username || '?').charAt(0).toUpperCase()}
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">{selectedMember.fullName || selectedMember.username}</h3>
              <p className="text-sm text-slate-600 font-medium mt-1 flex items-center justify-center gap-1.5">
                <Mail size={14} className="opacity-50" />
                {selectedMember.email}
              </p>
              
              {selectedMember.enabled === false ? (
                <div className="mt-5 inline-flex items-center px-4 py-1.5 bg-rose-50 border border-rose-100 rounded-full shadow-sm">
                  <span className="text-[11px] font-black text-rose-600 uppercase tracking-widest">
                    ACCOUNT DEACTIVATED
                  </span>
                </div>
              ) : (
                <div className="mt-5 inline-flex items-center px-4 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                    ID: <span className="text-indigo-600">{selectedMember.employeeId || selectedMember.username}</span>
                  </span>
                </div>
              )}
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/50 text-indigo-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Primary Role</p>
                  <p className="text-sm font-bold text-slate-700">{getCommitteeRoleLabel(selectedMember)}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100/50 text-amber-600 flex items-center justify-center shrink-0">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Committee Access</p>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {selectedMember.committeePermissions?.length > 0 
                      ? selectedMember.committeePermissions.join(', ').replace(/_/g, ' ')
                      : 'Basic Staff Access'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
              {(user?.role === 'SUPER_ADMIN' || (user?.role === 'ORG_ADMIN' && selectedMember.role !== 'ORG_ADMIN')) && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowEditUser(true)}
                    className="flex-1 h-10 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                  >
                    <Settings className="opacity-60" size={14} />
                    Edit
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(selectedMember.id)}
                    className="flex-1 h-11 bg-white border border-slate-300 hover:border-orange-400 hover:text-orange-600 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center text-sm tracking-tight text-slate-700 whitespace-nowrap"
                  >
                    {selectedMember.enabled === false ? 'Activate' : 'Deactivate'}
                  </button>
                  <button 
                    onClick={() => { if(window.confirm('PERMANENTLY DELETE user? This action cannot be undone.')) handleDeleteUser(selectedMember.id); }}
                    className="flex-1 h-11 bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:text-rose-700 text-rose-600 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center text-sm tracking-tight"
                  >
                    Delete
                  </button>
                </div>
              )}
              <button 
                onClick={() => setSelectedMember(null)}
                className="w-full h-11 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold tracking-tight rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      <AddUserModal
        isOpen={showAddUser || showEditUser}
        onClose={() => { setShowAddUser(false); setShowEditUser(false); }}
        onSave={showEditUser ? handleUpdateUser : handleSaveUser}
        title={showEditUser ? "Edit Profile" : "Add Employee"}
        editMode={showEditUser}
        initialData={selectedMember}
      />
    </div>
  );
};

export default TeamDirectory;
