import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Users, CalendarCheck2, BookOpenCheck, ShieldCheck, AlertTriangle, Link2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface BatchItem {
  batch_id: string;
  batch_name: string;
  subject: string;
  created_at: string;
  student_count: number;
  roadmap?: Record<string, unknown> | null;
}

interface MentorStudent {
  student_id: string;
  name: string;
  standard: number;
  attendance_rate?: number;
}

interface MentorStats {
  total_students: number;
  active_batches: number;
  open_issues: number;
  at_risk_count: number;
  batch_averages: Record<string, { average_attendance: number; student_count: number }>;
}

const MentorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [groupedStudents, setGroupedStudents] = useState<Record<string, MentorStudent[]>>({});
  const [stats, setStats] = useState<MentorStats>({
    total_students: 0,
    active_batches: 0,
    open_issues: 0,
    at_risk_count: 0,
    batch_averages: {},
  });
  const [selectedBatchName, setSelectedBatchName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        if (active) {
          setLoading(true);
          setError('');
        }

        const [batchData, studentData, statsData] = await Promise.all([
          apiRequest<BatchItem[]>('/mentor/batches', {}, true),
          apiRequest<Record<string, MentorStudent[]>>('/mentor/students', {}, true),
          apiRequest<MentorStats>('/mentor/stats', {}, true),
        ]);

        if (!active) {
          return;
        }

        setBatches(batchData || []);
        setGroupedStudents(studentData || {});
        setStats(statsData);

        if (!selectedBatchName && batchData?.length) {
          setSelectedBatchName(batchData[0].batch_name);
        }
      } catch (err) {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load mentor dashboard.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const totalStudents = useMemo(
    () => Object.values(groupedStudents).reduce((sum, list) => sum + list.length, 0),
    [groupedStudents],
  );

  const avgAttendance = useMemo(() => {
    const allStudents = Object.values(groupedStudents).flat();
    if (!allStudents.length) {
      return 0;
    }
    const total = allStudents.reduce((sum, s) => sum + Number(s.attendance_rate ?? 0), 0);
    return Math.round((total / allStudents.length) * 10) / 10;
  }, [groupedStudents]);

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.batch_name === selectedBatchName) || null,
    [batches, selectedBatchName],
  );

  const selectedBatchRoadmap = selectedBatch?.roadmap;

  const selectedBatchAverageAttendance = useMemo(() => {
    if (!selectedBatchName) {
      return 0;
    }
    return Number(stats.batch_averages?.[selectedBatchName]?.average_attendance ?? 0);
  }, [selectedBatchName, stats.batch_averages]);

  const selectedBatchProgress = useMemo(() => {
    if (!selectedBatch?.created_at) {
      return 0;
    }
    const createdAt = new Date(selectedBatch.created_at).getTime();
    if (Number.isNaN(createdAt)) {
      return 0;
    }
    const elapsedMs = Date.now() - createdAt;
    const elapsedWeeks = Math.max(0, elapsedMs / (1000 * 60 * 60 * 24 * 7));
    const percent = Math.min(100, (elapsedWeeks / 16) * 100);
    return Math.round(percent);
  }, [selectedBatch]);

  const verifyMentorStatus = async () => {
    try {
      setVerificationStatus('Checking verification status...');
      const profile = await apiRequest<{ status: string; exam_score?: number }>('/mentor/profile', {}, true);
      setVerificationStatus(`Mentor status: ${profile.status}${profile.exam_score ? ` • Exam score: ${profile.exam_score}` : ''}`);
    } catch (err) {
      setVerificationStatus(err instanceof Error ? err.message : 'Unable to verify mentor status.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-8 md:px-8 text-white">
        <div className="mx-auto w-full max-w-7xl rounded-2xl border border-white/10 bg-white/5 p-8 flex items-center gap-3">
          <span className="inline-block h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          <span>Loading mentor dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-8 md:px-8 text-white">
        <div className="mx-auto w-full max-w-7xl rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-red-200">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-white">Mentor Dashboard</h1>
          <p className="mt-1 text-sm text-white/60">Focused overview of active batches and the master learning roadmap.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/60 uppercase tracking-wide">Total Students</p>
            <p className="mt-2 text-2xl font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-brand-300" />
              {stats.total_students || totalStudents}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/60 uppercase tracking-wide">Average Batch Attendance</p>
            <p className="mt-2 text-2xl font-bold text-white flex items-center gap-2">
              <CalendarCheck2 size={18} className="text-emerald-300" />
              {(avgAttendance || selectedBatchAverageAttendance).toFixed(1)}%
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/60 uppercase tracking-wide">Active Batches</p>
            <p className="mt-2 text-2xl font-bold text-white flex items-center gap-2">
              <Layers size={18} className="text-amber-300" />
              {stats.active_batches || batches.length}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <section className="rounded-xl border border-white/10 bg-white/5 p-4 lg:col-span-2">
            <h2 className="text-sm font-bold text-white/90 mb-3">Batch Progress Bar</h2>
            <p className="text-xs text-white/60 mb-3">
              {selectedBatch ? `${selectedBatch.batch_name} • Week progress in 16-week roadmap` : 'Select a batch to view progress'}
            </p>
            <div className="h-3 rounded-full bg-slate-800 border border-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${selectedBatchProgress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-white/70">{selectedBatchProgress}% completed</p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-sm font-bold text-white/90 mb-3">Batch Health</h2>
            <div className="space-y-2 text-sm">
              <p className="text-white/80 flex items-center gap-2"><CalendarCheck2 size={14} className="text-emerald-300" /> Average Attendance: <span className="font-semibold">{selectedBatchAverageAttendance.toFixed(1)}%</span></p>
              <p className="text-white/80 flex items-center gap-2"><AlertTriangle size={14} className="text-amber-300" /> Total Flagged Issues: <span className="font-semibold">{stats.open_issues}</span></p>
              <p className="text-white/80 flex items-center gap-2"><AlertTriangle size={14} className="text-red-300" /> At Risk Count: <span className="font-semibold">{stats.at_risk_count}</span></p>
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-white/10 bg-white/5 p-4 mb-6">
          <h2 className="text-sm font-bold text-white/90 mb-3 flex items-center gap-2"><Link2 size={14} className="text-brand-300" /> Quick Links</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/mentor/progress')}
              className="px-4 py-2 rounded-lg border border-brand-400/30 bg-brand-500/15 text-brand-200 text-sm font-semibold"
            >
              Post Assignment
            </button>
            <button
              onClick={() => void verifyMentorStatus()}
              className="px-4 py-2 rounded-lg border border-emerald-400/30 bg-emerald-500/15 text-emerald-200 text-sm font-semibold flex items-center gap-2"
            >
              <ShieldCheck size={14} /> Verify Mentor
            </button>
            {verificationStatus ? <p className="text-xs text-white/70 self-center">{verificationStatus}</p> : null}
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-bold text-white mb-4">Active Batches</h2>
            <div className="space-y-3">
              {batches.map((batch) => {
                const students = groupedStudents[batch.batch_name] || [];
                const standard = students[0]?.standard;

                return (
                <button
                  key={batch.batch_id}
                  onClick={() => setSelectedBatchName(batch.batch_name)}
                  className={`w-full text-left rounded-xl border p-4 transition ${selectedBatchName === batch.batch_name ? 'border-brand-400/40 bg-brand-500/15' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                >
                  <p className="text-sm font-semibold text-white">{batch.batch_name}</p>
                  <p className="text-xs text-white/60 mt-1">{standard ? `Standard ${standard}` : 'Standard not set'}</p>
                </button>
                );
              })}
              {!batches.length ? <p className="text-sm text-white/60">No active batches found.</p> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <BookOpenCheck size={18} className="text-brand-300" />
              Master Learning Roadmap
            </h2>
            <p className="text-sm text-white/60 mb-4">
              {selectedBatch ? `Viewing: ${selectedBatch.batch_name}` : 'Select a batch to view its roadmap.'}
            </p>

            {selectedBatchRoadmap ? (
              <pre className="rounded-xl bg-slate-900/80 border border-white/10 p-4 text-xs text-white/80 overflow-auto max-h-[520px] whitespace-pre-wrap">
                {JSON.stringify(selectedBatchRoadmap, null, 2)}
              </pre>
            ) : (
              <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-8 text-sm text-white/60">
                No roadmap found for this batch yet.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;
