import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Stat from '../../components/ui/Stat';
import { 
  Activity, 
  Database, 
  Cpu, 
  HardDrive, 
  ShieldCheck, 
  AlertCircle,
  BarChart3,
  Server,
  Zap,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

const SystemMonitoring = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    cpu: 24,
    memory: 42,
    disk: 18,
    uptime: '12d 4h 32m',
    apiLatency: '42ms',
    tenantCount: 0
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.max(10, Math.min(90, prev.cpu + (Math.random() * 10 - 5))),
        apiLatency: `${Math.floor(Math.random() * 20 + 30)}ms`
      }));
    }, 3000);

    fetchTenantCount();
    setTimeout(() => setLoading(false), 800);

    return () => clearInterval(interval);
  }, []);

  const fetchTenantCount = async () => {
    try {
      const resp = await api.get('/tenants');
      setMetrics(prev => ({ ...prev, tenantCount: resp.data.length }));
    } catch (err) {
      console.error('Failed to fetch monitoring data');
    }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-1">System Monitoring</h1>
          <p className="text-text-secondary text-sm font-medium">Platform health and resource utilization metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full bg-success/10 border border-success/20 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] font-bold text-success uppercase tracking-wider">All Systems Operational</span>
          </div>
        </div>
      </header>

      <div className="metrics-grid">
        <Stat label="CPU Load" value={`${Math.round(metrics.cpu)}%`} icon={Cpu} color="#5e6ad2" />
        <Stat label="Memory" value={`${metrics.memory}%`} icon={Activity} color="#10b981" />
        <Stat label="Disk Usage" value={`${metrics.disk}%`} icon={HardDrive} color="#f59e0b" />
        <Stat label="API Latency" value={metrics.apiLatency} icon={Zap} color="#4f46e5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Resource Allocation" subtitle="Real-time performance tracking per subsystem.">
          <div className="space-y-8 py-4">
            <ResourceBar label="Database Cluster" value={metrics.memory + 10} color="#4f46e5" />
            <ResourceBar label="API Engine" value={metrics.cpu} color="#10b981" />
            <ResourceBar label="Storage Vault" value={metrics.disk} color="#f59e0b" />
            <ResourceBar label="Search Index" value={32} color="#5e6ad2" />
          </div>
        </Card>

        <Card title="Uptime & Availability" subtitle="Historical reliability and platform stability.">
          <div className="flex flex-col h-full justify-between gap-8">
            <div className="flex items-end gap-2 h-40">
              {[...Array(24)].map((_, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.random() * 60 + 40}%` }}
                  className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t-sm border-t border-primary/30"
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Global Uptime</p>
                <p className="text-xl font-bold text-white">99.98%</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Active Uptime</p>
                <p className="text-xl font-bold text-white">{metrics.uptime}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <Card className="lg:col-span-1" noPadding>
            <div className="p-8 border-b border-white/5 bg-white/5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                 <Server size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Infrastructure</h3>
              <p className="text-xs text-text-muted font-medium mt-1">Multi-tenant isolation layer status.</p>
            </div>
            <div className="p-8 space-y-4">
               <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Active Tenants</span>
                  <span className="font-bold text-white">{metrics.tenantCount}</span>
               </div>
               <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Node Region</span>
                  <span className="font-bold text-white uppercase tracking-tighter">US-EAST-1</span>
               </div>
            </div>
         </Card>

         <Card className="lg:col-span-2" title="Services Log" subtitle="Recent infrastructure events and deployments.">
            <div className="space-y-4">
               <LogItem icon={CheckCircle} color="var(--success)" text="Database backup completed successfully" time="2h ago" />
               <LogItem icon={RefreshCw} color="var(--primary)" text="API Gateway route table synchronized" time="4h ago" />
               <LogItem icon={AlertCircle} color="var(--warning)" text="Minor latency spike in worker nodes" time="8h ago" />
            </div>
         </Card>
      </div>
    </div>
  );
};

const ResourceBar = ({ label, value, color }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-end">
      <span className="text-sm font-bold text-text-primary tracking-tight">{label}</span>
      <span className="text-xs font-mono text-text-secondary">{Math.round(value)}%</span>
    </div>
    <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        className="h-full rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}44` }}
      />
    </div>
  </div>
);

const LogItem = ({ icon: Icon, color, text, time }) => (
  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group cursor-default">
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}11`, color: color }}>
        <Icon size={16} />
      </div>
      <span className="text-sm font-medium text-text-primary">{text}</span>
    </div>
    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{time}</span>
  </div>
);

export default SystemMonitoring;
