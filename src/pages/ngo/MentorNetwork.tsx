import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import {
  ShieldCheck, Shield, Search, CheckCircle2, XCircle,
  Users, AlertCircle, Clock
} from 'lucide-react';

type MentorStatus = 'verified' | 'pending' | 'rejected';

interface Mentor {
  id: string;
  name: string;
  email: string;
  subject: string[];
  status: MentorStatus;
  mis: number | null; // Mentor Impact Score
  batches: number;
  students: number;
  joinedDate: string;
}

const MOCK_MENTORS: Mentor[] = [
  { id: '1', name: 'Priya Iyer', email: 'priya.iyer@ngo.in', subject: ['Mathematics', 'Physics'], status: 'verified', mis: 91, batches: 3, students: 35, joinedDate: 'Jun 2024' },
  { id: '2', name: 'Arjun Nair', email: 'arjun.nair@ngo.in', subject: ['Mathematics'], status: 'verified', mis: 78, batches: 2, students: 20, joinedDate: 'Jul 2024' },
  { id: '3', name: 'Deepa Rao', email: 'deepa.rao@ngo.in', subject: ['Science', 'Biology'], status: 'verified', mis: 85, batches: 3, students: 28, joinedDate: 'Aug 2024' },
  { id: '4', name: 'Rohit Sharma', email: 'rohit.s@mentor.com', subject: ['Social Studies', 'English'], status: 'pending', mis: null, batches: 0, students: 0, joinedDate: 'Mar 2025' },
  { id: '5', name: 'Sunita Rao', email: 'sunita.r@apply.in', subject: ['Hindi', 'English'], status: 'pending', mis: null, batches: 0, students: 0, joinedDate: 'Mar 2025' },
  { id: '6', name: 'Vikram Patel', email: 'v.patel@edu.net', subject: ['Chemistry', 'Biology'], status: 'rejected', mis: null, batches: 0, students: 0, joinedDate: 'Feb 2025' },
];

