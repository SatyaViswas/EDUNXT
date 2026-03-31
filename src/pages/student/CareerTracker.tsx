import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { apiRequest } from '@/lib/api';
import { 
  Rocket, Compass, X,
  ChevronRight, Calculator, FlaskConical, Globe, GraduationCap, Cpu, HardHat, Building2, Bot
} from 'lucide-react';

interface CareerRecommendationItem {
  stream: string;
  display_name: string;
  match_score: number;
  description: string;
  syllabus_overview: string;
  trial_label: string;
  trial_url: string;
  why: string;
}

interface CareerRecommendationsResponse {
  standard: number;
  stage: 'HighSchool' | 'Undergrad';
  tara_advice: string;
  coming_soon: boolean;
  recommendations: CareerRecommendationItem[];
}

const STREAM_VISUALS: Record<string, { color: string; icon: React.ReactNode; iconBg: string }> = {
  MPC: {
    color: 'from-saffron-500 to-amber-500',
    icon: <Calculator size={30} className="text-saffron-300" />,
    iconBg: 'bg-saffron-500/20',
  },
  BiPC: {
    color: 'from-emerald-500 to-teal-500',
    icon: <FlaskConical size={30} className="text-emerald-300" />,
    iconBg: 'bg-emerald-500/20',
  },
  CEC: {
    color: 'from-blue-500 to-indigo-500',
    icon: <Globe size={30} className="text-blue-300" />,
    iconBg: 'bg-blue-500/20',
  },
  HEC: {
    color: 'from-violet-500 to-fuchsia-500',
    icon: <GraduationCap size={30} className="text-violet-300" />,
    iconBg: 'bg-violet-500/20',
  },
  CSE: {
    color: 'from-cyan-500 to-sky-500',
    icon: <Cpu size={30} className="text-cyan-300" />,
    iconBg: 'bg-cyan-500/20',
  },
  ECE: {
    color: 'from-orange-500 to-amber-500',
    icon: <Rocket size={30} className="text-orange-300" />,
    iconBg: 'bg-orange-500/20',
  },
  Mechanical: {
    color: 'from-slate-500 to-zinc-500',
    icon: <HardHat size={30} className="text-slate-200" />,
    iconBg: 'bg-slate-500/20',
  },
  Civils: {
    color: 'from-yellow-500 to-lime-500',
    icon: <Building2 size={30} className="text-yellow-300" />,
    iconBg: 'bg-yellow-500/20',
  },
  Degree: {
    color: 'from-pink-500 to-rose-500',
    icon: <GraduationCap size={30} className="text-pink-300" />,
    iconBg: 'bg-pink-500/20',
  },
};

