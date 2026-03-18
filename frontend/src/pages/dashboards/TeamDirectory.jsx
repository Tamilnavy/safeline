import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Users, UserPlus, Mail, ShieldCheck } from 'lucide-react';
import AddUserModal from '../../components/dashboard/AddUserModal';
import { useAuth } from '../../context/AuthContext';

const TeamDirectory = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, []);

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
    try {
      await api.post('/admin/users', { ...formData });
      fetchTeam();
      setShowAddUser(false);
    } catch (err) {
      alert('Failed to enroll member');
    }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Team Directory</h1>
          <p className="text-slate-500 text-sm font-medium">Manage and view all enrolled organization staff members.</p>
        </div>
        {user?.role === 'ORG_ADMIN' && (
          <button className="btn btn-primary h-11 px-6 shadow-lg shadow-indigo-600/20" onClick={() => setShowAddUser(true)}>
            <UserPlus size={18} className="mr-2" />
            <span>Add Team Member</span>
          </button>
        )}
      </header>

      {loading ? (
        <div className="py-20 text-center animate-pulse text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Personnel Registry...</div>
      ) : (
        <Card title="Personnel Registry" subtitle="Comprehensive list of investigators, managers, and officers.">
          <div className="table-container border-none shadow-none p-0!">
            <table className="w-full text-left">
              <thead>
                <tr className="table-header">
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Team Member</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Contact Details</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Access Role</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {team.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No team members enrolled yet.</td>
                  </tr>
                ) : team.map(member => (
                  <tr key={member.id} className="table-row group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <Users size={16} />
                        </div>
                        <span className="text-sm font-bold text-slate-900 tracking-tight uppercase group-hover:text-indigo-600 transition-colors">{member.username}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Mail size={14} className="opacity-50" />
                        <span className="text-sm font-medium">{member.email}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Badge variant="primary">{member.role.replace(/_/g, ' ')}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
