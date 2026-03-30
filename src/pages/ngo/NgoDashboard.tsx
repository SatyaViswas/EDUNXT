import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Users, Shield, AlertTriangle, Building,
  Briefcase, Sparkles, BookOpen
} from 'lucide-react';
import BatchingTool from '@/components/ngo/BatchingTool';
import TaraExecutive from '@/components/ngo/TaraExecutive';

const growthData = [
  { month: 'Jul', baseline: 45, center_a: 45, center_b: 45, center_c: 45 },
  { month: 'Aug', baseline: 45, center_a: 49, center_b: 47, center_c: 50 },
  { month: 'Sep', baseline: 45, center_a: 57, center_b: 53, center_c: 61 },
  { month: 'Oct', baseline: 45, center_a: 68, center_b: 62, center_c: 72 },
  { month: 'Nov', baseline: 45, center_a: 79, center_b: 73, center_c: 81 },
  { month: 'Dec', baseline: 45, center_a: 88, center_b: 79, center_c: 91 },
];

const syllabusData = [
  { subject: 'Mathematics', coverage: 84, fill: '#3b82f6' },
  { subject: 'Science', coverage: 71, fill: '#10b981' },
  { subject: 'English', coverage: 92, fill: '#8b5cf6' },
  { subject: 'Social Studies', coverage: 65, fill: '#f59e0b' },
  { subject: 'Hindi', coverage: 78, fill: '#ec4899' },
];

const ChartTip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-xs shadow-2xl space-y-1">
        <p className="text-white/50 font-bold mb-2">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.stroke || p.fill }} className="font-semibold">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const NgoDashboard: React.FC = () => {
  const { user } = useUser();
  const [taraOpen, setTaraOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white relative flex flex-col">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-100px] right-[-100px] w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[-100px] left-[20%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl opacity-50" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-8 w-full flex-1">

        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building size={16} className="text-brand-400" />
              <span className="text-white/40 text-sm font-semibold uppercase tracking-widest">Global Executive View</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Sahaayak <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-violet-400">HQ</span>
            </h1>
            <p className="text-white/50 text-sm mt-3 flex items-center gap-2">
              <Briefcase size={14} /> Logged in as: Director {user?.name}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTaraOpen(true)}
              className="flex items-center gap-3 px-6 py-3 rounded-full bg-slate-900 border border-brand-500/30 hover:bg-brand-500/10 hover:border-brand-500/60 transition-all group shadow-[0_0_15px_rgba(59,130,246,0.15)]"
            >
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-brand-400 rounded-full blur-sm opacity-50 group-hover:opacity-100 transition-opacity animate-pulse" />
                <Sparkles size={18} className="text-brand-300 relative z-10" />
              </div>
              <span className="font-bold text-white group-hover:text-brand-300 transition-colors">TARA Executive</span>
            </button>
          </div>
        </motion.div>

        {/* Global KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Learners', val: '14,250', delta: '+12%', color: 'border-blue-500/30 bg-blue-500/10 text-blue-400', icon: <Users size={20} /> },
            { label: 'Avg Value Add', val: '+40 ALL', delta: '+6%', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400', icon: <TrendingUp size={20} /> },
            { label: 'Verified Mentors', val: '1,120', delta: '+45', color: 'border-violet-500/30 bg-violet-500/10 text-violet-400', icon: <Shield size={20} /> },
            { label: 'At-Risk Batches', val: '12', delta: '-3', color: 'border-red-500/30 bg-red-500/10 text-red-400', icon: <AlertTriangle size={20} /> },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`p-5 rounded-2xl border bg-white/[0.03] backdrop-blur-md hover:bg-white/[0.06] transition-all ${stat.color.split(' ')[0]}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${stat.color.split(' ')[1]} ${stat.color.split(' ')[2]}`}>
                  {stat.icon}
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.delta.startsWith('+') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {stat.delta}
                </span>
              </div>
              <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-white tracking-tight">{stat.val}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Analytics Column */}
          <div className="lg:col-span-7 space-y-8">

            {/* Growth Trends Chart — Multi-Center */}
            <motion.div
              className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="text-emerald-400" /> Growth Trends: Baseline vs. Current
                  </h3>
                  <p className="text-white/40 text-xs mt-1">All Learning Level (ALL) per center for FY 2025.</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/50">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-400 inline-block" /> Center A</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-400 inline-block" /> Center B</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-violet-400 inline-block" /> Center C</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-slate-500 border-dashed inline-block border-b border-slate-500" /> Baseline</span>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradC" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                    <Tooltip content={<ChartTip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <Area type="monotone" dataKey="center_a" name="Center A" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#gradA)" />
                    <Area type="monotone" dataKey="center_b" name="Center B" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#gradB)" />
                    <Area type="monotone" dataKey="center_c" name="Center C" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#gradC)" />
                    <Area type="monotone" dataKey="baseline" name="Baseline" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Syllabus Coverage */}
            <motion.div
              className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="text-brand-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">Syllabus Coverage</h3>
                  <p className="text-white/40 text-xs">Aggregate syllabus completion across all centers — FY 2025.</p>
                </div>
              </div>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={syllabusData} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} width={90} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      formatter={(val: number) => [`${val}%`, 'Coverage']}
                      contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}
                      labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                    />
                    <Bar dataKey="coverage" radius={[0, 6, 6, 0]}>
                      {syllabusData.map((entry) => (
                        <Cell key={entry.subject} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

          </div>

          {/* Right Col: Batching Engine */}
          <motion.div
            className="lg:col-span-5 h-[calc(100%-80px)]"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <BatchingTool />
          </motion.div>

        </div>
      </div>

      <TaraExecutive isOpen={taraOpen} onClose={() => setTaraOpen(false)} />
    </div>
  );
};

export default NgoDashboard;
