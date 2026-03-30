import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import {
  Brain, TrendingDown, Clock, MessageCircle,
  X, CheckCircle2, ZapOff, FlaskConical, ShieldAlert
} from 'lucide-react';

type RiskLevel = 'critical' | 'high' | 'medium';

interface AtRiskStudent {
  id: string;
  name: string;
  class: string;
  center: string;
  mentor: string;
  reason: string;
  reasonDetail: string;
  riskLevel: RiskLevel;
  daysSinceActivity: number;
  streakBefore: number;
  streakNow: number;
}

const MOCK_AT_RISK: AtRiskStudent[] = [
  {
    id: '1', name: 'Rahul Mehra', class: 'Class 6', center: 'Center A', mentor: 'Ms. Priya Iyer',
    reason: 'Declining Streak', reasonDetail: 'Streak dropped from 14 to 0 over 2 weeks.',
    riskLevel: 'critical', daysSinceActivity: 9, streakBefore: 14, streakNow: 0,
  },
  {
    id: '2', name: 'Kushal T.', class: 'Class 8', center: 'Center B', mentor: 'Mr. Arjun Nair',
    reason: 'Stagnant DNA Profile', reasonDetail: 'No improvement in Logical Reasoning score for 4 weeks.',
    riskLevel: 'high', daysSinceActivity: 5, streakBefore: 7, streakNow: 1,
  },
  {
    id: '3', name: 'Megha P.', class: 'Class 8', center: 'Center C', mentor: 'Ms. Deepa Rao',
    reason: 'Failing Foundation Tests', reasonDetail: 'Failed 3 consecutive diagnostic tests in Science.',
    riskLevel: 'high', daysSinceActivity: 3, streakBefore: 10, streakNow: 2,
  },
  {
    id: '4', name: 'Ananya Verma', class: 'Class 10', center: 'Center A', mentor: 'Mr. Rohit Sharma',
    reason: 'Declining Streak', reasonDetail: 'Repeated absences from weekly practice modules.',
    riskLevel: 'medium', daysSinceActivity: 2, streakBefore: 20, streakNow: 4,
  },
  {
    id: '5', name: 'Dev Bhat', class: 'Class 7', center: 'Center B', mentor: 'Ms. Sunita Rao',
    reason: 'Disengagement Signal', reasonDetail: 'Opened 0 of 6 assigned digital resources this month.',
    riskLevel: 'medium', daysSinceActivity: 4, streakBefore: 5, streakNow: 0,
  },
];

const REASON_ICON: Record<string, React.ReactNode> = {
  'Declining Streak': <TrendingDown size={14} />,
  'Stagnant DNA Profile': <Brain size={14} />,
  'Failing Foundation Tests': <FlaskConical size={14} />,
  'Disengagement Signal': <ZapOff size={14} />,
};

const RISK_STYLE: Record<RiskLevel, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-amber-400',
  medium: 'border-l-yellow-500',
};

const RISK_BADGE: Record<RiskLevel, string> = {
  critical: 'bg-red-500/20 text-red-400 border border-red-500/30',
  high: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
};

