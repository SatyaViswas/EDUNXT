import React, { useEffect, useMemo, useState } from 'react';
import { Flame, Trophy, Award, Bell, BookOpen, X } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { apiRequest } from '@/lib/api';

interface DashboardStats {
  xp: number;
  streak: number;
  badges: string[];
}

interface AssignmentItem {
  id: string;
  title: string;
  description?: string | null;
  due_date: string;
  batch_name: string;
}

interface NotificationItem {
  id: string;
  issue_type: string;
  description: string;
  status: string;
  created_at: string;
  alert_text: string;
}

interface DashboardData {
  stats: DashboardStats;
  roadmap: Record<string, unknown> | null;
  assignments: AssignmentItem[];
  notifications: NotificationItem[];
}

interface AttemptModalState {
  open: boolean;
  assignment: AssignmentItem | null;
  responseText: string;
  submitting: boolean;
}

const EMPTY_DATA: DashboardData = {
  stats: { xp: 0, streak: 0, badges: [] },
  roadmap: null,
  assignments: [],
  notifications: [],
};

function extractCurrentWeek(roadmap: Record<string, unknown> | null): string {
  if (!roadmap) return 'Roadmap not available yet.';

  const currentWeek = roadmap.current_week;
  if (typeof currentWeek === 'string' && currentWeek.trim()) {
    return currentWeek;
  }

  const weeks = roadmap.weeks;
  if (Array.isArray(weeks)) {
    const firstOpen = weeks.find((week: any) => !week?.completed) || weeks[0];
    if (firstOpen && typeof firstOpen === 'object') {
      const label = firstOpen.title || firstOpen.week || firstOpen.name;
      if (typeof label === 'string' && label.trim()) {
        return label;
      }
    }
  }

  for (const [key, value] of Object.entries(roadmap)) {
    if (key.toLowerCase().includes('week') && typeof value === 'string') {
      return value;
    }
  }

  return 'Current week details unavailable in roadmap.';
}

