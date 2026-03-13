import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Components
import Navbar from './components/layout/Navbar';

// Pages
import Home from './pages/public/Home';
import Login from './pages/public/Login';
import SubmitComplaint from './pages/public/SubmitComplaint';
import TrackComplaint from './pages/public/TrackComplaint';
import DashboardLayout from './pages/dashboards/DashboardLayout';

function App() {
  const { user, loading } = useAuth();
  const isDashboard = window.location.pathname.startsWith('/dashboard');

  if (loading) return (
    <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
      <div className="glass p-8 animate-fade-in">
        <h2 className="text-secondary">Loading SafeLine...</h2>
      </div>
    </div>
  );

  return (
    <div className="app">
      {!isDashboard && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/submit" element={<SubmitComplaint />} />
          <Route path="/track" element={<TrackComplaint />} />
          
          {/* Dashboard routes will be handled within DashboardLayout */}
          <Route 
            path="/dashboard/*" 
            element={user ? <DashboardLayout /> : <Navigate to="/login" />} 
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
