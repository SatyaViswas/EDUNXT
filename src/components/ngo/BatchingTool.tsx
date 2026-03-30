import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, BookOpen, Star, CheckCircle2, ChevronRight, X, ArrowRight, ShieldCheck } from 'lucide-react';

interface Mentor {
  id: string;
  name: string;
  rating: number;
  subject: string;
}

interface Batch {
  id: string;
  name: string;
  subject: string;
  students: number;
}

const mockMentors: Mentor[] = [
  { id: 'm1', name: 'Rajesh V.', rating: 4.8, subject: 'Mathematics' },
  { id: 'm2', name: 'Priya K.', rating: 4.9, subject: 'Science' },
  { id: 'm3', name: 'Arun S.', rating: 4.5, subject: 'English' },
];

const mockBatches: Batch[] = [
  { id: 'b1', name: 'Class 6 - Foundation', subject: 'Mathematics', students: 15 },
  { id: 'b2', name: 'Class 9 - Weekend', subject: 'Science', students: 12 },
  { id: 'b3', name: 'Class 11 - MPC', subject: 'Mathematics', students: 8 },
];

const BatchingTool: React.FC = () => {
  const [mentors, setMentors] = useState<Mentor[]>(mockMentors);
  const [batches, setBatches] = useState<Batch[]>(mockBatches);
  
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [connections, setConnections] = useState<Array<{ mId: string; bId: string }>>([]);

  const isPaired = selectedMentor && selectedBatch;

  const handleConnect = () => {
    if (selectedMentor && selectedBatch) {
      setConnections(prev => [...prev, { mId: selectedMentor, bId: selectedBatch }]);
      
      // Remove from available lists after a short delay for animation
      setTimeout(() => {
        setMentors(prev => prev.filter(m => m.id !== selectedMentor));
        setBatches(prev => prev.filter(b => b.id !== selectedBatch));
        setSelectedMentor(null);
        setSelectedBatch(null);
      }, 1000);
    }
  };

  const handleUnselect = () => {
    setSelectedMentor(null);
    setSelectedBatch(null);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
      <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="text-brand-400" /> Smart Batching Engine
          </h3>
          <p className="text-white/40 text-sm mt-1">Select a verified mentor, then choose a cohort to generate an assignment.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 relative">
        {/* Connecting Animation Overlay */}
        <AnimatePresence>
          {isPaired && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center pt-24"
            >
              <div className="flex items-center gap-8 mb-6">
                <motion.div 
                  initial={{ x: -50, opacity: 0 }} 
                  animate={{ x: 0, opacity: 1 }}
                  className="w-20 h-20 rounded-2xl bg-brand-500/20 border border-brand-500 flex items-center justify-center text-4xl"
                >
                  🧑‍🏫
                </motion.div>
                
                <motion.div 
                  className="h-1 bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: 100 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                />

                <motion.div 
                  initial={{ x: 50, opacity: 0 }} 
                  animate={{ x: 0, opacity: 1 }}
                  className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-4xl"
                >
                  👥
                </motion.div>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={handleUnselect}
                  className="px-6 py-2 rounded-xl border border-white/20 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConnect}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] shadow-emerald-500 flex items-center gap-2"
                >
                  Deploy Mentor <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mentors Column */}
        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 text-xs font-bold flex items-center justify-center">1</span>
            <h4 className="text-white/70 font-semibold uppercase text-xs tracking-wider">Available Mentors</h4>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {mentors.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 text-center border-2 border-dashed border-white/10 rounded-xl text-white/30 text-sm">
                  All mentors deployed.
                </motion.div>
              )}
              {mentors.map(mentor => (
                <motion.div 
                  key={mentor.id}
                  layoutId={`mentor-${mentor.id}`}
                  onClick={() => setSelectedMentor(selectedMentor === mentor.id ? null : mentor.id)}
                  className={`
                    p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 relative group overflow-hidden
                    ${selectedMentor === mentor.id ? 'border-brand-500 bg-brand-500/15' : 'border-white/10 bg-white/5 hover:border-white/20'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-bold text-lg flex items-center gap-2">
                        {mentor.name}
                        <ShieldCheck size={16} className="text-emerald-400" />
                      </h4>
                      <p className="text-white/40 text-sm">{mentor.subject} Specialist</p>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 font-bold text-sm">
                      <Star size={14} className="fill-amber-400" /> {mentor.rating}
                    </div>
                  </div>
                  {/* Select Indicator */}
                  <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-opacity duration-300 ${selectedMentor === mentor.id ? 'opacity-100' : 'opacity-0'}`}>
                    <CheckCircle2 className="text-brand-400" size={24} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Batches Column */}
        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">2</span>
            <h4 className="text-white/70 font-semibold uppercase text-xs tracking-wider">Pending Cohorts</h4>
          </div>
          <div className="space-y-3">
             <AnimatePresence>
               {batches.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 text-center border-2 border-dashed border-white/10 rounded-xl text-white/30 text-sm">
                  All cohorts covered.
                </motion.div>
              )}
              {batches.map(batch => {
                const isMatch = selectedMentor && mentors.find(m => m.id === selectedMentor)?.subject === batch.subject;
                return (
                  <motion.div 
                    key={batch.id}
                    layoutId={`batch-${batch.id}`}
                    onClick={() => {
                      if (!selectedMentor) return;
                      setSelectedBatch(selectedBatch === batch.id ? null : batch.id);
                    }}
                    className={`
                      p-4 rounded-xl border-2 transition-all duration-300 relative
                      ${!selectedMentor ? 'opacity-50 cursor-not-allowed border-white/10 bg-white/5' : 
                        selectedBatch === batch.id ? 'border-emerald-500 bg-emerald-500/15 cursor-pointer' :
                        isMatch ? 'border-emerald-500/40 bg-white/5 cursor-pointer hover:bg-emerald-500/10 animate-pulse' : 
                        'border-white/10 bg-white/5 cursor-pointer hover:border-white/30 opacity-70'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-white/60 font-semibold">{batch.subject}</span>
                          {isMatch && !selectedBatch && <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Perfect Match</span>}
                        </div>
                        <h4 className="text-white font-bold">{batch.name}</h4>
                      </div>
                      <div className="text-right">
                        <Users size={16} className="text-white/40 mb-1 ml-auto" />
                        <span className="text-white/60 text-sm font-bold">{batch.students}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchingTool;