const STATUS_CONFIG: Record<MentorStatus, { label: string; icon: React.ReactNode; className: string }> = {
  verified: { label: 'Verified', icon: <ShieldCheck size={13} />, className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  pending: { label: 'Pending Review', icon: <Clock size={13} />, className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  rejected: { label: 'Rejected', icon: <XCircle size={13} />, className: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const MisBar = ({ score }: { score: number }) => {
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden w-24">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
      <span className="font-black text-sm" style={{ color }}>{score}</span>
    </div>
  );
};

const ActionModal: React.FC<{
  mentor: Mentor;
  action: 'approve' | 'reject';
  onConfirm: () => void;
  onClose: () => void;
}> = ({ mentor, action, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
    >
      <div className={`p-6 ${action === 'approve' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
        <div className="flex items-center gap-3">
          {action === 'approve' ? <CheckCircle2 className="text-emerald-400" size={24} /> : <XCircle className="text-red-400" size={24} />}
          <h3 className="text-xl font-bold text-white capitalize">{action} Mentor</h3>
        </div>
        <p className="text-white/50 text-sm mt-2">Are you sure you want to <strong>{action}</strong> <strong className="text-white">{mentor.name}</strong>?</p>
      </div>
      <div className="p-6 flex gap-3">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold hover:bg-white/10 transition-colors">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-90
            ${action === 'approve'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
              : 'bg-gradient-to-r from-red-600 to-red-700 text-white'
            }`}
        >
          Confirm {action === 'approve' ? '✓' : '✕'}
        </button>
      </div>
    </motion.div>
  </div>
);

export const MentorNetwork: React.FC = () => {
  const { user } = useUser();
  const [mentors, setMentors] = useState(MOCK_MENTORS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<MentorStatus | 'all'>('all');
  const [pendingAction, setPendingAction] = useState<{ mentor: Mentor; action: 'approve' | 'reject' } | null>(null);

  const handleAction = () => {
    if (!pendingAction) return;
    const { mentor, action } = pendingAction;
    setMentors(prev => prev.map(m =>
      m.id === mentor.id
        ? { ...m, status: action === 'approve' ? 'verified' : 'rejected' }
        : m
    ));
    setPendingAction(null);
  };

  const filtered = mentors.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.subject.join().toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || m.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const pendingCount = mentors.filter(m => m.status === 'pending').length;

  return (
    <div className="min-h-screen p-8 text-white relative">
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={20} className="text-violet-400" />
            <span className="text-white/50 uppercase tracking-widest text-sm font-bold">Admin Control</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold pb-1">
                Mentor <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Network</span>
              </h1>
              <p className="text-white/40 mt-1">Manage mentor approvals, track expertise, and monitor impact scores.</p>
            </div>

            {pendingCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3"
              >
                <AlertCircle className="text-amber-400" size={20} />
                <div>
                  <p className="font-bold text-amber-300 text-sm">{pendingCount} Pending Review</p>
                  <p className="text-white/40 text-xs">Mentor applications awaiting approval</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input
              type="text"
              placeholder="Search by name or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'verified', 'pending', 'rejected'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all border
                  ${filterStatus === status ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 text-white/40 hover:text-white/70'}`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="p-4 font-bold text-white/40 text-xs uppercase tracking-wider">Mentor</th>
                  <th className="p-4 font-bold text-white/40 text-xs uppercase tracking-wider">Expertise</th>
                  <th className="p-4 font-bold text-white/40 text-xs uppercase tracking-wider">Status</th>
                  <th className="p-4 font-bold text-white/40 text-xs uppercase tracking-wider">Impact Score (MIS)</th>
                  <th className="p-4 font-bold text-white/40 text-xs uppercase tracking-wider text-center">Coverage</th>
                  <th className="p-4 font-bold text-white/40 text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence>
                  {filtered.map((mentor, i) => {
                    const statusCfg = STATUS_CONFIG[mentor.status];
                    return (
                      <motion.tr
                        key={mentor.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        {/* Name */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-xs shadow-lg flex-shrink-0
                              ${mentor.status === 'verified' ? 'from-violet-600 to-indigo-600' : mentor.status === 'pending' ? 'from-amber-600 to-orange-600' : 'from-slate-600 to-slate-700'}`}
                            >
                              {mentor.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-white/90">{mentor.name}</p>
                              <p className="text-white/30 text-xs">{mentor.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Expertise */}
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1.5">
                            {mentor.subject.map(s => (
                              <span key={s} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[11px] font-semibold text-white/70">
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <span className={`flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-full text-xs font-bold border ${statusCfg.className}`}>
                            {statusCfg.icon} {statusCfg.label}
                          </span>
                        </td>

                        {/* MIS */}
                        <td className="p-4">
                          {mentor.mis !== null
                            ? <MisBar score={mentor.mis} />
                            : <span className="text-white/20 text-xs italic">Not yet assigned</span>
                          }
                        </td>

                        {/* Coverage */}
                        <td className="p-4 text-center">
                          {mentor.status === 'verified' ? (
                            <div className="text-center">
                              <p className="font-bold text-white">{mentor.batches} <span className="text-xs text-white/30">batches</span></p>
                              <p className="text-white/40 text-xs">{mentor.students} students</p>
                            </div>
                          ) : (
                            <span className="text-white/20 text-xs">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            {mentor.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => setPendingAction({ mentor, action: 'approve' })}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
                                >
                                  <CheckCircle2 size={13} /> Approve
                                </button>
                                <button
                                  onClick={() => setPendingAction({ mentor, action: 'reject' })}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors"
                                >
                                  <XCircle size={13} /> Reject
                                </button>
                              </>
                            )}
                            {mentor.status === 'verified' && (
                              <span className="text-white/20 text-xs flex items-center gap-1"><CheckCircle2 size={13} className="text-emerald-500" /> Active</span>
                            )}
                            {mentor.status === 'rejected' && (
                              <span className="text-white/20 text-xs flex items-center gap-1"><XCircle size={13} className="text-red-500/50" /> Rejected</span>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center text-white/30">
              <Users size={40} className="mx-auto mb-3 opacity-20" />
              No mentors match your filter.
            </div>
          )}
        </motion.div>

        <p className="text-white/30 text-xs mt-4 text-right">
          Showing {filtered.length} of {mentors.length} mentors
        </p>
      </div>

      {/* Confirm Action Modal */}
      <AnimatePresence>
        {pendingAction && (
          <ActionModal
            mentor={pendingAction.mentor}
            action={pendingAction.action}
            onConfirm={handleAction}
            onClose={() => setPendingAction(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MentorNetwork;
