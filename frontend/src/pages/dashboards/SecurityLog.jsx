import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { 
  Shield, 
  Search, 
  Filter, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Lock, 
  User,
  MoreVertical,
  Calendar,
  Key
} from 'lucide-react';
import { motion } from 'framer-motion';

const SecurityLog = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    // Simulated security events for production feel
    const mockLogs = [
      { id: 1, event: 'ADMIN_LOGIN_SUCCESS', user: 'admin', ip: '192.168.1.104', type: 'AUTH', severity: 'INFO', timestamp: new Date().toISOString() },
      { id: 2, event: 'TENANT_PROVISIONED', user: 'super_admin', ip: '10.0.0.42', type: 'ADMIN', severity: 'SUCCESS', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: 3, event: 'DB_BACKUP_INITIATED', user: 'system_cron', ip: '::1', type: 'SYSTEM', severity: 'INFO', timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: 4, event: 'UNAUTHORIZED_API_ACCESS', user: 'unknown', ip: '45.12.33.1', type: 'SECURITY', severity: 'DANGER', timestamp: new Date(Date.now() - 86400000).toISOString() },
      { id: 5, event: 'ENCRYPTION_KEY_ROTATED', user: 'security_officer', ip: '10.0.0.5', type: 'SECURITY', severity: 'WARNING', timestamp: new Date(Date.now() - 172800000).toISOString() }
    ];
    
    setLogs(mockLogs);
    setTimeout(() => setLoading(false), 600);
  }, []);

  const filteredLogs = filter === 'ALL' ? logs : logs.filter(l => l.severity === filter);

  return (
    <div className="space-y-8 animate-slide-up">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-1">Security Audit Log</h1>
          <p className="text-text-secondary text-sm font-medium">Platform-wide events and administrative audit trail.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-primary" />
             <input type="text" placeholder="Search events..." className="input-field pl-10 !py-2 !text-xs !w-64" />
          </div>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2">
         {['ALL', 'INFO', 'SUCCESS', 'WARNING', 'DANGER'].map(s => (
           <button 
             key={s} 
             onClick={() => setFilter(s)}
             className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${filter === s ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20'}`}
           >
             {s}
           </button>
         ))}
      </div>

      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center animate-pulse text-text-muted font-bold tracking-widest uppercase text-xs">Synchronizing Audit Records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Event Type</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Actor</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Origin</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Timestamp</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted text-right">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors cursor-default">
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-white/5 ${getSeverityColor(log.severity)}`}>
                             <Shield size={14} />
                          </div>
                          <div>
                             <p className="text-xs font-bold text-white uppercase tracking-tight">{log.event?.replace(/_/g, ' ')}</p>
                             <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-60">{log.type}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center">
                             <User size={10} className="text-text-muted" />
                          </div>
                          <span className="text-xs font-bold text-text-secondary">{log.user}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <span className="text-[11px] font-mono text-text-muted font-bold tracking-wider">{log.ip}</span>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                          <Calendar size={12} className="text-text-muted" />
                          {new Date(log.timestamp).toLocaleDateString()}
                          <Clock size={12} className="text-text-muted ml-1" />
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <Badge variant={log.severity.toLowerCase() === 'danger' ? 'danger' : log.severity.toLowerCase() === 'warning' ? 'warning' : log.severity.toLowerCase() === 'success' ? 'success' : 'primary'}>
                         {log.severity}
                       </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <SecondaryCard icon={Lock} title="Encryption Status" value="AES-256" subtitle="Hardware Security Module Active" />
         <SecondaryCard icon={Key} title="Key Rotation" value="14 Days Remaining" subtitle="Last rotation: Feb 28, 2026" />
         <SecondaryCard icon={CheckCircle} title="Compliance" value="Fully Audited" subtitle="Platform adheres to ISO 27001" />
      </div>
    </div>
  );
};

const SecondaryCard = ({ icon: Icon, title, value, subtitle }) => (
  <div className="glass-card !p-5 flex items-center gap-5 border-white/5 hover:border-primary/20 transition-all group">
     <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-text-muted group-hover:bg-primary/10 group-hover:text-primary transition-all">
        <Icon size={20} />
     </div>
     <div>
        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-0.5">{title}</p>
        <p className="text-sm font-bold text-white mb-0.5">{value}</p>
        <p className="text-[9px] font-bold text-success uppercase tracking-tighter opacity-80">{subtitle}</p>
     </div>
  </div>
);

const getSeverityColor = (severity) => {
  switch(severity) {
    case 'DANGER': return 'text-danger shadow-[0_0_10px_rgba(239,68,68,0.2)]';
    case 'WARNING': return 'text-warning';
    case 'SUCCESS': return 'text-success';
    default: return 'text-primary';
  }
};

export default SecurityLog;
