import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import DNAChart from '@/components/DNAChart';
import DailyMissions from '@/components/student/DailyMissions';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid
} from 'recharts';
import {
  AlertTriangle, TrendingUp, BookOpen, Target, Zap,
  ChevronRight, Star, Award, Brain, Compass, BarChart2,
  Flame, Users, ArrowUpRight, Lightbulb, Shield, X
} from 'lucide-react';

/* ── Mock Data ─────────────────────────────────────── */
const subjectMasteryData = [
  { subject: 'Math', mastery: 78, fullMark: 100 },
  { subject: 'Science', mastery: 64, fullMark: 100 },
  { subject: 'English', mastery: 82, fullMark: 100 },
  { subject: 'History', mastery: 45, fullMark: 100 },
  { subject: 'Geography', mastery: 71, fullMark: 100 },
  { subject: 'Computers', mastery: 90, fullMark: 100 },
];

const weeklyActivityData = [
  { day: 'Mon', minutes: 45, color: '#60a5fa' },
  { day: 'Tue', minutes: 62, color: '#60a5fa' },
  { day: 'Wed', minutes: 30, color: '#60a5fa' },
  { day: 'Thu', minutes: 75, color: '#60a5fa' },
  { day: 'Fri', minutes: 58, color: '#60a5fa' },
  { day: 'Sat', minutes: 90, color: '#f97316' },
  { day: 'Sun', minutes: 20, color: '#60a5fa' },
];

const weakTopics = [
  { topic: 'Algebraic Expressions', subject: 'Mathematics', severity: 'high', mastery: 32 },
  { topic: 'The Mughal Empire', subject: 'History', severity: 'high', mastery: 28 },
  { topic: 'Light & Optics', subject: 'Science', severity: 'medium', mastery: 51 },
  { topic: 'Prepositions', subject: 'English', severity: 'low', mastery: 63 },
];

const streamRecommendations = [
  {
    stream: 'Science (MPC)', match: 92, color: 'from-blue-600 to-cyan-500',
    icon: '🔬', reason: 'Strong Logical DNA + high Math mastery',
    careers: ['Engineering', 'Research', 'Technology'],
  },
  {
    stream: 'Commerce', match: 74, color: 'from-emerald-500 to-teal-500',
    icon: '📊', reason: 'Good analytical + verbal balance',
    careers: ['Business', 'Finance', 'Law'],
  },
  {
    stream: 'Humanities', match: 68, color: 'from-purple-500 to-violet-500',
    icon: '📚', reason: 'High creativity + verbal scores',
    careers: ['Journalism', 'Teaching', 'Arts'],
  },
];

/* ── Custom Tooltip ───────────────────────────────── */
const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs">
        <p className="text-white/50">{label}</p>
        <p className="text-white font-bold">{payload[0].value} min</p>
      </div>
    );
  }
  return null;
};

