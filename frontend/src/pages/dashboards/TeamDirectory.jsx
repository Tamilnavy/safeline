import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Users, UserPlus, Mail, ShieldCheck, X } from 'lucide-react';
import AddUserModal from '../../components/dashboard/AddUserModal';
import { useAuth } from '../../context/AuthContext';

const TeamDirectory = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
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

  return (
    <div className="space-y-8 animate-slide-up">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Team Directory</h1>
          <p className="text-slate-500 text-sm font-medium">Manage and view all enrolled organization staff members.</p>
        </div>
        {['ORG_ADMIN', 'ADMIN'].includes(user?.role) && (
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
                  {team
                    .filter(m => {
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
                    <tr key={member.id} className="table-row group cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setSelectedMember(member)}>
                      <td className="px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200/50 mr-4 group-hover:scale-105 transition-transform shadow-sm text-sm">
                            {(member.fullName || member.username || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors whitespace-nowrap">{member.fullName || member.username}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-b border-slate-100 text-center">
                        {(member.employeeId || member.username) && (
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
      {selectedMember && (
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
              
              <div className="mt-5 inline-flex items-center px-4 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                  ID: <span className="text-indigo-600">{selectedMember.employeeId || selectedMember.username}</span>
                </span>
              </div>
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
            
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => setSelectedMember(null)}
                className="w-full h-12 bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-slate-700 font-bold tracking-tight rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      <AddUserModal
        isOpen={showAddUser}
        onClose={() => setShowAddUser(false)}
        onSave={handleSaveUser}
      />
    </div>
  );
};

export default TeamDirectory;
