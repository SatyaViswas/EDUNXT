import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { 
  Rocket, Map, Compass, X, 
  ChevronRight, Calculator, FlaskConical, Globe, Code2, PenTool, Scaling
} from 'lucide-react';

const RECOMMENDATIONS = [
  {
    id: 'mpc',
    name: 'MPC (Math, Physics, Chemistry)',
    match: 94,
    description: 'Perfect for your high Logical and Pattern Recognition DNA scores.',
    icon: <Calculator size={32} className="text-saffron-400" />,
    color: 'from-saffron-500 to-amber-500',
    details: {
      careers: ['Software Engineering', 'Aerospace', 'Data Science'],
      exams: ['JEE Main', 'JEE Advanced', 'BITSAT'],
      colleges: ['IITs', 'NITs', 'BITS Pilani']
    }
  },
  {
    id: 'bipc',
    name: 'BiPC (Biology, Physics, Chemistry)',
    match: 72,
    description: 'Good synergy with your Memory Processing and Creative Thinking.',
    icon: <FlaskConical size={32} className="text-emerald-400" />,
    color: 'from-emerald-500 to-teal-500',
    details: {
      careers: ['Medicine (MBBS)', 'Pharmacy', 'Biotechnology'],
      exams: ['NEET-UG', 'AIIMS', 'JIPMER'],
      colleges: ['AIIMS', 'JIPMER', 'State Medical Colleges']
    }
  },
  {
    id: 'cec',
    name: 'Commerce & Economics',
    match: 65,
    description: 'Capitalizes on your Verbal Ability and Synthesis skills.',
    icon: <Globe size={32} className="text-blue-400" />,
    color: 'from-blue-500 to-indigo-500',
    details: {
      careers: ['Chartered Accountancy', 'Investment Banking', 'Management'],
      exams: ['CA Foundation', 'CUET', 'IPMAT'],
      colleges: ['SRCC Delhi', 'IIM Indore', 'Xavier\'s Mumbai']
    }
  }
];

export const CareerTracker: React.FC = () => {
  const { user } = useUser();
  const std = parseInt(user?.standard || '1', 10);
  const [activeCard, setActiveCard] = useState<typeof RECOMMENDATIONS[0] | null>(null);

  // Fallback for primary/lower students
  if (std < 8) {
    return (
      <div className="min-h-screen p-8 text-white flex items-center justify-center relative overflow-hidden">
        {/* Playful background */}
        <div className="absolute inset-0 bg-slate-950 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s'}} />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md text-center relative z-10 glass-card p-10"
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-brand-400 to-violet-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-brand-500/30">
            <Compass size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold mb-4">The World is Yours!</h1>
          <p className="text-white/60 mb-6 leading-relaxed">
            You're currently in <strong>Class {std}</strong>. It's too early to worry about entrance exams and careers. Right now, your main mission is to explore, build your learning DNA, and have fun on the Adventure Map!
          </p>
          <div className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-brand-300 font-bold">
            Check back in Class 8!
          </div>
        </motion.div>
      </div>
    );
  }

  // Stream Recommendation Engine for Class 8+
  return (
    <div className="min-h-screen p-8 text-white relative">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <Rocket size={20} className="text-saffron-400" />
            <span className="text-white/50 uppercase tracking-widest text-sm font-bold">TARA Engine</span>
          </div>
          <h1 className="text-4xl font-extrabold pb-2">
            Stream <span className="text-transparent bg-clip-text bg-gradient-to-r from-saffron-400 to-amber-400">Recommendations</span>
          </h1>
          <p className="text-white/40">Powered by your Learning DNA profile from the past 6 months.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {RECOMMENDATIONS.map((rec, i) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -5 }}
              onClick={() => setActiveCard(rec)}
              className={`
                glass-card p-6 cursor-pointer group relative overflow-hidden transition-all
                ${i === 0 ? 'border-saffron-500/30 ring-1 ring-saffron-500/20' : ''}
              `}
            >
              {i === 0 && (
                <div className="absolute top-0 right-0 bg-saffron-500 text-slate-900 text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-lg">
                  Top Match
                </div>
              )}
              
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${rec.color} flex items-center justify-center shadow-lg`}>
                  <div className="bg-slate-900 w-[52px] h-[52px] rounded-xl flex items-center justify-center">
                    {rec.icon}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-extrabold text-white">{rec.match}%</div>
                  <div className="text-[10px] uppercase font-bold text-white/30 tracking-wider">DNA Match</div>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-2 text-white group-hover:text-brand-300 transition-colors">{rec.name}</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-6 h-10">{rec.description}</p>

              <div className="flex items-center text-brand-400 text-sm font-bold group-hover:translate-x-2 transition-transform">
                Deep Dive <ChevronRight size={16} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Deep Dive Modal */}
      <AnimatePresence>
        {activeCard && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setActiveCard(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              className={`max-w-2xl w-full rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`p-8 bg-gradient-to-br ${activeCard.color} relative`}>
                <button 
                  onClick={() => setActiveCard(null)}
                  className="absolute top-4 right-4 text-white/50 hover:text-white bg-black/20 p-2 rounded-full backdrop-blur-sm"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                    {React.cloneElement(activeCard.icon as React.ReactElement, { className: 'text-white' })}
                  </div>
                  <div>
                    <h2 className="text-3xl font-extrabold text-white mb-1">{activeCard.name}</h2>
                    <p className="text-white/80 font-medium">Class 11 & 12 Pathway</p>
                  </div>
                </div>
              </div>

              {/* Content Grid */}
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-white/40 uppercase text-[10px] tracking-widest font-bold mb-4">Top Careers</h4>
                  <ul className="space-y-3">
                    {activeCard.details.careers.map(career => (
                      <li key={career} className="flex items-center gap-3 text-white/90 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                        {career}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-white/40 uppercase text-[10px] tracking-widest font-bold mb-4">Target Exams</h4>
                  <ul className="space-y-3">
                    {activeCard.details.exams.map(exam => (
                      <li key={exam} className="flex items-center gap-3 text-white/90 font-medium">
                        <PenTool size={14} className="text-saffron-400" />
                        {exam}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="md:col-span-2 p-5 rounded-2xl bg-white/5 border border-white/5">
                   <h4 className="text-white/40 uppercase text-[10px] tracking-widest font-bold mb-4">Top Institutions</h4>
                   <div className="flex flex-wrap gap-2">
                     {activeCard.details.colleges.map(college => (
                       <span key={college} className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-sm font-medium">
                         {college}
                       </span>
                     ))}
                   </div>
                </div>
              </div>

              <div className="p-4 border-t border-white/5 bg-slate-950 text-center">
                <button className={`px-6 py-3 rounded-xl bg-gradient-to-r ${activeCard.color} text-white font-bold tracking-wide w-full md:w-auto shadow-lg hover:opacity-90 transition-opacity`}>
                  Start Foundation Program
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CareerTracker;
