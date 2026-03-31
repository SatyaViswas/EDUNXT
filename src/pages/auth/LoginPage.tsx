import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight, Sparkles, GraduationCap, Heart } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import type { Role } from '@/context/UserContext';
import StudentDiagnostic from '@/components/auth/StudentDiagnostic';
import MentorStepper from '@/components/auth/MentorStepper';

interface RoleCard {
  role: Role;
  label: string;
  tagline: string;
  icon: React.ReactNode;
  gradient: string;
  glowColor: string;
  borderColor: string;
  features: string[];
}

const roleCards: RoleCard[] = [
  {
    role: 'Student',
    label: 'Student',
    tagline: 'Start your learning journey',
    icon: <BookOpen size={32} />,
    gradient: 'from-blue-600 via-blue-500 to-cyan-500',
    glowColor: 'shadow-blue-500/30',
    borderColor: 'hover:border-blue-500/50',
    features: ['AI-Personalized Learning', 'Progress Tracking', 'Live Mentor Sessions'],
  },
  {
    role: 'Mentor',
    label: 'Mentor',
    tagline: 'Shape the next generation',
    icon: <GraduationCap size={32} />,
    gradient: 'from-saffron-500 via-orange-500 to-amber-500',
    glowColor: 'shadow-saffron-500/30',
    borderColor: 'hover:border-saffron-500/50',
    features: ['Teach 100+ Students', 'Session Analytics', 'Verified Badge'],
  },
  {
    role: 'NGO',
    label: 'NGO Admin',
    tagline: 'Drive community impact',
    icon: <Heart size={32} />,
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    glowColor: 'shadow-emerald-500/30',
    borderColor: 'hover:border-emerald-500/50',
    features: ['Impact Analytics', 'Risk Management', 'User Oversight'],
  },
];

type AuthFlow = 'idle' | 'student-diagnostic' | 'mentor-stepper';
type AuthMode = 'login' | 'register';

const AUTH_REGISTER_URL = 'http://localhost:8000/auth/register';
const AUTH_LOGIN_URL = 'http://localhost:8000/auth/login';

const STUDENT_GRADE_OPTIONS = ['1','2','3','4','5','6','7','8','9','10','11','12'];

type AuthResponse = {
  access_token: string;
  token_type: string;
  role: 'STUDENT' | 'MENTOR' | 'NGO' | 'Student' | 'Mentor';
  user_id: string;
  mentor_status?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
};

const normalizeRole = (role: AuthResponse['role']): Exclude<Role, null> => {
  const upper = String(role).toUpperCase();
  if (upper === 'STUDENT') return 'Student';
  if (upper === 'MENTOR') return 'Mentor';
  return 'NGO';
};

const LoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [activeFlow, setActiveFlow] = useState<AuthFlow>('idle');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [standard, setStandard] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useUser();
  const navigate = useNavigate();

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setError(null);
    setActiveFlow('idle');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!selectedRole) {
      setError('Please select a role first.');
      return;
    }

    try {
      setIsSubmitting(true);

      let auth: AuthResponse;
      if (authMode === 'register') {
        const registerPayload: Record<string, unknown> = {
          email,
          password,
          full_name: fullName,
          role: selectedRole,
        };
        if (selectedRole === 'Student') {
          if (!standard) {
            throw new Error('Please select your grade before signing up.');
          }
          registerPayload.standard = Number(standard);
        }

        const response = await fetch(AUTH_REGISTER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registerPayload),
        });

        if (!response.ok) {
          if (response.status === 400) {
            throw new Error('User Already Exists');
          }
          throw new Error('Authentication failed');
        }

        auth = (await response.json()) as AuthResponse;
      } else {
        const response = await fetch(AUTH_LOGIN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid Credentials');
          }
          if (response.status === 400) {
            throw new Error('User Already Exists');
          }
          throw new Error('Authentication failed');
        }

        auth = (await response.json()) as AuthResponse;
      }

      const role = normalizeRole(auth.role);
      const verified = role !== 'Mentor' || auth.mentor_status === 'APPROVED';

      login({
        id: auth.user_id,
        name: fullName || email.split('@')[0],
        email,
        role,
        standard: role === 'Student' ? (standard as any) : undefined,
        isVerified: verified,
        token: auth.access_token,
      });

      if (role === 'Student') {
        navigate('/student', { replace: true });
      } else if (role === 'Mentor') {
        navigate('/mentor', { replace: true });
      } else {
        navigate('/ngo', { replace: true });
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFlowClose = () => {
    setActiveFlow('idle');
    setSelectedRole(null);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Background ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-saffron-500/5 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-6">
            <Sparkles size={14} />
            India's Next-Gen Educational Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">
            <span className="text-white">Welcome to </span>
            <span className="gradient-text">Sahaayak</span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-xl mx-auto font-light">
            Empowering NGOs, students, and mentors across India with AI-driven learning.
          </p>

          <div className="mt-8 text-sm text-white/30 font-medium uppercase tracking-widest">
            Choose your role to begin
          </div>
          <div className="mt-2 flex justify-center">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        </motion.div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roleCards.map((card, i) => (
            <motion.div
              key={card.role}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 * i, ease: 'easeOut' }}
            >
              <RoleCardComponent
                card={card}
                isSelected={selectedRole === card.role}
                onSelect={() => handleRoleSelect(card.role)}
              />
            </motion.div>
          ))}
        </div>

        <motion.form
          onSubmit={handleSubmit}
          className="mt-10 mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-white/80 text-sm">
              Backend Auth: <span className="text-brand-300">http://localhost:8000/auth</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer ${authMode === 'login' ? 'bg-brand-500/25 text-brand-300' : 'bg-white/10 text-white/70'}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer ${authMode === 'register' ? 'bg-brand-500/25 text-brand-300' : 'bg-white/10 text-white/70'}`}
              >
                Register
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {authMode === 'register' && (
              <input
                className="md:col-span-2 rounded-lg bg-slate-900/70 border border-white/10 px-3 py-2 text-white"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            )}
            <input
              className="rounded-lg bg-slate-900/70 border border-white/10 px-3 py-2 text-white"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="rounded-lg bg-slate-900/70 border border-white/10 px-3 py-2 text-white"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {authMode === 'register' && selectedRole === 'Student' && (
              <select
                className="md:col-span-2 rounded-lg bg-slate-900/70 border border-white/10 px-3 py-2 text-white"
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select Grade (Class 1-12)
                </option>
                {STUDENT_GRADE_OPTIONS.map((grade) => (
                  <option key={grade} value={grade}>
                    Grade {grade}
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && <p className="text-red-300 text-sm mt-3">{error}</p>}

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              type="submit"
              disabled={isSubmitting || !selectedRole}
              className="px-4 py-2 rounded-lg bg-brand-500/80 hover:bg-brand-500 text-white disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Submitting...' : authMode === 'register' ? 'Create Account' : 'Login'}
            </button>
            <button
              type="button"
              onClick={() => setActiveFlow('student-diagnostic')}
              className="px-4 py-2 rounded-lg bg-white/10 text-white/80 cursor-pointer"
            >
              Student Diagnostic Demo
            </button>
            <button
              type="button"
              onClick={() => setActiveFlow('mentor-stepper')}
              className="px-4 py-2 rounded-lg bg-white/10 text-white/80 cursor-pointer"
            >
              Mentor KYC Demo
            </button>
          </div>
        </motion.form>

        {/* Footer note */}
        <motion.p
          className="text-center text-white/25 text-sm mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Supported by leading Indian NGOs · Secured with Aadhaar & DigiLocker
        </motion.p>
      </div>

      {/* Student Diagnostic Modal */}
      <StudentDiagnostic
        isOpen={activeFlow === 'student-diagnostic'}
        onClose={handleFlowClose}
      />

      {/* Mentor Stepper Modal */}
      <MentorStepper
        isOpen={activeFlow === 'mentor-stepper'}
        onClose={handleFlowClose}
      />
    </div>
  );
};

/* ─── Role Card Component ─── */
interface RoleCardComponentProps {
  card: RoleCard;
  isSelected: boolean;
  onSelect: () => void;
}

const RoleCardComponent: React.FC<RoleCardComponentProps> = ({ card, isSelected, onSelect }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onSelect}
      className={`
        relative cursor-pointer rounded-2xl p-7 border transition-all duration-300 overflow-hidden
        bg-white/5 backdrop-blur-xl
        ${isSelected ? 'border-white/30' : 'border-white/10'}
        ${card.borderColor}
        hover:shadow-2xl hover:${card.glowColor}
      `}
    >
      {/* Gradient top bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.gradient}`} />

      {/* Icon */}
      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${card.gradient} mb-5 text-white shadow-lg`}>
        {card.icon}
      </div>

      {/* Label */}
      <h3 className="text-2xl font-bold text-white mb-1">{card.label}</h3>
      <p className="text-white/50 text-sm mb-6">{card.tagline}</p>

      {/* Features */}
      <ul className="space-y-2.5 mb-7">
        {card.features.map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-white/70 text-sm">
            <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${card.gradient} flex-shrink-0`} />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <motion.div
        className={`flex items-center gap-2 text-sm font-semibold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}
        animate={{ x: hovered ? 4 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        Get Started
        <ArrowRight size={16} className={`bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`} />
      </motion.div>

      {/* Hover glow fill */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-[0.04] pointer-events-none rounded-2xl`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.04 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LoginPage;