const NotifyModal: React.FC<{ student: AtRiskStudent; onClose: () => void }> = ({ student, onClose }) => {
  const [sent, setSent] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 bg-gradient-to-br from-red-500/10 to-amber-500/10 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white"><X size={18} /></button>
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-red-400" size={24} />
            <div>
              <h3 className="font-bold text-white text-lg">Notify Mentor</h3>
              <p className="text-white/50 text-sm">Regarding <strong>{student.name}</strong></p>
            </div>
          </div>
        </div>

        {!sent ? (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm">
              <p className="text-white/50 text-xs uppercase font-bold mb-2">AI Draft Message to {student.mentor}</p>
              <p className="text-white/80 leading-relaxed">
                "Hi {student.mentor.split(' ')[1]}, TARA has flagged <strong>{student.name}</strong> for <em>{student.reason}</em>. Please review their profile and consider a focused 1:1 intervention session within 48 hours."
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold hover:bg-white/10 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => setSent(true)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-sm hover:opacity-90 transition-opacity"
              >
                Send Alert →
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
              <CheckCircle2 size={56} className="text-emerald-400 mb-4" />
            </motion.div>
            <h4 className="text-xl font-bold text-white mb-2">Alert Sent!</h4>
            <p className="text-white/50 text-sm mb-6">{student.mentor} has been notified to follow up with {student.name} within 48 hours.</p>
            <button onClick={onClose} className="px-6 py-2 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold hover:bg-white/10 transition-colors">
              Done
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export const AtRiskPage: React.FC = () => {
  const { user } = useUser();
  const [filterLevel, setFilterLevel] = useState<RiskLevel | 'all'>('all');
  const [notifyStudent, setNotifyStudent] = useState<AtRiskStudent | null>(null);

  const filtered = filterLevel === 'all'
    ? MOCK_AT_RISK
    : MOCK_AT_RISK.filter(s => s.riskLevel === filterLevel);

  return (
    <div className="min-h-screen p-8 text-white relative">
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={20} className="text-red-400" />
            <span className="text-white/50 uppercase tracking-widest text-sm font-bold">TARA Predictive Engine</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold">
                At-Risk <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-400">Student Watch</span>
              </h1>
              <p className="text-white/40 mt-1">
                {MOCK_AT_RISK.length} students flagged for potential dropout across {new Set(MOCK_AT_RISK.map(s => s.center)).size} centers.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'critical', 'high', 'medium'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setFilterLevel(level)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize transition-all border
                    ${filterLevel === level
                      ? level === 'critical' ? 'bg-red-500/30 border-red-500/60 text-red-300'
                        : level === 'high' ? 'bg-amber-500/30 border-amber-500/60 text-amber-300'
                        : level === 'medium' ? 'bg-yellow-500/30 border-yellow-500/60 text-yellow-300'
                        : 'bg-white/10 border-white/20 text-white'
                      : 'border-white/10 text-white/50 hover:border-white/20'
                    }`}
                >
                  {level === 'all' ? `All (${MOCK_AT_RISK.length})` : level}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Critical Cases', count: MOCK_AT_RISK.filter(s => s.riskLevel === 'critical').length, color: 'bg-red-500/10 border-red-500/20 text-red-400' },
            { label: 'High Risk', count: MOCK_AT_RISK.filter(s => s.riskLevel === 'high').length, color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
            { label: 'Moderate Risk', count: MOCK_AT_RISK.filter(s => s.riskLevel === 'medium').length, color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
          ].map(stat => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-xl border ${stat.color} text-center`}
            >
              <p className="text-3xl font-black">{stat.count}</p>
              <p className="text-xs font-bold uppercase tracking-wider mt-1 opacity-70">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Student List */}
        <div className="space-y-4">
          {filtered.map((student, i) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`glass-card p-5 border-l-4 ${RISK_STYLE[student.riskLevel]} hover:bg-white/[0.06] transition-all`}
            >
              <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500/30 to-amber-500/30 border border-white/10 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {student.name.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-white">{student.name}</h3>
                      <span className="text-white/40 text-xs">{student.class} • {student.center}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${RISK_BADGE[student.riskLevel]}`}>
                        {student.riskLevel}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-white/70`}>
                        {REASON_ICON[student.reason]}
                        {student.reason}
                      </span>
                      <span className="flex items-center gap-1 text-white/40 text-xs">
                        <Clock size={12} /> Inactive {student.daysSinceActivity} days
                      </span>
                    </div>

                    <p className="text-white/50 text-sm">{student.reasonDetail}</p>

                    <div className="flex items-center gap-4 mt-2 text-xs text-white/30">
                      <span>Mentor: <span className="text-white/60 font-semibold">{student.mentor}</span></span>
                      <span>Streak: <span className="line-through text-white/30">{student.streakBefore}</span> → <span className="text-red-400 font-bold">{student.streakNow}</span></span>
                    </div>
                  </div>
                </div>

                {/* Notify Button */}
                <button
                  onClick={() => setNotifyStudent(student)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 font-bold text-sm hover:bg-red-500/20 transition-colors flex-shrink-0 whitespace-nowrap"
                >
                  <MessageCircle size={16} /> Notify Mentor
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Notify Modal */}
      <AnimatePresence>
        {notifyStudent && (
          <NotifyModal student={notifyStudent} onClose={() => setNotifyStudent(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AtRiskPage;
