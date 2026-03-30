import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import DNAChart from '@/components/DNAChart';
import DailyMissions from '@/components/student/DailyMissions';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, Radar, AreaChart, Area
} from 'recharts';
import {
  Target, TrendingUp, BookOpen, Award, CheckCircle2,
  ChevronRight, Flame, Brain, Compass, Lock, Star,
  ArrowRight, Rocket, GraduationCap, Beaker, Calculator,
  FlaskConical, Globe, Microscope, Code2, BarChart2, Lightbulb
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────── */
type Stream = 'MPC' | 'BiPC';

/* ── Mock data ─────────────────────────────────────── */
const mpcSubjects = [
  { name: 'Mathematics', icon: '∑', mastery: 84, target: 95, color: '#60a5fa' },
  { name: 'Physics', icon: '⚡', mastery: 71, target: 90, color: '#a78bfa' },
  { name: 'Chemistry', icon: '⚗', mastery: 60, target: 85, color: '#f97316' },
];

const bipcSubjects = [
  { name: 'Biology', icon: '🧬', mastery: 88, target: 95, color: '#34d399' },
  { name: 'Physics', icon: '⚡', mastery: 67, target: 85, color: '#a78bfa' },
  { name: 'Chemistry', icon: '⚗', mastery: 72, target: 90, color: '#f97316' },
];

const mpcRadarData = [
  { subject: 'Calculus', value: 78 },
  { subject: 'Mechanics', value: 65 },
  { subject: 'Organic Chem', value: 58 },
  { subject: 'Algebra', value: 84 },
  { subject: 'Thermodynamics', value: 71 },
  { subject: 'Electrostatics', value: 69 },
];

const bipcRadarData = [
  { subject: 'Cell Bio', value: 92 },
  { subject: 'Genetics', value: 80 },
  { subject: 'Organic Chem', value: 65 },
  { subject: 'Ecology', value: 88 },
  { subject: 'Physics', value: 60 },
  { subject: 'Biochemistry', value: 75 },
];

const mockTimelineData = [
  { month: 'Aug', score: 61 },
  { month: 'Sep', score: 65 },
  { month: 'Oct', score: 70 },
  { month: 'Nov', score: 68 },
  { month: 'Dec', score: 74 },
  { month: 'Jan', score: 79 },
  { month: 'Feb', score: 82 },
  { month: 'Mar', score: 85 },
];

const mpcCareers = [
  { icon: <Code2 size={18} />, title: 'Software Engineering', top: true, institutions: ['IIT', 'NIT', 'IIIT'], color: 'from-blue-600 to-cyan-500' },
  { icon: <Calculator size={18} />, title: 'Data Science', top: false, institutions: ['IISc', 'IIT', 'BITS'], color: 'from-violet-600 to-purple-500' },
  { icon: <Rocket size={18} />, title: 'Aerospace Eng.', top: false, institutions: ['ISRO', 'IIT', 'DRDO'], color: 'from-saffron-500 to-amber-500' },
  { icon: <BarChart2 size={18} />, title: 'Finance & Quant', top: false, institutions: ['IIM', 'ISB', 'CFA'], color: 'from-emerald-600 to-teal-500' },
];

const bipcCareers = [
  { icon: <Microscope size={18} />, title: 'Medicine (MBBS)', top: true, institutions: ['AIIMS', 'JIPMER', 'State Med.'], color: 'from-emerald-600 to-teal-500' },
  { icon: <FlaskConical size={18} />, title: 'Pharmacy', top: false, institutions: ['MAHE', 'Amrita', 'BITS'], color: 'from-blue-600 to-cyan-500' },
  { icon: <Globe size={18} />, title: 'Environmental Sci.', top: false, institutions: ['JNU', 'DU', 'TIFR'], color: 'from-green-600 to-lime-500' },
  { icon: <Brain size={18} />, title: 'Neuroscience', top: false, institutions: ['IISc', 'NIMHANS', 'TIFR'], color: 'from-violet-600 to-purple-500' },
];

const exams = {
  MPC: [
    { name: 'JEE Main', date: 'Jan 2025', status: 'upcoming', daysLeft: 280, color: '#60a5fa' },
    { name: 'JEE Advanced', date: 'May 2025', status: 'upcoming', daysLeft: 400, color: '#a78bfa' },
    { name: 'BITSAT', date: 'Jun 2025', status: 'upcoming', daysLeft: 430, color: '#f97316' },
  ],
  BiPC: [
    { name: 'NEET-UG', date: 'May 2025', status: 'upcoming', daysLeft: 390, color: '#34d399' },
    { name: 'AIIMS', date: 'Jun 2025', status: 'upcoming', daysLeft: 430, color: '#60a5fa' },
    { name: 'JIPMER', date: 'Jun 2025', status: 'upcoming', daysLeft: 435, color: '#f97316' },
  ],
};

/* ── Custom tooltip ─────────────────────────────────── */
const ChartTip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="text-white/50">{label}</p>
        <p className="text-white font-bold">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

/* ── Stream Selector ─────────────────────────────────── */
const StreamSelector: React.FC<{ stream: Stream; onChange: (s: Stream) => void }> = ({ stream, onChange }) => (
  <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
    {(['MPC', 'BiPC'] as Stream[]).map((s) => (
      <motion.button
        key={s}
        onClick={() => onChange(s)}
        className={`
          relative px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer
          ${stream === s ? 'text-white' : 'text-white/40 hover:text-white/70'}
        `}
      >
        {stream === s && (
          <motion.div
            layoutId="stream-pill"
            className="absolute inset-0 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 shadow-lg shadow-brand-600/30"
          />
        )}
        <span className="relative z-10">{s}</span>
      </motion.button>
    ))}
  </div>
);

/* ── Goal Tracker ─────────────────────────────────────── */
const GoalTracker: React.FC<{ subjects: typeof mpcSubjects }> = ({ subjects }) => (
  <div className="space-y-4">
    {subjects.map((s, i) => {
      const gap = s.target - s.mastery;
      return (
        <motion.div
          key={s.name}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold"
              style={{ backgroundColor: `${s.color}20`, color: s.color }}
            >
              {s.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">{s.name}</p>
              <p className="text-white/40 text-xs">Target: {s.target}% · Gap: {gap}%</p>
            </div>
            <span className="font-bold text-sm" style={{ color: s.color }}>{s.mastery}%</span>
          </div>
          <div className="relative h-2 rounded-full bg-white/10 overflow-visible">
            {/* Target marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/30 rounded-full z-10"
              style={{ left: `${s.target}%` }}
            />
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: s.color }}
              initial={{ width: 0 }}
              animate={{ width: `${s.mastery}%` }}
              transition={{ duration: 1, delay: i * 0.1 + 0.3, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      );
    })}
  </div>
);

/* ── Career Roadmap ──────────────────────────────────── */
const CareerRoadmap: React.FC<{ careers: typeof mpcCareers }> = ({ careers }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {careers.map((c, i) => (
      <motion.div
        key={c.title}
        whileHover={{ y: -3 }}
        className={`
          relative p-4 rounded-xl border overflow-hidden
          ${c.top ? 'border-saffron-500/50 bg-saffron-500/10' : 'border-white/10 bg-white/5'}
          cursor-pointer transition-all duration-200 hover:border-white/25
        `}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.08 }}
      >
        {c.top && (
          <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full bg-saffron-500/30 text-saffron-400 border border-saffron-500/40 font-bold uppercase">
            Top Pick
          </span>
        )}
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center text-white mb-3`}>
          {c.icon}
        </div>
        <p className="text-white font-bold text-sm mb-1">{c.title}</p>
        <div className="flex gap-1 flex-wrap">
          {c.institutions.map((inst) => (
            <span key={inst} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">{inst}</span>
          ))}
        </div>
      </motion.div>
    ))}
  </div>
);

/* ── Main Intermediate Dashboard ───────────────────── */
const IntermediateDashboard: React.FC = () => {
  const { user, logout } = useUser();
  const standard = user?.standard ?? '11';
  const [stream, setStream] = useState<Stream>('MPC');

  const subjects = stream === 'MPC' ? mpcSubjects : bipcSubjects;
  const radarData = stream === 'MPC' ? mpcRadarData : bipcRadarData;
  const careers = stream === 'MPC' ? mpcCareers : bipcCareers;
  const streamExams = exams[stream];
  const dnaScores = stream === 'MPC'
    ? { logical: 88, verbal: 62, creative: 55 }
    : { logical: 70, verbal: 74, creative: 80 };

  const accentColor = stream === 'MPC' ? '#60a5fa' : '#34d399';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-10 ${stream === 'MPC' ? 'bg-blue-600' : 'bg-emerald-600'}`} />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="flex flex-wrap items-center justify-between gap-4 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap size={16} className="text-white/40" />
              <span className="text-white/40 text-sm font-medium uppercase tracking-widest">The Specialist · Class {standard}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">
              {user?.name ?? 'Specialist'}'s{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(135deg, ${accentColor}, ${stream === 'MPC' ? '#a78bfa' : '#a78bfa'})` }}
              >
                {stream} Command
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <StreamSelector stream={stream} onChange={setStream} />
            <div className="flex gap-3">
              <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
                <p className="text-white font-bold text-sm">12</p>
                <p className="text-white/30 text-[10px]">Day Streak</p>
              </div>
              <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
                <p className="text-white font-bold text-sm">Rank 14</p>
                <p className="text-white/30 text-[10px]">of 240</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Daily Missions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <DailyMissions accentColor={accentColor} />
            </motion.div>

            {/* Subject Goal Trackers */}
            <motion.div
              className="glass-card p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Target size={16} style={{ color: accentColor }} />
                <h3 className="text-white font-bold">
                  {stream} Subject Goal Tracker
                </h3>
                <span className="ml-auto text-xs text-white/30">Target · Progress</span>
              </div>
              <GoalTracker subjects={subjects} />
            </motion.div>

            {/* Performance Timeline */}
            <motion.div
              className="glass-card p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-emerald-400" />
                <h3 className="text-white font-bold">Performance Timeline</h3>
                <span className="ml-auto text-xs text-emerald-400">+24pts this year</span>
              </div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockTimelineData}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={accentColor} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={accentColor} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.40)', fontSize: 11, fontFamily: 'Outfit' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[50, 100]} tick={{ fill: 'rgba(255,255,255,0.30)', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip content={<ChartTip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <Area type="monotone" dataKey="score" stroke={accentColor} strokeWidth={2.5} fill="url(#scoreGrad)" dot={{ r: 4, fill: accentColor, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Post-12th Career Roadmap */}
            <motion.div
              className="glass-card p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Rocket size={16} className="text-saffron-400" />
                <h3 className="text-white font-bold">Post-12th Career Roadmap</h3>
              </div>
              <p className="text-white/40 text-xs mb-4">Based on your {stream} stream & DNA profile</p>
              <CareerRoadmap careers={careers} />
            </motion.div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-5">
            {/* DNA Helix */}
            <motion.div
              className="glass-card p-5"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Brain size={16} className="text-violet-400" />
                <h3 className="text-white font-bold text-sm">Learning DNA Helix</h3>
              </div>
              <DNAChart scores={dnaScores} size="sm" accentColor={accentColor} />
              <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/50 text-xs leading-relaxed">
                  {stream === 'MPC'
                    ? '🧠 Your strong Logical DNA aligns perfectly with Engineering & Research.'
                    : '🌿 Your high Creative + Verbal DNA suits Medicine & Biological Sciences.'}
                </p>
              </div>
            </motion.div>

            {/* Topic Radar */}
            <motion.div
              className="glass-card p-5"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={16} style={{ color: accentColor }} />
                <h3 className="text-white font-bold text-sm">Topic Mastery Radar</h3>
              </div>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 10, right: 25, bottom: 10, left: 25 }}>
                    <PolarGrid stroke="rgba(255,255,255,0.07)" gridType="polygon" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: 'rgba(255,255,255,0.40)', fontSize: 10, fontFamily: 'Outfit' }}
                    />
                    <Radar name="Topic" dataKey="value" stroke={accentColor} fill={accentColor} fillOpacity={0.2} strokeWidth={2} dot={{ r: 2.5, fill: accentColor }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Entrance Exam Countdown */}
            <motion.div
              className="glass-card p-5"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Award size={16} className="text-amber-400" />
                <h3 className="text-white font-bold text-sm">Entrance Exam Radar</h3>
              </div>
              <div className="space-y-3">
                {streamExams.map((exam) => (
                  <div key={exam.name} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: exam.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">{exam.name}</p>
                      <p className="text-white/40 text-xs">{exam.date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white font-bold text-sm">{exam.daysLeft}</p>
                      <p className="text-white/30 text-[10px]">days left</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* TARA */}
            <motion.div
              className="glass-card p-4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🤖</div>
                <div>
                  <p className="text-white font-semibold text-xs">TARA says:</p>
                  <p className="text-white/50 text-xs mt-0.5">
                    {stream === 'MPC'
                      ? 'JEE Main is 280 days away. Start with NCERT Calculus — your weakest {stream} topic right now!'
                      : 'NEET-UG is 390 days away. Genetics is your strength — build on it!'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntermediateDashboard;
