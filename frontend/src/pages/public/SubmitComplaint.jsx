import { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// Sub-components
import ComplaintStepper from '../../components/complaint/ComplaintStepper';
import IncidentDetailsStep from '../../components/complaint/IncidentDetailsStep';
import DescriptionEvidenceStep from '../../components/complaint/DescriptionEvidenceStep';
import FinalDeclarationStep from '../../components/complaint/FinalDeclarationStep';
import SubmissionResult from '../../components/complaint/SubmissionResult';

const SubmitComplaint = () => {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    location: '',
    isAnonymous: true,
    accusedUserId: '',
    isSensitive: false
  });
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isCommitteeMember, setIsCommitteeMember] = useState(false);
  const [copiedType, setCopiedType] = useState(null); // 'id' or 'pin'

  useEffect(() => {
    fetchCategories();
    const token = localStorage.getItem('token');
    if (token) {
      setFormData(prev => ({ ...prev, isAnonymous: false }));
      const userJson = localStorage.getItem('user');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          if (user.committeePermissions && user.committeePermissions.length > 0) {
            setIsCommitteeMember(true);
            setFormData(prev => ({ ...prev, isSensitive: true }));
          }
        } catch (e) {
          console.error('Failed to parse user data');
        }
      }
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const resp = await api.get('/complaints/categories');
      setCategories(resp.data);
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleSubmit = async () => {
    if (!declarationChecked) return;
    setLoading(true);
    setError('');
    try {
      const data = new FormData();
      data.append('request', JSON.stringify({
        ...formData,
        anonymous: formData.isAnonymous,
        type: formData.isSensitive ? 'SENSITIVE' : 'NORMAL'
      }));

      files.forEach(file => {
        data.append('files', file);
      });

      const resp = await api.post('/complaints/submit', data);
      setResult(resp.data);
      setStep(4);
    } catch (err) {
      setError('Submission failed. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const steps = [
    { id: 1, label: 'Incident Details' },
    { id: 2, label: 'Details' },
    { id: 3, label: 'Evidence & Review' }
  ];

  return (
    <div className="min-h-screen bg-[#f4f7ff] pb-24 pt-12 px-6 flex flex-col items-center">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="w-full max-w-2xl relative"
      >
        <ComplaintStepper step={step} steps={steps} />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.1 }}
          className="bg-white rounded-b-3xl rounded-t-none -mt-6 pt-16 pb-12 px-8 md:px-12 shadow-2xl shadow-indigo-500/10 border border-white relative z-10"
        >
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <IncidentDetailsStep 
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                onNext={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <DescriptionEvidenceStep 
                formData={formData}
                setFormData={setFormData}
                files={files}
                onFileChange={handleFileChange}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}

            {step === 3 && (
              <FinalDeclarationStep 
                formData={formData}
                setFormData={setFormData}
                declarationChecked={declarationChecked}
                setDeclarationChecked={setDeclarationChecked}
                isCommitteeMember={isCommitteeMember}
                loading={loading}
                onSubmit={handleSubmit}
                onBack={() => setStep(2)}
              />
            )}

            {step === 4 && result && (
              <SubmissionResult 
                result={result}
                copiedType={copiedType}
                onCopy={copyToClipboard}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SubmitComplaint;