const StudentDashboard: React.FC = () => {
  const { user } = useUser();
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [showFullRoadmap, setShowFullRoadmap] = useState(false);
  const [attemptModal, setAttemptModal] = useState<AttemptModalState>({
    open: false,
    assignment: null,
    responseText: '',
    submitting: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const progressToNextMilestone = useMemo(() => {
    const cycleTarget = 500;
    const currentCycleXp = data.stats.xp % cycleTarget;
    return Math.round((currentCycleXp / cycleTarget) * 100);
  }, [data.stats.xp]);

  const currentWeekText = useMemo(() => extractCurrentWeek(data.roadmap), [data.roadmap]);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        if (active) {
          setLoading(true);
          setError('');
        }

        const dashboardData = await apiRequest<DashboardData>('/student/dashboard-data', {}, true);

        if (!active) return;
        setData({
          stats: {
            xp: Number(dashboardData?.stats?.xp ?? 0),
            streak: Number(dashboardData?.stats?.streak ?? 0),
            badges: Array.isArray(dashboardData?.stats?.badges) ? dashboardData.stats.badges : [],
          },
          roadmap: (dashboardData?.roadmap as Record<string, unknown>) || null,
          assignments: Array.isArray(dashboardData?.assignments) ? dashboardData.assignments : [],
          notifications: Array.isArray(dashboardData?.notifications) ? dashboardData.notifications : [],
        });
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();
    const intervalId = setInterval(loadDashboard, 30000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  const openAttemptModal = (assignment: AssignmentItem) => {
    setAttemptModal({
      open: true,
      assignment,
      responseText: '',
      submitting: false,
    });
  };

  const closeAttemptModal = () => {
    setAttemptModal({
      open: false,
      assignment: null,
      responseText: '',
      submitting: false,
    });
  };

  const submitAttempt = async () => {
    if (!attemptModal.assignment) return;
    const cleaned = attemptModal.responseText.trim();
    if (cleaned.length < 3) {
      setError('Please add a meaningful response before submitting.');
      return;
    }

    try {
      setError('');
      setAttemptModal((prev) => ({ ...prev, submitting: true }));

      await apiRequest('/student/submit-assignment', {
        method: 'POST',
        body: JSON.stringify({
          assignment_id: attemptModal.assignment.id,
          response_text: cleaned,
        }),
      }, true);

      const refreshed = await apiRequest<DashboardData>('/student/dashboard-data', {}, true);
      setData({
        stats: {
          xp: Number(refreshed?.stats?.xp ?? 0),
          streak: Number(refreshed?.stats?.streak ?? 0),
          badges: Array.isArray(refreshed?.stats?.badges) ? refreshed.stats.badges : [],
        },
        roadmap: (refreshed?.roadmap as Record<string, unknown>) || null,
        assignments: Array.isArray(refreshed?.assignments) ? refreshed.assignments : [],
        notifications: Array.isArray(refreshed?.notifications) ? refreshed.notifications : [],
      });
      closeAttemptModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit assignment response.');
      setAttemptModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  if (loading) {
    return <div className="p-8 text-white/70">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen p-8 text-white relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[480px] h-[480px] bg-brand-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[420px] h-[420px] bg-saffron-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-6">
        <div>
          <p className="text-white/50 uppercase tracking-widest text-xs font-bold">Dashboard</p>
          <h1 className="text-3xl font-extrabold mt-1">
            {user?.name || 'Student'}'s Daily Command Center
          </h1>
          <p className="text-white/50 mt-2">Focus on streak, XP momentum, and your immediate next lesson.</p>
        </div>

        {error ? <div className="text-red-300 text-sm">{error}</div> : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
            <div className="flex items-center gap-2 text-amber-300 text-xs uppercase tracking-wide"><Flame size={14} /> Streak</div>
            <p className="text-2xl font-bold mt-2">{data.stats.streak}</p>
            <p className="text-amber-200/70 text-xs">Current daily streak</p>
          </div>

          <div className="rounded-xl border border-brand-400/20 bg-brand-500/10 p-4">
            <div className="flex items-center gap-2 text-brand-300 text-xs uppercase tracking-wide"><Trophy size={14} /> XP</div>
            <p className="text-2xl font-bold mt-2">{data.stats.xp}</p>
            <p className="text-brand-200/70 text-xs">Total experience points</p>
          </div>

          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-2 text-emerald-300 text-xs uppercase tracking-wide"><Award size={14} /> Badges</div>
            <p className="text-2xl font-bold mt-2">{data.stats.badges.length}</p>
            <p className="text-emerald-200/70 text-xs">Earned achievements</p>
          </div>

          <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-4">
            <div className="flex items-center gap-2 text-violet-300 text-xs uppercase tracking-wide"><BookOpen size={14} /> Assignments</div>
            <p className="text-2xl font-bold mt-2">{data.assignments.length}</p>
            <p className="text-violet-200/70 text-xs">Pending in your batch</p>
          </div>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-white font-bold">Progress to Next Milestone</h2>
            <span className="text-xs text-white/50">{progressToNextMilestone}%</span>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-saffron-500 transition-all duration-700"
              style={{ width: `${progressToNextMilestone}%` }}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold">Learning Path</h2>
            <button
              onClick={() => setShowFullRoadmap((prev) => !prev)}
              className="px-3 py-1.5 text-xs rounded-md border border-brand-400/30 bg-brand-500/15 text-brand-200 hover:bg-brand-500/25"
            >
              {showFullRoadmap ? 'Hide Full Roadmap' : 'View Full Roadmap'}
            </button>
          </div>
          <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-4">
            <p className="text-violet-200 text-xs uppercase tracking-wide font-semibold">Current Week</p>
            <p className="text-white/90 text-sm mt-2 font-semibold">{currentWeekText}</p>
          </div>

          {showFullRoadmap ? (
            <pre className="mt-3 text-xs text-white/80 whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-slate-900/70 p-3">
              {JSON.stringify(data.roadmap, null, 2)}
            </pre>
          ) : null}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-white font-bold mb-3">Assignments</h2>
          {!data.assignments.length ? (
            <p className="text-white/60 text-sm">No assignments pending in your batch.</p>
          ) : (
            <div className="space-y-3">
              {data.assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-white font-semibold text-sm">{assignment.title}</p>
                    <p className="text-white/60 text-xs mt-1">{assignment.description || 'No description provided.'}</p>
                    <p className="text-white/40 text-xs mt-1">Due: {new Date(assignment.due_date).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => openAttemptModal(assignment)}
                    className="px-3 py-2 rounded-md bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-sm font-semibold hover:bg-emerald-500/25"
                  >
                    Attempt
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16} className="text-amber-300" />
            <h2 className="text-white font-bold">Alerts</h2>
          </div>
          {!data.notifications.length ? (
            <p className="text-white/60 text-sm">No active mentor alerts.</p>
          ) : (
            <div className="space-y-2">
              {data.notifications.map((notice) => (
                <div key={notice.id} className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-3">
                  <p className="text-amber-100 text-sm">{notice.alert_text}</p>
                  <p className="text-amber-200/70 text-xs mt-1">{new Date(notice.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {attemptModal.open && attemptModal.assignment ? (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold">Attempt Assignment</h3>
                <p className="text-white/60 text-xs mt-1">{attemptModal.assignment.title}</p>
              </div>
              <button onClick={closeAttemptModal} className="text-white/60 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <textarea
                rows={8}
                value={attemptModal.responseText}
                onChange={(event) => setAttemptModal((prev) => ({ ...prev, responseText: event.target.value }))}
                placeholder="Write your answer here..."
                className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-white"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={closeAttemptModal}
                  className="px-3 py-2 rounded-md bg-white/10 text-white/80 hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAttempt}
                  disabled={attemptModal.submitting}
                  className="px-3 py-2 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-sm font-semibold hover:bg-emerald-500/30 disabled:opacity-50"
                >
                  {attemptModal.submitting ? 'Submitting...' : 'Submit Attempt'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StudentDashboard;
