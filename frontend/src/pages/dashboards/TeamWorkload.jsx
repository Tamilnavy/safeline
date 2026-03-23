import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { User, Activity, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLevels } from '../../context/LevelContext';

const TeamWorkload = () => {
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getLevelName, getLevelNumber } = useLevels();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const resp = await api.get('/complaints/all');
      const data = resp.data.content || resp.data;
      setAllReports(data);
    } catch (err) {
      console.error('Failed to fetch assignments', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <header>
        <div className="flex items-center gap-3 mb-1">
          <Activity size={20} className="text-indigo-600" />
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Assignment Oversight</h1>
        </div>
        <p className="text-slate-500 text-sm font-medium ml-8">Direct mapping of reports to assigned organization personnel.</p>
      </header>

      {loading ? (
        <div className="py-20 text-center animate-pulse text-slate-500 font-bold tracking-widest uppercase text-xs">Fetching Assignment Data...</div>
      ) : (
        <div className="space-y-8">
          <Card title="Personnel Assignment Registry" subtitle="Manage and monitor case distribution across staff roles">
            <div className="table-container border-none shadow-none p-0!">
              <table className="w-full text-left">
                <thead>
                  <tr className="table-header">
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Case Intelligence</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Assigned Specialist</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Workflow Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {allReports.length === 0 ? (
                    <tr><td colSpan="3" className="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No active reports found.</td></tr>
                  ) : allReports.map(report => (
                    <tr 
                      key={report.id} 
                      onClick={() => navigate(`/dashboard/complaint/${report.id}`)}
                      className="table-row group cursor-pointer"
                    >
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">{report.title}</span>
                          <span className="text-[10px] text-slate-400 font-bold tracking-wider">{report.trackingId}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black ${report.assignedToUsername ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                            {report.assignedToUsername ? <User size={16} /> : <AlertTriangle size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {report.assignedToUsername ? (
                                <>
                                  {report.assignedToEmployeeId ? `${report.assignedToEmployeeId} - ` : ''}
                                  {report.assignedToFullName || report.assignedToUsername}
                                </>
                              ) : (
                                <span className="text-danger/60 italic font-black uppercase text-[10px] tracking-widest">Awaiting Assignment</span>
                              )}
                            </p>
                            {report.assignedToRole && (
                              <p className="text-[10px] font-bold text-indigo-500/80">
                                Level {getLevelNumber(report.assignedToRole)} - {getLevelName(report.assignedToRole)}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Badge variant={
                          ['RESOLVED', 'CLOSED'].includes(report.status) ? 'success' : 
                          report.status === 'INVESTIGATION' ? 'primary' : 'warning'
                        }>{report.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TeamWorkload;
