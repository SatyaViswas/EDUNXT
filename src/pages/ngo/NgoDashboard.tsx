import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts';
import { Activity, AlertTriangle, Shield, Users } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface PendingMentor {
  mentor_id: string;
  name: string;
  email: string;
}

interface AtRiskStudent {
  student_id: string;
  student_name: string;
  batch_name: string;
  attendance_rate: number;
  mentor_id?: string | null;
  mentor_name?: string | null;
}

interface OverviewData {
  total_mentors: number;
  total_students: number;
  total_active_batches: number;
  verification_queue: number;
  critical_alerts: number;
  avg_attendance: number;
  total_impact: number;
  global_dna_map: Record<string, number>;
  growth_trend: Array<{ day: string; submissions: number }>;
  unverified_mentors: PendingMentor[];
  at_risk_students: AtRiskStudent[];
}

const NgoDashboard: React.FC = () => {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvingId, setApprovingId] = useState('');

  const loadOverview = async (withLoading = false) => {
    try {
      if (withLoading) {
        setLoading(true);
      }
      setError('');
      const data = await apiRequest<OverviewData>('/ngo/overview', {}, true);
      setOverview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load NGO overview.');
    } finally {
      if (withLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadOverview(true);
    const interval = setInterval(() => {
      void loadOverview(false);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const approveMentor = async (mentorId: string) => {
    try {
      setApprovingId(mentorId);
      await apiRequest(`/ngo/verify-mentor/${mentorId}`, { method: 'PATCH' }, true);
      await loadOverview(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve mentor.');
    } finally {
      setApprovingId('');
    }
  };

  const radarData = useMemo(() => {
    const dna = overview?.global_dna_map || {};
    return [
      { axis: 'Logical', value: dna.logical || 0 },
      { axis: 'Verbal', value: dna.verbal || 0 },
      { axis: 'Creative', value: dna.creative || 0 },
      { axis: 'Visual', value: dna.visual_spatial || 0 },
      { axis: 'Memory', value: dna.memory || 0 },
      { axis: 'Pattern', value: dna.pattern || 0 },
    ];
  }, [overview]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-white flex items-center justify-center">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 flex items-center gap-3">
          <span className="inline-block h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          <span>Loading NGO overview...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8 text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold">NGO Overview</h1>
          <p className="text-white/50 mt-1">Live global visibility across mentors, students, risk alerts, and growth.</p>
          {error ? <p className="text-red-300 text-sm mt-2">{error}</p> : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div className="rounded-2xl border border-brand-400/30 bg-brand-500/10 p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-xs uppercase tracking-widest text-brand-200/80">Total Impact</p>
            <p className="text-4xl font-black mt-2">{overview?.total_impact ?? 0}</p>
            <p className="text-sm text-brand-100/80 mt-2">Students reached across the platform</p>
          </motion.div>

          <motion.div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-xs uppercase tracking-widest text-emerald-200/80">System Health</p>
            <p className="text-4xl font-black mt-2">{Number(overview?.avg_attendance ?? 0).toFixed(1)}%</p>
            <p className="text-sm text-emerald-100/80 mt-2">Average attendance across all students</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-5 rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Shield size={16} className="text-amber-300" /> Mentor Verification Queue</h2>
            <div className="space-y-3">
              {(overview?.unverified_mentors || []).map((mentor) => (
                <div key={mentor.mentor_id} className="rounded-xl border border-white/10 bg-slate-900/70 p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{mentor.name}</p>
                    <p className="text-xs text-white/50">{mentor.email}</p>
                  </div>
                  <button
                    onClick={() => void approveMentor(mentor.mentor_id)}
                    disabled={approvingId === mentor.mentor_id}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-400/30 bg-emerald-500/15 text-emerald-200 disabled:opacity-50"
                  >
                    {approvingId === mentor.mentor_id ? 'Approving...' : 'Approve'}
                  </button>
                </div>
              ))}
              {(overview?.unverified_mentors || []).length === 0 ? <p className="text-sm text-white/60">No mentors waiting for approval.</p> : null}
            </div>
          </section>

          <section className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Users size={16} className="text-brand-300" /> Global At-Risk Attendance List</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/50 border-b border-white/10">
                    <th className="text-left py-2">Student</th>
                    <th className="text-left py-2">Batch</th>
                    <th className="text-left py-2">Attendance</th>
                    <th className="text-left py-2">Mentor</th>
                  </tr>
                </thead>
                <tbody>
                  {(overview?.at_risk_students || []).map((row) => (
                    <tr key={row.student_id} className="border-b border-white/5">
                      <td className="py-2">{row.student_name}</td>
                      <td className="py-2 text-white/70">{row.batch_name}</td>
                      <td className="py-2 text-red-300">{Number(row.attendance_rate).toFixed(1)}%</td>
                      <td className="py-2">
                        <Link to="/ngo/mentors" className="text-brand-300 hover:underline">{row.mentor_name || 'Unassigned'}</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(overview?.at_risk_students || []).length === 0 ? <p className="text-sm text-white/60 py-4">No attendance risk alerts currently.</p> : null}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Activity size={16} className="text-violet-300" /> Global DNA Map</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 11 }} />
                  <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Activity size={16} className="text-emerald-300" /> Growth Trend (Last 30 Days)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overview?.growth_trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="submissions" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-300" /> Recent Activity Feed</h2>
          <div className="space-y-2">
            {(overview?.activity_feed || []).map((item) => (
              <div key={item.issue_id} className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm">
                <span className="font-semibold text-white">{item.student_name}</span>
                <span className="text-white/60"> • {item.issue_type} • {item.status} • by {item.mentor_name}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default NgoDashboard;