/* ── Weak Topic Alert Card ─────────────────────────── */
const WeakTopicCard: React.FC<{ topic: typeof weakTopics[0]; index: number }> = ({ topic, index }) => {
  const severityConfig = {
    high: { color: 'border-red-500/40 bg-red-500/10', badge: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Critical', icon: '🔴' },
    medium: { color: 'border-amber-500/40 bg-amber-500/10', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Needs Work', icon: '🟡' },
    low: { color: 'border-blue-500/40 bg-blue-500/10', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Review', icon: '🔵' },
  };
  const cfg = severityConfig[topic.severity as keyof typeof severityConfig];

  return (
    <motion.div
      className={`p-4 rounded-xl border-2 ${cfg.color} transition-all duration-200 hover:scale-[1.01]`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{topic.topic}</p>
          <p className="text-white/40 text-xs mt-0.5">{topic.subject}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${cfg.badge}`}>
            {cfg.icon} {cfg.label}
          </span>
          <span className="text-white font-bold text-sm">{topic.mastery}%</span>
        </div>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-red-500 to-amber-500"
          initial={{ width: 0 }}
          animate={{ width: `${topic.mastery}%` }}
          transition={{ duration: 0.8, delay: index * 0.07 + 0.3 }}
        />
      </div>
    </motion.div>
  );
};

/* ── 8th Grade Stream Widget ──────────────────────── */
const StreamRecommendationWidget: React.FC<{ standard: string }> = ({ standard }) => {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (parseInt(standard) < 8) return null;

  return (
    <motion.div
      className="glass-card p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Compass size={16} className="text-saffron-400" />
        <h3 className="text-white font-bold text-sm">
          Stream Recommendation
          {parseInt(standard) === 10 && (
            <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
              Board Year!
            </span>
          )}
        </h3>
      </div>
      <p className="text-white/40 text-xs mb-4">Based on your Learning DNA & performance</p>

      <div className="space-y-3">
        {streamRecommendations.map((rec, i) => (
          <motion.div
            key={rec.stream}
            className={`rounded-xl border border-white/10 overflow-hidden cursor-pointer transition-all`}
            onClick={() => setExpanded(expanded === i ? null : i)}
            whileHover={{ borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <div className="flex items-center gap-3 p-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${rec.color} flex items-center justify-center text-lg flex-shrink-0`}>
                {rec.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{rec.stream}</p>
                <p className="text-white/40 text-xs">{rec.reason}</p>
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className={`text-sm font-bold ${rec.match > 85 ? 'text-emerald-400' : rec.match > 70 ? 'text-amber-400' : 'text-white/50'}`}>
                  {rec.match}%
                </span>
                <span className="text-[10px] text-white/30">match</span>
              </div>
            </div>
            <div className="px-3 pb-0.5">
              <div className="h-1 rounded-full bg-white/10 overflow-hidden mb-3">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${rec.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${rec.match}%` }}
                  transition={{ duration: 1, delay: i * 0.1 + 0.5 }}
                />
              </div>
            </div>

            <AnimatePresence>
              {expanded === i && (
                <motion.div
                  className="px-3 pb-3 border-t border-white/10 pt-3"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <p className="text-white/40 text-xs mb-2">Career pathways:</p>
                  <div className="flex gap-2 flex-wrap">
                    {rec.careers.map((c) => (
                      <span key={c} className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/70 border border-white/10">
                        {c}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

/* ── Subject Mastery Radar ─────────────────────────── */
const MasteryRadar: React.FC = () => (
  <div style={{ height: 260 }}>
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={subjectMasteryData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="rgba(255,255,255,0.07)" gridType="polygon" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: 'Outfit' }}
        />
        <Radar
          name="Mastery"
          dataKey="mastery"
          stroke="#f97316"
          fill="#f97316"
          fillOpacity={0.2}
          strokeWidth={2}
          dot={{ r: 3, fill: '#f97316' }}
        />
      </RadarChart>
    </ResponsiveContainer>
  </div>
);

/* ── Main Higher Dashboard ─────────────────────────── */
const HigherDashboard: React.FC = () => {
  const { user, logout } = useUser();
  const standard = user?.standard ?? '7';
  const dnaScores = { logical: 81, verbal: 66, creative: 58 };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-saffron-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-20 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-saffron-400 animate-pulse" />
              <span className="text-white/40 text-sm font-medium uppercase tracking-widest">Mission Control</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">
              {user?.name ?? 'Agent'}'s{' '}
              <span className="bg-gradient-to-r from-saffron-400 to-amber-400 bg-clip-text text-transparent">
                Mission HQ
              </span>
            </h1>
            <p className="text-white/40 text-sm mt-1">Class {standard} · Mastery-focused learning</p>
          </div>

          <div className="flex gap-3">
            {[
              { icon: <Flame size={18} />, label: '12 Day', sublabel: 'Streak', color: 'amber' },
              { icon: <Star size={18} />, label: '1,240', sublabel: 'Points', color: 'brand' },
              { icon: <Users size={18} />, label: 'Top 8%', sublabel: 'of Class', color: 'emerald' },
            ].map(({ icon, label, sublabel, color }) => (
              <div key={sublabel} className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-${color}-500/10 border border-${color}-500/25`}>
                <span className={`text-${color}-400`}>{icon}</span>
                <div>
                  <p className={`text-${color}-300 font-bold text-sm leading-none`}>{label}</p>
                  <p className={`text-${color}-400/60 text-[10px]`}>{sublabel}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Daily Missions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <DailyMissions accentColor="#8b5cf6" />
            </motion.div>

            {/* Subject Mastery Radar */}
            <motion.div
              className="glass-card p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={16} className="text-saffron-400" />
                <h3 className="text-white font-bold">Subject Mastery Radar</h3>
                <span className="ml-auto text-xs text-white/30">Live · Updated today</span>
              </div>
              <MasteryRadar />

              {/* Subject list */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {subjectMasteryData.map((s) => (
                  <div key={s.subject} className="flex items-center gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: s.mastery >= 75 ? '#34d399' : s.mastery >= 55 ? '#f97316' : '#f43f5e' }}
                    />
                    <span className="text-white/60 text-xs flex-1 truncate">{s.subject}</span>
                    <span className="text-white text-xs font-bold">{s.mastery}%</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Weak Topic Alerts */}
            <motion.div
              className="glass-card p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-red-400" />
                <h3 className="text-white font-bold">Weak Topic Alerts</h3>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                  {weakTopics.filter(t => t.severity === 'high').length} Critical
                </span>
              </div>
              <div className="space-y-3">
                {weakTopics.map((topic, i) => (
                  <WeakTopicCard key={topic.topic} topic={topic} index={i} />
                ))}
              </div>
            </motion.div>

            {/* Weekly Activity */}
            <motion.div
              className="glass-card p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-brand-400" />
                <h3 className="text-white font-bold">Weekly Activity</h3>
                <span className="ml-auto text-xs text-emerald-400 flex items-center gap-1">
                  <ArrowUpRight size={12} /> 23% vs last week
                </span>
              </div>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyActivityData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.40)', fontSize: 11, fontFamily: 'Outfit' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.30)', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="minutes" radius={[6, 6, 0, 0]} fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Learning DNA */}
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
              <DNAChart scores={dnaScores} size="sm" accentColor="#f97316" />
              <div className="mt-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <p className="text-violet-300 text-xs font-medium">🧠 DNA Insight</p>
                <p className="text-white/60 text-xs mt-1">
                  Your Logical score is in the top 15% of your class. Consider challenging yourself with advanced problem sets.
                </p>
              </div>
            </motion.div>

            {/* Quick Goals */}
            <motion.div
              className="glass-card p-5"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Target size={16} className="text-emerald-400" />
                <h3 className="text-white font-bold text-sm">Mission Goals</h3>
              </div>
              <div className="space-y-3">
                {[
                  { goal: 'Complete Algebra Chapter', done: true },
                  { goal: 'Practice 3 past papers', done: false },
                  { goal: 'Fix Mughal Empire topic', done: false },
                  { goal: 'Attend Chemistry live session', done: false },
                ].map(({ goal, done }) => (
                  <div key={goal} className={`flex items-start gap-2.5 text-sm ${done ? 'opacity-50' : ''}`}>
                    <div className={`w-4 h-4 rounded mt-0.5 flex-shrink-0 flex items-center justify-center border ${done ? 'bg-emerald-500 border-emerald-500' : 'border-white/25'}`}>
                      {done && <span className="text-white text-[9px]">✓</span>}
                    </div>
                    <span className={`text-sm leading-snug ${done ? 'line-through text-white/30' : 'text-white/70'}`}>{goal}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* 8th Grade Stream Recommendation */}
            <StreamRecommendationWidget standard={standard as string} />

            {/* TARA Tip */}
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
                    Focus on Algebraic Expressions today — just 20 minutes can raise your mastery by 15%!
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

export default HigherDashboard;
