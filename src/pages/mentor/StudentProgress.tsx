import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { Search, Filter, ShieldCheck, TrendingUp, CheckCircle2, AlertCircle, Clock, Save, Dna } from 'lucide-react';

const MOCK_STUDENTS = [
  { id: '1', name: 'Rahul Sharma', std: 'Class 8', all: 42, role: 'Visual',
    topics: { 'Algebra Basics': 'needs_help', 'Geometry': 'learning', 'Fractions': 'mastered' } },
  { id: '2', name: 'Priya Patel', std: 'Class 8', all: 88, role: 'Logical',
    topics: { 'Algebra Basics': 'mastered', 'Geometry': 'mastered', 'Fractions': 'mastered' } },
  { id: '3', name: 'Arjun Singh', std: 'Class 8', all: 65, role: 'Creative',
    topics: { 'Algebra Basics': 'learning', 'Geometry': 'needs_help', 'Fractions': 'mastered' } },
  { id: '4', name: 'Diya Reddy', std: 'Class 8', all: 72, role: 'Verbal',
    topics: { 'Algebra Basics': 'mastered', 'Geometry': 'learning', 'Fractions': 'learning' } },
  { id: '5', name: 'Rohan Gupta', std: 'Class 8', all: 95, role: 'Logical',
    topics: { 'Algebra Basics': 'mastered', 'Geometry': 'mastered', 'Fractions': 'mastered' } },
];

const TOPICS = ['Algebra Basics', 'Geometry', 'Fractions'];

type MasteryState = 'mastered' | 'learning' | 'needs_help';

const MasteryToggle = ({ 
  initialState, 
  onSave 
}: { 
  initialState: string, 
  onSave: (state: MasteryState) => void 
}) => {
  const [state, setState] = useState<MasteryState>(initialState as MasteryState);
  
  const cycleState = () => {
    const next: Record<MasteryState, MasteryState> = {
      'mastered': 'learning',
      'learning': 'needs_help',
      'needs_help': 'mastered'
    };
    const newState = next[state];
    setState(newState);
    onSave(newState);
  };

  return (
    <button 
      onClick={cycleState}
      className={`
        px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider min-w-[110px] transition-all
        ${state === 'mastered' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30' : 
          state === 'learning' ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30' : 
          'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'}
      `}
    >
      <span className="flex items-center justify-center gap-1.5">
        {state === 'mastered' ? <CheckCircle2 size={12} /> : 
         state === 'learning' ? <Clock size={12} /> : 
         <AlertCircle size={12} />}
        {state.replace('_', ' ')}
      </span>
    </button>
  );
};

export const StudentProgress: React.FC = () => {
  const { user } = useUser();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleUpdate = (studentName: string, topic: string) => {
    setToastMessage(`Synced ${studentName}'s DNA for ${topic}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen p-8 text-white relative">
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl bg-slate-900 border border-emerald-500/30 flex items-center gap-3 shadow-2xl"
          >
            <Dna className="text-emerald-400 animate-spin-slow" size={20} />
            <span className="font-bold text-white/90">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={20} className="text-emerald-400" />
                <span className="text-white/50 uppercase tracking-widest text-sm font-bold">Mentor Operations</span>
              </div>
              <h1 className="text-4xl font-extrabold pb-2">
                Cohort <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Mastery Log</span>
              </h1>
              <p className="text-white/40">Real-time DNA syncing. Update topic mastery to trigger AI pathway adjustments.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input 
                  type="text" 
                  placeholder="Search students..." 
                  className="pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white">
                <Filter size={18} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* The Mastery Table */}
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
                  <th className="p-4 font-bold text-white/50 text-sm uppercase tracking-wider">Student</th>
                  <th className="p-4 font-bold text-white/50 text-sm uppercase tracking-wider w-32">ALL Score</th>
                  <th className="p-4 font-bold text-white/50 text-sm uppercase tracking-wider w-40">Primary Aptitude</th>
                  {TOPICS.map(topic => (
                    <th key={topic} className="p-4 font-bold text-white/50 text-[10px] uppercase tracking-wider text-center w-36">
                      {topic}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {MOCK_STUDENTS.map((student) => (
                  <tr key={student.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xs shadow-lg">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white/90">{student.name}</p>
                          <p className="text-white/30 text-xs">{student.std}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className={`flex items-center gap-1.5 font-bold ${student.all > 70 ? 'text-emerald-400' : student.all > 50 ? 'text-brand-400' : 'text-red-400'}`}>
                        {student.all} <TrendingUp size={14} className="opacity-50" />
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-semibold text-white/70">
                        {student.role}
                      </span>
                    </td>

                    {/* Topic Toggles */}
                    {TOPICS.map(topic => (
                      <td key={topic} className="p-4 text-center">
                        <MasteryToggle 
                          initialState={student.topics[topic as keyof typeof student.topics]} 
                          onSave={() => handleUpdate(student.name, topic)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <div className="mt-6 flex justify-between items-center text-xs text-white/40 font-medium">
          <p>Showing 5 students in <span className="text-emerald-400">Class 8 (Fast Track)</span></p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-400"/> Mastered: Advancing</span>
            <span className="flex items-center gap-1"><Clock size={12} className="text-amber-400"/> Learning: In Progress</span>
            <span className="flex items-center gap-1"><AlertCircle size={12} className="text-red-400"/> Needs Help: Requires Session</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProgress;
