import { Link, useNavigate, useLocation, Navigate, Routes, Route } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  MessageSquare, 
  FileText, 
  LogOut, 
  ShieldCheck, 
  ChevronRight,
  ChevronLeft,
  Menu,
  User,
  Settings,
  Activity,
  Shield
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Dashboard Components
import SuperAdminDashboard from './SuperAdminDashboard';
import InvestigatorDashboard from './InvestigatorDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import OrgAdminDashboard from './OrgAdminDashboard';
import InvestigationDetails from './InvestigationDetails';
import SystemMonitoring from './SystemMonitoring';
import Messages from './Messages';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!user) return <Navigate to="/login" />;

  const menuItems = [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard', roles: null },
    { label: 'My Cases', icon: FileText, path: '/dashboard/complaints', roles: ['EMPLOYEE'] },
    { label: 'Investigations', icon: ShieldCheck, path: '/dashboard/assigned', roles: ['INVESTIGATOR', 'ORG_ADMIN', 'HR_MANAGER', 'COMPLIANCE_OFFICER'] },
    { label: 'Registry', icon: Settings, path: '/dashboard/registry', roles: ['SUPER_ADMIN'] },
    { label: 'Monitoring', icon: Activity, path: '/dashboard/monitoring', roles: ['SUPER_ADMIN'] },
    { label: 'Messages', icon: MessageSquare, path: '/dashboard/messages', roles: null },
  ];

  const filteredMenu = menuItems.filter(item => !item.roles || item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex bg-[#f8fafc] min-h-screen">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 80 }}
        className="sidebar-bg z-50 sticky top-0 h-screen transition-all shadow-sm"
      >
        <div className="h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex-shrink-0 flex items-center justify-center shadow-sm">
              <Shield className="text-white" size={18} />
            </div>
            {sidebarOpen && (
              <span className="font-bold text-lg text-slate-900 tracking-tight">SafeLine</span>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {filteredMenu.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <div className="nav-icon">
                  <Icon size={18} />
                </div>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="h-16 flex items-center justify-between px-8 border-b border-slate-200 sticky top-0 z-40 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 -ml-2 rounded-lg hover:bg-slate-100 transition-colors mr-2"
            >
              <Menu size={18} />
            </button>
            <span className="font-medium">Dashboard</span>
            <ChevronRight size={14} className="opacity-40" />
            <span className="text-slate-900 font-semibold">
              {location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Overview'}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{user.username}</p>
                <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">{user.role?.replace(/_/g, ' ')}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:border-indigo-500 transition-colors shadow-sm">
                <User size={18} className="text-slate-600 group-hover:text-indigo-600 transition-colors" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 main-scroll-area">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="page-container"
          >
            <Routes>
              <Route path="/" element={<DashboardDispatcher user={user} />} />
              <Route path="/complaints" element={<EmployeeDashboard />} />
              <Route path="/assigned" element={<InvestigatorDashboard />} />
              <Route path="/complaint/:id" element={<InvestigationDetails />} />
              <Route path="/org" element={<OrgAdminDashboard />} />
              <Route 
                path="/registry" 
                element={user.role === 'SUPER_ADMIN' ? <SuperAdminDashboard /> : <Navigate to="/dashboard" />} 
              />
              <Route 
                path="/monitoring" 
                element={user.role === 'SUPER_ADMIN' ? <SystemMonitoring /> : <Navigate to="/dashboard" />} 
              />
              <Route path="/messages" element={<Messages />} />
            </Routes>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

const DashboardDispatcher = ({ user }) => {
  switch (user.role) {
    case 'SUPER_ADMIN': return <SuperAdminDashboard />;
    case 'ORG_ADMIN': return <OrgAdminDashboard />;
    case 'INTAKE_OFFICER': return <OrgAdminDashboard />;
    case 'INVESTIGATOR':
    case 'HR_MANAGER':
    case 'COMPLIANCE_OFFICER':
      return <InvestigatorDashboard />;
    case 'EMPLOYEE':
      return <EmployeeDashboard />;
    case 'EXECUTIVE':
      return <OrgAdminDashboard />;
    default:
      return <div className="card p-12 text-center text-danger font-bold">Unrecognized role: {user.role}</div>;
  }
};

export default DashboardLayout;
