import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import MessageBoard from '../../components/ui/MessageBoard';
import CaseDeliveryProgress from '../../components/dashboard/CaseDeliveryProgress';
import { motion } from 'framer-motion';
import { Lock, ChevronLeft } from 'lucide-react';

// Sub-components
import InvestigationHeader from '../../components/investigation/InvestigationHeader';
import CaseIntelligence from '../../components/investigation/CaseIntelligence';
import EvidenceVault from '../../components/investigation/EvidenceVault';
import InvestigationTimeline from '../../components/investigation/InvestigationTimeline';
import StatusUpdateModal from '../../components/investigation/StatusUpdateModal';

const InvestigationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [activities, setActivities] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCaseData();
  }, [id]);

  const fetchCaseData = async () => {
    setLoading(true);
    try {
      const [compResp, actResp] = await Promise.all([
        api.get(`/complaints/${id}`),
        api.get(`/complaints/activities/${id}`)
      ]);
      setComplaint(compResp.data);
      setActivities(actResp.data);
    } catch (err) {
      console.error('CRITICAL ERROR: Failed to fetch case details', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      await api.put(`/complaints/${id}/status?status=${status}`);
      fetchCaseData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDownloadEvidence = async (evidenceId, fileName) => {
    try {
      const response = await api.get(`/complaints/evidence/${evidenceId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Evidence download failed:', err);
      const status = err.response?.status;
      const message = status === 403 ? 'Access Denied: You do not have permission to download this evidence.' : 
                     status === 404 ? 'File Not Found: The evidence file could not be located on the server.' : 
                     'A technical error occurred during the download.';
      alert(`Download Error: ${message} (${status || 'Network Error'})`);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f4f7ff] flex flex-col items-center justify-center p-12">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Decrypting Instance...</span>
    </div>
  );

  if (!complaint) return (
    <div className="min-h-screen bg-[#f4f7ff] flex flex-col items-center justify-center p-12">
      <div className="w-16 h-16 rounded-[24px] bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-6">
        <Lock size={32} />
      </div>
      <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Access Restricted / Not Found</h2>
      <button onClick={() => navigate('/dashboard')} className="text-indigo-600 font-bold text-sm hover:underline">Return to Oversight</button>
    </div>
  );

  const isReporter = user?.id === complaint?.reporterId || (user?.username && complaint?.reporterUsername && user.username === complaint.reporterUsername);
  const isStaff = user?.committeePermissions && user.committeePermissions.length > 0;
  const canManage = isStaff && !isReporter;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className="min-h-screen bg-[#f4f7ff] pb-12 pt-8 px-6 -mx-8 -my-8"
    >
      <div className="max-w-7xl mx-auto">
        <InvestigationHeader 
          complaint={complaint}
          isStaff={isStaff}
          isReporter={isReporter}
          user={user}
          setShowStatusModal={setShowStatusModal}
          navigate={navigate}
        />

        <CaseDeliveryProgress
          status={complaint.status}
          activities={activities}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-8 space-y-8"
          >
            <CaseIntelligence complaint={complaint} />

            <EvidenceVault 
              complaint={complaint}
              onDownload={handleDownloadEvidence}
            />

            {(!user?.committeePermissions?.includes('COMMITTEE_LEAD') || isReporter || user.id === complaint.assignedToId) && (
              <div className="bg-white rounded-[40px] shadow-2xl shadow-indigo-500/5 border border-white overflow-hidden flex flex-col min-h-[550px]">
                <div className="bg-white rounded-b-[40px] overflow-hidden flex flex-col h-[500px]">
                  <div className="flex-1 relative min-h-0">
                    <MessageBoard
                      complaintId={complaint.id}
                      initialMessages={[]}
                      isStaff={canManage}
                      showHeader={true}
                      title="Investigation Communication"
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-8"
          >
            <InvestigationTimeline 
              activities={activities}
              complaint={complaint}
              user={user}
            />
          </motion.div>
        </div>

        <StatusUpdateModal 
          show={showStatusModal}
          setShow={setShowStatusModal}
          complaint={complaint}
          user={user}
          handleUpdateStatus={handleUpdateStatus}
        />
      </div>
    </motion.div>
  );
};

export default InvestigationDetails;


