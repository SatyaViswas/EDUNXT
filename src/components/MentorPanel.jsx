import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import DNAChart from './DNAChart';

function getToken() {
  return localStorage.getItem('access_token') || localStorage.getItem('sahaayak_token') || '';
}

export default function MentorPanel() {
  const [activeTab, setActiveTab] = useState('students');
  const [groupedStudents, setGroupedStudents] = useState({});
  const [stats, setStats] = useState({
    total_students: 0,
    active_batches: 0,
    open_issues: 0,
    pending_assignments: 0,
  });
  const [collapsed, setCollapsed] = useState({});
  const [roadmapPanels, setRoadmapPanels] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingBatch, setGeneratingBatch] = useState('');
  const [submittingForStudent, setSubmittingForStudent] = useState('');
  const [creatingAssignment, setCreatingAssignment] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    batch_name: '',
    title: '',
    description: '',
    due_date: '',
  });
  const [issueModal, setIssueModal] = useState({
    isOpen: false,
    student: null,
    category: 'Performance',
    description: '',
  });

  const applyDefaultStats = (incoming) => ({
    total_students: incoming?.total_students ?? 0,
    active_batches: incoming?.active_batches ?? 0,
    open_issues: incoming?.unresolved_issues ?? incoming?.open_issues ?? 0,
    pending_assignments: incoming?.pending_assignments ?? 0,
  });

  const fetchStats = async () => {
    const statsRes = await api.get('/mentor/stats');
    return applyDefaultStats(statsRes.data);
  };

  const fetchStudents = async () => {
    const studentsRes = await api.get('/mentor/students');
    console.log('Mentor /mentor/students response:', studentsRes.data);

    // API contract: { "Batch A": [students], "Batch B": [students] }
    if (studentsRes?.data && typeof studentsRes.data === 'object' && !Array.isArray(studentsRes.data)) {
      return studentsRes.data;
    }

    return {};
  };

  const fetchMentorBatches = async () => {
    const batchesRes = await api.get('/mentor/batches');
    return batchesRes.data || [];
  };

  const refreshDashboardData = async (setLoadingState = false) => {
    if (setLoadingState) {
      setLoading(true);
    }

    const [statsData, studentsData, batchesData] = await Promise.all([
      fetchStats(),
      fetchStudents(),
      fetchMentorBatches(),
    ]);

    setStats(statsData);
    setGroupedStudents(studentsData || {});

    const batchNames = Object.keys(studentsData || {});
    setCollapsed((prev) => {
      const next = {};
      batchNames.forEach((name) => {
        next[name] = prev[name] ?? false;
      });
      return next;
    });

    setRoadmapPanels((prev) => {
      const next = {};
      batchNames.forEach((name) => {
        next[name] = prev[name] || { open: false, loading: false, data: null, error: '' };
      });

      batchesData.forEach((batch) => {
        const name = batch.batch_name;
        if (!name) return;

        next[name] = {
          ...(next[name] || { open: false, loading: false, data: null, error: '' }),
          data: batch.roadmap
            ? {
                batch_name: name,
                student_count: batch.student_count ?? (studentsData?.[name]?.length || 0),
                common_grade: null,
                avg_dna: null,
                roadmap: batch.roadmap,
              }
            : next[name]?.data || null,
        };
      });

      return next;
    });

    if (!assignmentForm.batch_name && batchNames.length > 0) {
      setAssignmentForm((prev) => ({ ...prev, batch_name: batchNames[0] }));
    }

    if (setLoadingState) {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      const token = getToken();
      if (!token) {
        if (active) {
          setError('Missing auth token. Please sign in as a mentor.');
          setLoading(false);
        }
        return;
      }

      try {
        setError('');
        if (active) {
          await refreshDashboardData(true);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load students.');
          setGroupedStudents({});
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();
    const intervalId = setInterval(loadData, 30000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  const batchEntries = useMemo(() => Object.entries(groupedStudents), [groupedStudents]);

  const getBatchAverages = (students) => {
    if (!students?.length) return null;

    const keys = ['logical', 'verbal', 'creative', 'visual_spatial', 'memory', 'pattern'];
    const sums = { logical: 0, verbal: 0, creative: 0, visual_spatial: 0, memory: 0, pattern: 0 };

    students.forEach((student) => {
      const dna = student.learning_dna || {};
      keys.forEach((key) => {
        sums[key] += Number(dna[key] ?? 50);
      });
    });

    return keys.reduce((acc, key) => {
      acc[key] = Math.round((sums[key] / students.length) * 10) / 10;
      return acc;
    }, {});
  };

  const toggleBatchRoadmap = async (batchName) => {
    if (!getToken()) {
      setError('Missing auth token. Please sign in as a mentor.');
      return;
    }

    const current = roadmapPanels[batchName] || { open: false, loading: false, data: null, error: '' };
    if (current.data) {
      setRoadmapPanels((prev) => ({
        ...prev,
        [batchName]: {
          ...current,
          open: !current.open,
        },
      }));
      return;
    }

    try {
      setGeneratingBatch(batchName);
      setRoadmapPanels((prev) => ({
        ...prev,
        [batchName]: {
          ...(prev[batchName] || {}),
          open: true,
          loading: true,
          error: '',
        },
      }));

      const res = await api.post('/mentor/generate-batch-path', { batch_name: batchName });
      const data = res.data;
      setRoadmapPanels((prev) => ({
        ...prev,
        [batchName]: {
          open: true,
          loading: false,
          data,
          error: '',
        },
      }));

      const latestStats = await fetchStats();
      setStats(latestStats);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate batch roadmap.';
      setError(message);
      setRoadmapPanels((prev) => ({
        ...prev,
        [batchName]: {
          ...(prev[batchName] || {}),
          open: true,
          loading: false,
          error: message,
        },
      }));
    } finally {
      setGeneratingBatch('');
    }
  };

  const createAssignment = async (event) => {
    event.preventDefault();
    if (!getToken()) {
      setError('Missing auth token. Please sign in as a mentor.');
      return;
    }

    if (!assignmentForm.batch_name || !assignmentForm.title || !assignmentForm.due_date) {
      setError('Please fill batch, title, and due date.');
      return;
    }

    try {
      setCreatingAssignment(true);
      setError('');
      await api.post('/mentor/assignments', {
        batch_name: assignmentForm.batch_name,
        title: assignmentForm.title,
        description: assignmentForm.description,
        due_date: new Date(assignmentForm.due_date).toISOString(),
      });

      const latestStats = await fetchStats();
      setStats(latestStats);
      setAssignmentForm((prev) => ({
        ...prev,
        title: '',
        description: '',
        due_date: '',
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment.');
    } finally {
      setCreatingAssignment(false);
    }
  };

  const submitIssue = async (event) => {
    event.preventDefault();
    if (!getToken()) {
      setError('Missing auth token. Please sign in as a mentor.');
      return;
    }

    if (!issueModal.student) {
      return;
    }

    if (!issueModal.category || !issueModal.description) {
      setError('Please provide category and description for the issue.');
      return;
    }

    try {
      setSubmittingForStudent(issueModal.student.student_id);
      setError('');
      await api.post('/mentor/raise-issue', {
        student_id: issueModal.student.student_id,
        category: issueModal.category,
        description: issueModal.description,
        severity: 'Medium',
      });

      await refreshDashboardData();
      setIssueModal({
        isOpen: false,
        student: null,
        category: 'Performance',
        description: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to raise issue.');
    } finally {
      setSubmittingForStudent('');
    }
  };

  const updateStudentMastery = async (student) => {
    if (!getToken()) {
      setError('Missing auth token. Please sign in as a mentor.');
      return;
    }

    const raw = window.prompt(`Update mastery level for ${student.name} (0-100)`, String(student.mastery_level ?? 0));
    if (raw === null) return;
    const masteryLevel = Number(raw);
    if (!Number.isFinite(masteryLevel) || masteryLevel < 0 || masteryLevel > 100) {
      setError('Mastery level must be a number between 0 and 100.');
      return;
    }

    try {
      setError('');
      await api.patch(`/mentor/student/${student.student_id}/progress`, {
        mastery_level: masteryLevel,
      });
      await refreshDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update student progress.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-white/70 flex items-center gap-3">
        <span className="inline-block h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        <span>Loading live mentor data...</span>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-300">{error}</div>;
  }

  if (!batchEntries.length) {
    return <div className="p-6 text-white/70">No students found.</div>;
  }

  return (
    <>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border ${activeTab === 'students' ? 'bg-brand-500/20 text-brand-200 border-brand-400/30' : 'bg-white/5 text-white/70 border-white/10'}`}
        >
          Student Progress
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border ${activeTab === 'assignments' ? 'bg-brand-500/20 text-brand-200 border-brand-400/30' : 'bg-white/5 text-white/70 border-white/10'}`}
        >
          Assignments
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60 uppercase tracking-wide">Total Students</p>
          <p className="mt-2 text-2xl font-bold text-white">{stats.total_students}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60 uppercase tracking-wide">Active Batches</p>
          <p className="mt-2 text-2xl font-bold text-white">{stats.active_batches}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60 uppercase tracking-wide">Open Issues</p>
          <p className="mt-2 text-2xl font-bold text-amber-300">{stats.open_issues}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60 uppercase tracking-wide">Pending Assignments</p>
          <p className="mt-2 text-2xl font-bold text-brand-300">{stats.pending_assignments}</p>
        </div>
      </div>

      {activeTab === 'assignments' ? (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-white text-lg font-bold">Post Assignment</h3>
          <p className="text-sm text-white/60 mt-1">Create assignments for a selected batch with a due date.</p>

          <form onSubmit={createAssignment} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs text-white/60 uppercase tracking-wide">Batch</span>
              <select
                value={assignmentForm.batch_name}
                onChange={(event) => setAssignmentForm((prev) => ({ ...prev, batch_name: event.target.value }))}
                className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-white"
              >
                <option value="">Select batch</option>
                {batchEntries.map(([batchName]) => (
                  <option key={batchName} value={batchName}>{batchName}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-white/60 uppercase tracking-wide">Due Date</span>
              <input
                type="datetime-local"
                value={assignmentForm.due_date}
                onChange={(event) => setAssignmentForm((prev) => ({ ...prev, due_date: event.target.value }))}
                className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-white"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-xs text-white/60 uppercase tracking-wide">Title</span>
              <input
                type="text"
                value={assignmentForm.title}
                onChange={(event) => setAssignmentForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Example: Algebra Practice Set 3"
                className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-white"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-xs text-white/60 uppercase tracking-wide">Description</span>
              <textarea
                rows={4}
                value={assignmentForm.description}
                onChange={(event) => setAssignmentForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Describe instructions, resources, and expected outcomes"
                className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-white"
              />
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={creatingAssignment}
                className="px-4 py-2 rounded-lg bg-brand-500/20 border border-brand-400/30 text-brand-200 text-sm font-semibold hover:bg-brand-500/30 disabled:opacity-50"
              >
                {creatingAssignment ? 'Posting Assignment...' : 'Post Assignment'}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedStudents).map(([batchName, students]) => {
          const avg = getBatchAverages(students);
          const displayBatch = batchName || 'Unassigned';
          const isCollapsed = Boolean(collapsed[displayBatch]);
          const roadmapState = roadmapPanels[displayBatch] || { open: false, loading: false, data: null, error: '' };

          return (
            <section
              key={displayBatch}
              className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
            >
              <header className="sticky top-0 z-20 px-5 py-4 border-b border-white/10 bg-slate-950/95 backdrop-blur-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <button
                      onClick={() =>
                        setCollapsed((prev) => ({
                          ...prev,
                          [displayBatch]: !prev[displayBatch],
                        }))
                      }
                      className="text-white font-bold hover:text-brand-300"
                    >
                      {isCollapsed ? '▸' : '▾'} Section: {displayBatch}
                    </button>
                    <p className="text-xs text-white/60 mt-1">
                      {students.length} students
                      {avg
                        ? ` • Avg DNA: L ${avg.logical}, V ${avg.verbal}, C ${avg.creative}, VS ${avg.visual_spatial}, M ${avg.memory}, P ${avg.pattern}`
                        : ''}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleBatchRoadmap(displayBatch)}
                    disabled={generatingBatch === displayBatch}
                    className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-200 border border-amber-400/30 hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                  >
                    {generatingBatch === displayBatch ? 'Loading...' : roadmapState.data ? (roadmapState.open ? 'Hide Batch Roadmap' : 'Show Batch Roadmap') : 'Generate Batch Roadmap'}
                  </button>
                </div>
              </header>

              {roadmapState.open ? (
                <div className="px-5 py-4 border-b border-white/10 bg-white/[0.02]">
                  {roadmapState.loading ? (
                    <p className="text-sm text-white/70">Building roadmap...</p>
                  ) : roadmapState.error ? (
                    <p className="text-sm text-red-300">{roadmapState.error}</p>
                  ) : roadmapState.data ? (
                    <div className="space-y-3">
                      <p className="text-xs text-white/60">
                        Grade {roadmapState.data.common_grade} • {roadmapState.data.student_count} students
                      </p>
                      <pre className="text-sm text-white/80 whitespace-pre-wrap break-words font-sans rounded-lg bg-slate-900/60 border border-white/10 p-3">
                        {JSON.stringify(roadmapState.data.roadmap, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {!isCollapsed ? <div className="overflow-x-auto">
                {!students.length ? (
                  <div className="px-5 py-6 text-sm text-white/70">No students assigned to this batch yet.</div>
                ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-white/60 border-b border-white/10">
                      <th className="px-5 py-3 font-semibold">Name</th>
                      <th className="px-5 py-3 font-semibold">Email</th>
                      <th className="px-5 py-3 font-semibold">Standard</th>
                      <th className="px-5 py-3 font-semibold">Learning DNA</th>
                      <th className="px-5 py-3 font-semibold">Mastery</th>
                      <th className="px-5 py-3 font-semibold">Risk</th>
                      <th className="px-5 py-3 font-semibold">Current Streak</th>
                      <th className="px-5 py-3 font-semibold">Latest Issue</th>
                      <th className="px-5 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.student_id} className="border-b border-white/5 last:border-b-0">
                        <td className="px-5 py-3 text-white/90">{student.name}</td>
                        <td className="px-5 py-3 text-white/70">{student.email}</td>
                        <td className="px-5 py-3 text-white/80">{student.standard}</td>
                        <td className="px-5 py-3">
                          <div className="w-36">
                            <DNAChart
                              size="sm"
                              showLabels={false}
                              scores={{
                                logical: Number(student.learning_dna?.logical ?? 50),
                                verbal: Number(student.learning_dna?.verbal ?? 50),
                                creative: Number(student.learning_dna?.creative ?? 50),
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-5 py-3 text-white/80 min-w-[180px]">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full bg-emerald-400 transition-all duration-500"
                                style={{ width: `${Math.max(0, Math.min(100, Number(student.mastery_level ?? 0)))}%` }}
                              />
                            </div>
                            <span className="text-xs text-white/70 w-10 text-right">{Math.round(Number(student.mastery_level ?? 0))}%</span>
                            <button
                              onClick={() => updateStudentMastery(student)}
                              className="px-2 py-1 rounded-md border border-white/20 text-white/70 hover:text-white hover:border-white/40"
                              title="Update mastery level"
                            >
                              ✎
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {student.is_at_risk ? (
                            <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-red-500/20 border border-red-400/30 text-red-200">
                              At Risk
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 border border-emerald-400/30 text-emerald-200">
                              Stable
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-white/80">{student.current_streak}</td>
                        <td className="px-5 py-3 text-white/80">
                          {student.latest_issue_status ? `${student.latest_issue_status} (${student.latest_issue_category || 'General'})` : 'No issues'}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                setActiveTab('assignments');
                                setAssignmentForm((prev) => ({ ...prev, batch_name: displayBatch }));
                              }}
                              className="px-3 py-1.5 rounded-md bg-brand-500/20 border border-brand-400/30 text-brand-200 text-xs font-semibold hover:bg-brand-500/30"
                            >
                              Give Assignment
                            </button>
                            <button
                              onClick={() => setIssueModal({
                                isOpen: true,
                                student,
                                category: 'Performance',
                                description: '',
                              })}
                              disabled={submittingForStudent === student.student_id}
                              className="px-3 py-1.5 rounded-md bg-red-500/20 border border-red-400/30 text-red-200 text-xs font-semibold hover:bg-red-500/30 disabled:opacity-50"
                            >
                              {submittingForStudent === student.student_id ? 'Submitting...' : 'Raise Issue'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                )}
              </div> : null}
            </section>
          );
        })}
        </div>
      )}

      {issueModal.isOpen && issueModal.student ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <h3 className="text-white text-lg font-bold">Raise Issue: {issueModal.student.name}</h3>
              <p className="text-xs text-white/60 mt-1">Flag concern for mentor follow-up and resolution tracking.</p>
            </div>
            <form onSubmit={submitIssue} className="p-5 space-y-4">
              <label className="block">
                <span className="text-xs text-white/60 uppercase tracking-wide">Category</span>
                <select
                  value={issueModal.category}
                  onChange={(event) => setIssueModal((prev) => ({ ...prev, category: event.target.value }))}
                  className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-white"
                >
                  <option value="Performance">Performance</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Engagement">Engagement</option>
                  <option value="Behavior">Behavior</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs text-white/60 uppercase tracking-wide">Description</span>
                <textarea
                  rows={4}
                  value={issueModal.description}
                  onChange={(event) => setIssueModal((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Describe what happened and what support is needed"
                  className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-white"
                />
              </label>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIssueModal({ isOpen: false, student: null, category: 'Performance', description: '' })}
                  className="px-3 py-2 rounded-md bg-white/10 text-white/80 hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingForStudent === issueModal.student.student_id}
                  className="px-3 py-2 rounded-md bg-red-500/20 border border-red-400/30 text-red-200 text-sm font-semibold hover:bg-red-500/30 disabled:opacity-50"
                >
                  {submittingForStudent === issueModal.student.student_id ? 'Submitting...' : 'Submit Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
