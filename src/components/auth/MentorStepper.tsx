import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, GraduationCap, FileText, Lock, Check,
  Loader2, CheckCircle2, AlertCircle, ChevronRight,
  Fingerprint, BookOpen, ClipboardList
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

/* ═══════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════ */
interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type StepStatus = 'pending' | 'active' | 'loading' | 'complete' | 'error';

interface Step {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}

/* ═══════════════════════════════════════════════════════════
   Step definitions
═══════════════════════════════════════════════════════════ */
const STEPS: Step[] = [
  {
    id: 1,
    title: 'Identity Verification',
    subtitle: 'Aadhaar-based KYC',
    icon: <Fingerprint size={20} />,
    color: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
  },
  {
    id: 2,
    title: 'Education Credentials',
    subtitle: 'DigiLocker Integration',
    icon: <GraduationCap size={20} />,
    color: 'text-saffron-400 bg-saffron-500/15 border-saffron-500/30',
  },
];

/* ═══════════════════════════════════════════════════════════
   Step Indicator
═══════════════════════════════════════════════════════════ */
const StepIndicator: React.FC<{ steps: Step[]; currentStep: number; statuses: StepStatus[] }> = ({
  steps, currentStep, statuses,
}) => (
  <div className="flex items-center gap-0 mb-8">
    {steps.map((step, i) => {
      const status = statuses[i];
      const isActive = i + 1 === currentStep;
      const isDone = status === 'complete';

      return (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center flex-1 min-w-0">
            <motion.div
              className={`
                w-10 h-10 rounded-full border-2 flex items-center justify-center
                transition-all duration-400
                ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' :
                  isActive ? 'bg-brand-600 border-brand-500 text-white' :
                  'bg-white/5 border-white/15 text-white/30'}
              `}
              animate={{ scale: isActive ? 1.15 : 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {isDone ? <Check size={16} /> : step.icon}
            </motion.div>
            <div className="mt-2 text-center px-1">
              <p className={`text-xs font-semibold truncate ${isActive ? 'text-white' : isDone ? 'text-emerald-400' : 'text-white/30'}`}>
                {step.title}
              </p>
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 flex-1 max-w-16 mb-6 transition-all duration-600 ${statuses[i] === 'complete' ? 'bg-emerald-500/60' : 'bg-white/10'}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Step 1: Aadhaar Identity
═══════════════════════════════════════════════════════════ */
const AadhaarStep: React.FC<{ onVerified: () => void }> = ({ onVerified }) => {
  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [phase, setPhase] = useState<'input' | 'otp' | 'verifying'>('input');
  const [fakeName, setFakeName] = useState('');

  const formatAadhaar = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 12);
    return nums.replace(/(\d{4})/g, '$1 ').trim();
  };

  const handleSendOTP = () => {
    if (aadhaar.replace(/\s/g, '').length < 12) return;
    setFakeName('Rajesh Kumar Verma');
    setPhase('otp');
  };

  const handleVerify = () => {
    if (otp.length < 6) return;
    setPhase('verifying');
    setTimeout(onVerified, 2000);
  };

  return (
    <motion.div
      className="flex flex-col gap-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <ShieldCheck size={20} className="text-blue-400 flex-shrink-0" />
        <p className="text-sm text-blue-300">
          Your Aadhaar data is encrypted and never stored. This is a mock demo.
        </p>
      </div>

      {/* Aadhaar number input */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          Aadhaar Number
        </label>
        <div className="relative">
          <Fingerprint size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={aadhaar}
            onChange={(e) => setAadhaar(formatAadhaar(e.target.value))}
            placeholder="XXXX XXXX XXXX"
            maxLength={14}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/25 text-sm font-mono focus:outline-none focus:border-brand-500/60 transition-colors"
          />
        </div>
      </div>

      {/* Fetched name (mock) */}
      <AnimatePresence>
        {fakeName && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {fakeName.charAt(0)}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{fakeName}</p>
              <p className="text-white/40 text-xs">DOB: 15 Aug 1995 · Male</p>
            </div>
            <CheckCircle2 size={18} className="text-emerald-400 ml-auto" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* OTP */}
      <AnimatePresence>
        {phase === 'otp' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className="block text-sm font-medium text-white/70 mb-2">
              OTP sent to linked mobile
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/25 text-sm font-mono tracking-widest focus:outline-none focus:border-brand-500/60 transition-colors"
            />
            <p className="text-white/30 text-xs mt-1.5">Hint: any 6 digits for the demo</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      {phase === 'input' && (
        <Button fullWidth size="lg" onClick={handleSendOTP} disabled={aadhaar.replace(/\s/g, '').length < 12} rightIcon={<ChevronRight size={16} />}>
          Send OTP
        </Button>
      )}
      {phase === 'otp' && (
        <Button fullWidth size="lg" onClick={handleVerify} disabled={otp.length < 6} rightIcon={<ChevronRight size={16} />}>
          Verify Identity
        </Button>
      )}
      {phase === 'verifying' && (
        <Button fullWidth size="lg" isLoading>
          Verifying with UIDAI...
        </Button>
      )}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Step 2: DigiLocker Education
═══════════════════════════════════════════════════════════ */
const DigiLockerStep: React.FC<{ onVerified: () => void }> = ({ onVerified }) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'fetching' | 'done'>('idle');
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  const docs = [
    { id: 'grad', label: 'B.Ed Degree Certificate', issuer: 'Delhi University', year: '2020' },
    { id: 'ug', label: 'B.Sc (Hons) Mathematics', issuer: 'DU (Miranda House)', year: '2018' },
    { id: 'mark', label: 'Class XII Marksheet', issuer: 'CBSE', year: '2015' },
  ];

  const handleConnect = () => {
    setStatus('connecting');
    setTimeout(() => {
      setStatus('fetching');
      setTimeout(() => setStatus('done'), 1500);
    }, 1500);
  };

  return (
    <motion.div className="flex flex-col gap-5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 p-4 rounded-xl bg-saffron-500/10 border border-saffron-500/20">
        <BookOpen size={20} className="text-saffron-400 flex-shrink-0" />
        <p className="text-sm text-saffron-300">
          Connect your DigiLocker to fetch academic credentials instantly.
        </p>
      </div>

      {status === 'idle' && (
        <Button fullWidth size="lg" variant="saffron" onClick={handleConnect} rightIcon={<ChevronRight size={16} />}>
          Connect DigiLocker
        </Button>
      )}

      {status === 'connecting' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <Loader2 size={32} className="text-saffron-400 animate-spin" />
          <p className="text-white/50 text-sm">Connecting to DigiLocker...</p>
        </div>
      )}

      {status === 'fetching' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <Loader2 size={32} className="text-saffron-400 animate-spin" />
          <p className="text-white/50 text-sm">Fetching academic records...</p>
        </div>
      )}

      {status === 'done' && (
        <motion.div className="flex flex-col gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-white/50 text-sm">Select the credential to verify:</p>
          {docs.map((doc) => (
            <motion.button
              key={doc.id}
              whileHover={{ x: 4 }}
              onClick={() => setSelectedDoc(doc.id)}
              className={`
                w-full text-left p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                ${selectedDoc === doc.id ? 'border-saffron-500 bg-saffron-500/10' : 'border-white/10 bg-white/5 hover:border-white/25'}
              `}
            >
              <div className="flex items-center gap-3">
                <FileText size={16} className={selectedDoc === doc.id ? 'text-saffron-400' : 'text-white/30'} />
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">{doc.label}</p>
                  <p className="text-white/40 text-xs">{doc.issuer} · {doc.year}</p>
                </div>
                {selectedDoc === doc.id && <Check size={16} className="text-saffron-400" />}
              </div>
            </motion.button>
          ))}
          <Button fullWidth size="lg" variant="saffron" disabled={!selectedDoc} onClick={onVerified} rightIcon={<ChevronRight size={16} />}>
            Confirm Credentials
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Main MentorStepper
═══════════════════════════════════════════════════════════ */
const MentorStepper: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [statuses, setStatuses] = useState<StepStatus[]>(['active', 'pending', 'pending']);
  const [isComplete, setIsComplete] = useState(false);
  const { login } = useUser();
  const navigate = useNavigate();

  const advanceStep = () => {
    setStatuses(prev => {
      const updated = [...prev];
      updated[currentStep - 1] = 'complete';
      if (currentStep < 2) updated[currentStep] = 'active';
      return updated;
    });

    if (currentStep < 2) {
      setCurrentStep(s => s + 1);
    } else {
      setIsComplete(true);
      setTimeout(() => {
        login({
          id: `mentor-${Date.now()}`,
          name: 'Rajesh Kumar Verma',
          email: 'rajesh@sahaayak.in',
          role: 'Mentor',
          isVerified: false, // Locked until dashboard exam is passed
        });
        navigate('/mentor', { replace: true });
      }, 2200);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setStatuses(['active', 'pending']);
    setIsComplete(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isComplete ? undefined : handleClose}
      size="lg"
      preventClose={isComplete}
      showClose={!isComplete}
      title={isComplete ? undefined : `Mentor Access — Step ${currentStep} of 2`}
    >
      <AnimatePresence mode="wait">
        {isComplete ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 py-8 text-center"
          >
            <motion.div
              className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.15 }}
            >
              <CheckCircle2 size={40} className="text-emerald-400" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-white">Identity Verified! 🔒</h2>
              <p className="text-white/50 mt-1">Redirecting to your dashboard to complete the Eligibility Exam...</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-sm font-medium">
              <ShieldCheck size={15} /> KYC Complete
            </div>
            <div className="w-48 progress-bar mt-4">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #10b981, #059669)' }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div key="stepper" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <StepIndicator steps={STEPS} currentStep={currentStep} statuses={statuses} />

            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <AadhaarStep onVerified={advanceStep} />
                </motion.div>
              )}
              {currentStep === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <DigiLockerStep onVerified={advanceStep} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};

export default MentorStepper;
