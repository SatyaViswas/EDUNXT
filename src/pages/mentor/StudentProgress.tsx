import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarCheck2, Dna, Flag, Layers, PlusCircle, X, Eye } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface StudentItem {
  student_id: string;
  batch_name: string;
  name: string;
  email: string;
  standard: number;
  current_streak: number;
  attendance_rate: number;
  learning_dna: {
    logical: number;
    verbal: number;
    creative: number;
    visual_spatial: number;
    memory: number;
    pattern: number;
  };
}

interface AssignmentForm {
  title: string;
  description: string;
  due_date: string;
}

interface IssueModalState {
  open: boolean;
  studentId: string;
  studentName: string;
  category: string;
  description: string;
}

interface DnaModalState {
  open: boolean;
  studentName: string;
  dna: StudentItem['learning_dna'] | null;
}

const EMPTY_ASSIGNMENT: AssignmentForm = {
  title: '',
  description: '',
  due_date: '',
};

export const StudentProgress: React.FC = () => {
  const [groupedStudents, setGroupedStudents] = useState<Record<string, StudentItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [expandedAssignmentBatch, setExpandedAssignmentBatch] = useState<string>('');
  const [assignmentForms, setAssignmentForms] = useState<Record<string, AssignmentForm>>({});
  const [postingBatch, setPostingBatch] = useState('');
  const [attendanceUpdatingStudent, setAttendanceUpdatingStudent] = useState('');
  const [attendanceActionStudent, setAttendanceActionStudent] = useState('');
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [issueModal, setIssueModal] = useState<IssueModalState>({
    open: false,
    studentId: '',
    studentName: '',
    category: 'Performance',
    description: '',
  });
  const [dnaModal, setDnaModal] = useState<DnaModalState>({
    open: false,
    studentName: '',
    dna: null,
  });

  const AttendanceRing = ({ value }: { value: number }) => {
    const safe = Math.max(0, Math.min(100, Number(value || 0)));
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (safe / 100) * circumference;

    return (
      <div className="relative h-12 w-12">
        <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r={radius} stroke="rgba(255,255,255,0.15)" strokeWidth="5" fill="none" />
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke={safe < 75 ? '#f87171' : '#34d399'}
            strokeWidth="5"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-[10px] font-bold text-white/90">{Math.round(safe)}%</span>
      </div>
    );
  };

  const loadStudents = async (withLoading = false) => {
    try {
      if (withLoading) {
        setLoading(true);
      }
      setError('');
      const data = await apiRequest<Record<string, StudentItem[]>>('/mentor/students', {}, true);
      setGroupedStudents(data || {});

      const batchNames = Object.keys(data || {});
      setCollapsed((prev) => {
        const next: Record<string, boolean> = {};
        batchNames.forEach((batch) => {
          next[batch] = prev[batch] ?? false;
        });
        return next;
      });

      setAssignmentForms((prev) => {
        const next = { ...prev };
        batchNames.forEach((batch) => {
          if (!next[batch]) {
            next[batch] = { ...EMPTY_ASSIGNMENT };
          }
        });
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load student progress.');
    } finally {
      if (withLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadStudents(true);
  }, []);

  const batchEntries = useMemo(() => Object.entries(groupedStudents), [groupedStudents]);

  const setToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const updateAttendance = async (studentId: string, present: boolean) => {
    try {
      setAttendanceUpdatingStudent(studentId);
      await apiRequest('/mentor/attendance', {
        method: 'POST',
        body: JSON.stringify({ student_id: studentId, present }),
      }, true);
      await loadStudents();
      setToast(`Attendance marked as ${present ? 'Present' : 'Absent'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update attendance.');
    } finally {
      setAttendanceUpdatingStudent('');
    }
  };

  const postAssignmentForBatch = async (batchName: string) => {
    const form = assignmentForms[batchName] || EMPTY_ASSIGNMENT;
    if (!form.title || !form.due_date) {
      setError('Assignment title and due date are required.');
      return;
    }

    try {
      setPostingBatch(batchName);
      await apiRequest('/mentor/assignments', {
        method: 'POST',
        body: JSON.stringify({
          batch_name: batchName,
          title: form.title,
          description: form.description,
          due_date: new Date(form.due_date).toISOString(),
        }),
      }, true);

      setAssignmentForms((prev) => ({
        ...prev,
        [batchName]: { ...EMPTY_ASSIGNMENT },
      }));
      setExpandedAssignmentBatch('');
      setToast(`Assignment posted to ${batchName}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post assignment.');
    } finally {
      setPostingBatch('');
    }
  };

  const submitIssue = async () => {
    if (!issueModal.studentId || !issueModal.category || !issueModal.description) {
      setError('Please fill issue category and description.');
      return;
    }

    try {
      setIssueSubmitting(true);
      await apiRequest('/mentor/raise-issue', {
        method: 'POST',
        body: JSON.stringify({
          student_id: issueModal.studentId,
          category: issueModal.category,
          description: issueModal.description,
          severity: 'Medium',
        }),
      }, true);

      setIssueModal({
        open: false,
        studentId: '',
        studentName: '',
        category: 'Performance',
        description: '',
      });
      setToast('Issue raised successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to raise issue.');
    } finally {
      setIssueSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 text-white flex items-center justify-center">
        <div className="glass-card p-8 flex items-center gap-3">
          <span className="inline-block h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          <span>Loading batch progress...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 text-white relative">
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      <AnimatePresence>
        {toastMessage ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-slate-900 border border-emerald-500/30 shadow-xl"
          >
            <p className="text-sm text-white/90">{toastMessage}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Layers size={18} className="text-emerald-400" />
            <span className="text-white/50 uppercase tracking-widest text-xs font-bold">Mentor Progress Center</span>
          </div>
          <h1 className="text-3xl font-extrabold">Student Progress</h1>
          <p className="text-white/50 mt-1">Batch-wise learner tracking with attendance, DNA insights, assignment posting, and issue logging.</p>
          {error ? <p className="text-red-300 text-sm mt-3">{error}</p> : null}
        </div>

        <div className="space-y-6">
          {batchEntries.map(([batchName, students]) => {
            const isCollapsed = Boolean(collapsed[batchName]);
            const assignmentForm = assignmentForms[batchName] || EMPTY_ASSIGNMENT;

            return (
              <section key={batchName} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <header className="p-4 sm:p-5 border-b border-white/10 bg-slate-950/80">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <button
                      onClick={() => setCollapsed((prev) => ({ ...prev, [batchName]: !prev[batchName] }))}
                      className="text-left"
                    >
                      <p className="text-white font-bold text-lg">{isCollapsed ? '▸' : '▾'} {batchName}</p>
                      <p className="text-xs text-white/60 mt-1">{students.length} students</p>
                    </button>

                    <button
                      onClick={() => setExpandedAssignmentBatch((prev) => (prev === batchName ? '' : batchName))}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-400/30 bg-brand-500/15 text-brand-200 text-sm font-semibold"
                    >
                      <PlusCircle size={15} />
                      Post Assignment
                    </button>
                  </div>

                  {expandedAssignmentBatch === batchName ? (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Assignment title"
                        value={assignmentForm.title}
                        onChange={(event) =>
                          setAssignmentForms((prev) => ({
                            ...prev,
                            [batchName]: { ...assignmentForm, title: event.target.value },
                          }))
                        }
                        className="rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-white text-sm"
                      />
                      <input
                        type="datetime-local"
                        value={assignmentForm.due_date}
                        onChange={(event) =>
                          setAssignmentForms((prev) => ({
                            ...prev,
                            [batchName]: { ...assignmentForm, due_date: event.target.value },
                          }))
                        }
                        className="rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-white text-sm"
                      />
                      <button
                        onClick={() => void postAssignmentForBatch(batchName)}
                        disabled={postingBatch === batchName}
                        className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 text-emerald-200 text-sm font-semibold px-3 py-2 disabled:opacity-50"
                      >
                        {postingBatch === batchName ? 'Posting...' : 'Send to Batch'}
                      </button>
                      <textarea
                        rows={2}
                        placeholder="Assignment description"
                        value={assignmentForm.description}
                        onChange={(event) =>
                          setAssignmentForms((prev) => ({
                            ...prev,
                            [batchName]: { ...assignmentForm, description: event.target.value },
                          }))
                        }
                        className="md:col-span-3 rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-white text-sm"
                      />
                    </div>
                  ) : null}
                </header>

                {!isCollapsed ? (
                  <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {students.map((student) => {
                      const dna = student.learning_dna || {
                        logical: 0,
                        verbal: 0,
                        creative: 0,
                        visual_spatial: 0,
                        memory: 0,
                        pattern: 0,
                      };

                      return (
                        <div
                          key={student.student_id}
                          className={`rounded-xl border bg-slate-900/60 p-4 ${Number(student.attendance_rate || 0) < 75 ? 'border-red-400/40 bg-red-500/[0.05]' : 'border-white/10'}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-white font-semibold">{student.name}</p>
                              <p className="text-xs text-white/60">Grade {student.standard} • {student.email}</p>
                            </div>
                            <AttendanceRing value={student.attendance_rate} />
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <button
                              onClick={() =>
                                setAttendanceActionStudent((prev) => (prev === student.student_id ? '' : student.student_id))
                              }
                              className="text-xs px-3 py-1.5 rounded border border-emerald-500/30 bg-emerald-500/15 text-emerald-200 inline-flex items-center gap-1"
                            >
                              <CalendarCheck2 size={12} /> Attendance
                            </button>
                            <button
                              onClick={() =>
                                setIssueModal({
                                  open: true,
                                  studentId: student.student_id,
                                  studentName: student.name,
                                  category: 'Performance',
                                  description: '',
                                })
                              }
                              className="text-xs px-3 py-1.5 rounded border border-amber-500/30 bg-amber-500/15 text-amber-200 inline-flex items-center gap-1"
                            >
                              <Flag size={12} /> Issue
                            </button>
                            <button
                              onClick={() => setDnaModal({ open: true, studentName: student.name, dna })}
                              className="text-xs px-3 py-1.5 rounded border border-brand-400/30 bg-brand-500/15 text-brand-200 inline-flex items-center gap-1"
                            >
                              <Eye size={12} /> DNA
                            </button>
                          </div>

                          {attendanceActionStudent === student.student_id ? (
                            <div className="mt-3 flex items-center gap-2">
                              <button
                                onClick={() => void updateAttendance(student.student_id, true)}
                                disabled={attendanceUpdatingStudent === student.student_id}
                                className="text-xs px-3 py-1.5 rounded border border-emerald-500/30 bg-emerald-500/15 text-emerald-200 disabled:opacity-50"
                              >
                                Present
                              </button>
                              <button
                                onClick={() => void updateAttendance(student.student_id, false)}
                                disabled={attendanceUpdatingStudent === student.student_id}
                                className="text-xs px-3 py-1.5 rounded border border-red-500/30 bg-red-500/15 text-red-200 disabled:opacity-50"
                              >
                                Absent
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {issueModal.open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center"
            onClick={() => setIssueModal((prev) => ({ ...prev, open: false }))}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-5"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">Raise Issue for {issueModal.studentName}</h3>
                <button
                  onClick={() => setIssueModal((prev) => ({ ...prev, open: false }))}
                  className="text-white/60 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={issueModal.category}
                  onChange={(event) => setIssueModal((prev) => ({ ...prev, category: event.target.value }))}
                  placeholder="Issue category"
                  className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white text-sm"
                />
                <textarea
                  rows={4}
                  value={issueModal.description}
                  onChange={(event) => setIssueModal((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Describe the concern"
                  className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white text-sm"
                />
                <button
                  onClick={() => void submitIssue()}
                  disabled={issueSubmitting}
                  className="w-full rounded-lg border border-amber-500/30 bg-amber-500/15 text-amber-200 text-sm font-semibold px-3 py-2 disabled:opacity-50"
                >
                  {issueSubmitting ? 'Submitting...' : 'Log Complaint'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {dnaModal.open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center"
            onClick={() => setDnaModal({ open: false, studentName: '', dna: null })}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-5"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2"><Dna size={16} className="text-brand-300" /> {dnaModal.studentName} • DNA Breakdown</h3>
                <button
                  onClick={() => setDnaModal({ open: false, studentName: '', dna: null })}
                  className="text-white/60 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {dnaModal.dna ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">Logical: <span className="text-brand-200 font-semibold">{dnaModal.dna.logical}</span></div>
                  <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">Verbal: <span className="text-brand-200 font-semibold">{dnaModal.dna.verbal}</span></div>
                  <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">Creative: <span className="text-brand-200 font-semibold">{dnaModal.dna.creative}</span></div>
                  <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">Visual Spatial: <span className="text-brand-200 font-semibold">{dnaModal.dna.visual_spatial}</span></div>
                  <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">Memory: <span className="text-brand-200 font-semibold">{dnaModal.dna.memory}</span></div>
                  <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">Pattern: <span className="text-brand-200 font-semibold">{dnaModal.dna.pattern}</span></div>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default StudentProgress;
