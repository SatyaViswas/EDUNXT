import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Flame, CheckCircle2, Circle, Clock, ChevronRight } from 'lucide-react';

interface DailyMissionsProps {
  accentColor?: string;
  tasks?: { id: string; title: string; xp: number; type: 'quiz' | 'reading' | 'practice'; completed: boolean }[];
  streak?: number;
}

const mockTasks = [
  { id: '1', title: 'Complete Math Operations Quiz', xp: 50, type: 'quiz' as const, completed: true },
  { id: '2', title: 'Read Science Chapter 4 (Plants)', xp: 30, type: 'reading' as const, completed: false },
  { id: '3', title: 'Practice 10 Grammar Questions', xp: 40, type: 'practice' as const, completed: false },
];

const DailyMissions: React.FC<DailyMissionsProps> = ({ 
  accentColor = '#3b82f6', 
  tasks = mockTasks,
  streak = 12 
}) => {
  const [localTasks, setLocalTasks] = useState(tasks);

  const toggleTask = (id: string) => {
    setLocalTasks(prev => prev.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const completedCount = localTasks.filter(t => t.completed).length;
  const progressPercent = (completedCount / localTasks.length) * 100;

  return (
    <div className="glass-card p-5 relative overflow-hidden group">
      {/* Background Glow */}
      <div 
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-10 transition-opacity duration-500 group-hover:opacity-20"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Target size={20} style={{ color: accentColor }} />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Daily Missions</h3>
            <p className="text-white/40 text-xs">Reset in 4h 23m</p>
          </div>
        </div>
        
        {/* Streak Counter */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Flame size={16} className="text-amber-500 animate-pulse" />
          <span className="text-amber-400 font-bold text-sm">{streak} Day Streak</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-white/50">Today's Progress</span>
          <span className="font-bold text-white/90">{completedCount} / {localTasks.length} Completed</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            className="h-full rounded-full relative"
            style={{ backgroundColor: accentColor }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
          >
            <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ animation: 'shimmer 2s infinite linear', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
          </motion.div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3 relative z-10">
        {localTasks.map((task) => (
          <motion.div 
            key={task.id}
            className={`
              flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer
              ${task.completed ? 'bg-white/5 border-white/10 opacity-70' : 'bg-slate-800/50 border-white/10 hover:border-white/20 hover:bg-white/10'}
            `}
            onClick={() => toggleTask(task.id)}
            whileHover={{ scale: task.completed ? 1 : 1.01 }}
            whileTap={{ scale: 0.98 }}
            layout
          >
            <div className={`flex-shrink-0 transition-colors ${task.completed ? 'text-emerald-400' : 'text-white/20'}`}>
              {task.completed ? <CheckCircle2 size={22} className="fill-emerald-400/20" /> : <Circle size={22} />}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate transition-all ${task.completed ? 'text-white/50 line-through' : 'text-white/90'}`}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] uppercase font-bold text-brand-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                  +{task.xp} XP
                </span>
                <span className="text-white/30 text-[10px]">•</span>
                <span className="text-white/40 text-[10px] capitalize flex items-center gap-1">
                  {task.type === 'reading' && <Clock size={10} />}
                  {task.type}
                </span>
              </div>
            </div>

            {!task.completed && (
              <ChevronRight size={16} className="text-white/20 flex-shrink-0" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DailyMissions;
