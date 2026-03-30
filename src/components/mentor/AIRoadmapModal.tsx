import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Map as MapIcon, Calendar, CheckCircle2, Circle } from 'lucide-react';

interface AIRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchName: string;
}

const TIMELINE = [
  { week: 'Week 1', topic: 'Algebraic Expressions - Basics', status: 'completed' },
  { week: 'Week 2', topic: 'Polynomials & Factoring', status: 'current' },
  { week: 'Week 3', topic: 'Linear Equations in One Variable', status: 'upcoming' },
  { week: 'Week 4', topic: 'Monthly Mastery Assessment', status: 'upcoming' },
];

const AIRoadmapModal: React.FC<AIRoadmapModalProps> = ({ isOpen, onClose, batchName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-brand-600/20 to-violet-600/20 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-brand-500/20 p-2 rounded-lg">
              <MapIcon size={20} className="text-brand-400" />
            </div>
            <h2 className="text-xl font-bold text-white">AI Syllabus Roadmap</h2>
          </div>
          <p className="text-white/60 text-sm">Dynamic progression for {batchName} based on their average learning speed.</p>
        </div>

        {/* Timeline */}
        <div className="p-6">
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
            {TIMELINE.map((item, index) => (
              <div key={item.week} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                
                {/* Icon */}
                <div className={`
                  flex items-center justify-center w-6 h-6 rounded-full border-2 bg-slate-900 z-10 
                  shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow whitespace-nowrap
                  ${item.status === 'completed' ? 'border-emerald-500 text-emerald-500' : 
                    item.status === 'current' ? 'border-brand-500 text-brand-500 ring-4 ring-brand-500/20' : 
                    'border-slate-700 text-slate-700'}
                `}>
                  {item.status === 'completed' ? <CheckCircle2 size={14} /> : <Circle size={10} fill={item.status === 'current' ? 'currentColor' : 'transparent'} />}
                </div>

                {/* Card */}
                <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border transition-colors
                  ${item.status === 'current' ? 'bg-white/5 border-brand-500/30' : 'bg-slate-800/50 border-white/5'}
                `}>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={12} className="text-white/40" />
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${item.status === 'current' ? 'text-brand-400' : 'text-white/40'}`}>
                      {item.week}
                    </span>
                  </div>
                  <h3 className={`font-semibold text-sm ${item.status === 'completed' ? 'text-white/60' : 'text-white/90'}`}>
                    {item.topic}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-brand-300 font-semibold mb-2">✨ Timeline auto-adjusts based on batch assessments</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AIRoadmapModal;