export const CareerTracker: React.FC = () => {
  const { user } = useUser();
  const [careerData, setCareerData] = useState<CareerRecommendationsResponse | null>(null);
  const [activeCard, setActiveCard] = useState<CareerRecommendationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadCareerRecommendations = async () => {
      try {
        if (active) {
          setLoading(true);
          setError('');
        }
        const response = await apiRequest<CareerRecommendationsResponse>('/student/career-recommendations', {}, true);
        if (!active) {
          return;
        }
        setCareerData(response);
      } catch (err) {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load career recommendations.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCareerRecommendations();

    return () => {
      active = false;
    };
  }, []);

  const standard = careerData?.standard ?? parseInt(user?.standard || '1', 10);
  const stage = careerData?.stage ?? (standard >= 11 ? 'Undergrad' : 'HighSchool');
  const taraAdvice = careerData?.tara_advice ?? `Since you are in Grade ${standard}, you should start looking at ${stage} options.`;

  const recommendations = useMemo(() => careerData?.recommendations ?? [], [careerData]);

  if (loading) {
    return (
      <div className="min-h-screen p-8 text-white flex items-center justify-center">
        <div className="glass-card p-10 flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-saffron-300/20 border-t-saffron-400 animate-spin" />
          <p className="text-white/75 text-sm tracking-wide">TARA is mapping your best-fit streams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 text-white flex items-center justify-center">
        <div className="glass-card p-10 max-w-xl text-center">
          <h2 className="text-2xl font-bold mb-2">Career Engine Unavailable</h2>
          <p className="text-white/70">{error}</p>
        </div>
      </div>
    );
  }

  if ((careerData?.coming_soon ?? false) || standard < 8) {
    return (
      <div className="min-h-screen p-8 text-white flex items-center justify-center relative overflow-hidden">
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
          <h1 className="text-3xl font-extrabold mb-4">Coming Soon</h1>
          <p className="text-white/60 mb-6 leading-relaxed">
            You are currently in Grade <strong>{standard}</strong>. Career recommendations are unlocked from Grade 8 onward. Keep building your Learning DNA and check back soon.
          </p>
          <div className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-brand-300 font-bold">
            Check back in Grade 8.
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 text-white relative">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
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
          <p className="text-white/40">Grade {standard} • {stage} pathways ranked by your Learning DNA.</p>
          <div className="mt-4 p-4 rounded-xl border border-saffron-500/20 bg-saffron-500/10 max-w-3xl">
            <p className="text-saffron-200 text-sm leading-relaxed flex items-center gap-2">
              <Bot size={16} />
              {taraAdvice}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {recommendations.map((rec, i) => {
            const visual = STREAM_VISUALS[rec.stream] || {
              color: 'from-indigo-500 to-violet-500',
              icon: <GraduationCap size={30} className="text-indigo-200" />,
              iconBg: 'bg-indigo-500/20',
            };

            return (
            <motion.div
              key={rec.stream}
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
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${visual.color} flex items-center justify-center shadow-lg`}>
                  <div className="bg-slate-900 w-[52px] h-[52px] rounded-xl flex items-center justify-center">
                    {visual.icon}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-extrabold text-white">{rec.match_score}%</div>
                  <div className="text-[10px] uppercase font-bold text-white/30 tracking-wider">Match Score</div>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-2 text-white group-hover:text-brand-300 transition-colors">{rec.display_name}</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-2 min-h-[48px]">{rec.description}</p>
              <p className="text-white/40 text-xs leading-relaxed mb-6">{rec.why}</p>

              <div className="flex items-center text-brand-400 text-sm font-bold group-hover:translate-x-2 transition-transform">
                Open Glance <ChevronRight size={16} />
              </div>
            </motion.div>
          );
          })}
        </div>
      </div>

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
              <div className={`p-8 bg-gradient-to-br ${(STREAM_VISUALS[activeCard.stream]?.color || 'from-indigo-500 to-violet-500')} relative`}>
                <button 
                  onClick={() => setActiveCard(null)}
                  className="absolute top-4 right-4 text-white/50 hover:text-white bg-black/20 p-2 rounded-full backdrop-blur-sm"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl backdrop-blur-md ${STREAM_VISUALS[activeCard.stream]?.iconBg || 'bg-white/20'}`}>
                    {STREAM_VISUALS[activeCard.stream]?.icon || <GraduationCap size={30} className="text-white" />}
                  </div>
                  <div>
                    <h2 className="text-3xl font-extrabold text-white mb-1">{activeCard.display_name}</h2>
                    <p className="text-white/80 font-medium">{stage} Pathway • {activeCard.match_score}% Match</p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <h4 className="text-white/40 uppercase text-[10px] tracking-widest font-bold mb-3">Glance Overview</h4>
                  <p className="text-white/85 leading-relaxed text-sm">{activeCard.description}</p>
                </div>
                
                <div>
                  <h4 className="text-white/40 uppercase text-[10px] tracking-widest font-bold mb-3">Syllabus Snapshot</h4>
                  <p className="text-white/70 leading-relaxed text-sm">{activeCard.syllabus_overview}</p>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                   <h4 className="text-white/40 uppercase text-[10px] tracking-widest font-bold mb-3">Why This Matches You</h4>
                   <p className="text-white/75 text-sm leading-relaxed">{activeCard.why}</p>
                </div>
              </div>

              <div className="p-4 border-t border-white/5 bg-slate-950 text-center">
                <a
                  href={activeCard.trial_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-block px-6 py-3 rounded-xl bg-gradient-to-r ${(STREAM_VISUALS[activeCard.stream]?.color || 'from-indigo-500 to-violet-500')} text-white font-bold tracking-wide w-full md:w-auto shadow-lg hover:opacity-90 transition-opacity`}
                >
                  {activeCard.trial_label || 'Start 5-Minute Trial'}
                </a>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CareerTracker;
