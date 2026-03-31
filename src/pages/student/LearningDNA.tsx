import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip,
  BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Bar
} from 'recharts';
import { Brain, Sparkles, Award, Activity, Bot } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { apiRequest } from '@/lib/api';

interface LearningDNAStats {
  logical: number;
  verbal: number;
  creative: number;
  visual_spatial: number;
  memory: number;
  pattern: number;
}

const DEFAULT_DNA: LearningDNAStats = {
  logical: 50,
  verbal: 50,
  creative: 50,
  visual_spatial: 50,
  memory: 50,
  pattern: 50,
};

const DNA_DIMENSIONS: Array<{ key: keyof LearningDNAStats; label: string; shortLabel: string }> = [
  { key: 'logical', label: 'Logical Reasoning', shortLabel: 'Logical' },
  { key: 'verbal', label: 'Verbal Intelligence', shortLabel: 'Verbal' },
  { key: 'creative', label: 'Creative Thinking', shortLabel: 'Creative' },
  { key: 'visual_spatial', label: 'Visual Spatial', shortLabel: 'Visual' },
  { key: 'memory', label: 'Memory Processing', shortLabel: 'Memory' },
  { key: 'pattern', label: 'Pattern Recognition', shortLabel: 'Pattern' },
];

const badges = [
  { id: 1, name: 'Consistency King', description: '7-day learning streak', icon: '👑', rarity: 'Gold', earned: true },
  { id: 2, name: 'Math Master', description: 'Scored 90%+ in 5 Quizzes', icon: '📐', rarity: 'Silver', earned: true },
  { id: 3, name: 'Early Bird', description: 'Completed a mission before 7 AM', icon: '🌅', rarity: 'Bronze', earned: true },
  { id: 4, name: 'Science Explorer', description: 'Read 10 Science logs', icon: '🔬', rarity: 'Silver', earned: false },
  { id: 5, name: 'Flawless Execution', description: '100% on a diagnostic test', icon: '✨', rarity: 'Gold', earned: false },
  { id: 6, name: 'Vocabulary Virtuoso', description: 'Learnt 50 new words', icon: '📚', rarity: 'Silver', earned: false },
];

export const LearningDNA: React.FC = () => {
  const { user } = useUser();
  const [dnaData, setDnaData] = useState<LearningDNAStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const accentColor = '#8b5cf6';

  useEffect(() => {
    let active = true;

    const loadDna = async () => {
      try {
        if (active) {
          setLoading(true);
          setError('');
        }
        const dnaResponse = await apiRequest<LearningDNAStats>('/student/dna', {}, true);
        if (!active) return;
        setDnaData({
          logical: Number(dnaResponse?.logical ?? 50),
          verbal: Number(dnaResponse?.verbal ?? 50),
          creative: Number(dnaResponse?.creative ?? 50),
          visual_spatial: Number(dnaResponse?.visual_spatial ?? 50),
          memory: Number(dnaResponse?.memory ?? 50),
          pattern: Number(dnaResponse?.pattern ?? 50),
        });
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load Learning DNA.');
        setDnaData(DEFAULT_DNA);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDna();

    return () => {
      active = false;
    };
  }, []);

  const effectiveDna = dnaData ?? DEFAULT_DNA;

  const radarData = useMemo(
    () =>
      DNA_DIMENSIONS.map((dimension) => ({
        subject: dimension.shortLabel,
        score: effectiveDna[dimension.key],
        fullMark: 100,
      })),
    [effectiveDna],
  );

  const barData = useMemo(
    () =>
      DNA_DIMENSIONS.map((dimension) => ({
        dimension: dimension.label,
        score: effectiveDna[dimension.key],
      })),
    [effectiveDna],
  );

  const taraAnalysis = useMemo(() => {
    const ranked = [...DNA_DIMENSIONS]
      .map((dimension) => ({
        ...dimension,
        score: effectiveDna[dimension.key],
      }))
      .sort((a, b) => b.score - a.score);

    const strongest = ranked[0];
    const second = ranked[1];

    if (strongest.key === 'logical') {
      return {
        title: 'Analytical Command Mode',
        deepDive: `Your Pattern Recognition and Logical scores are elite! You might enjoy the MPC stream. Lean into math modeling, puzzle labs, and algorithm drills to compound this edge.`,
        coachNote: `Your next growth move is to keep ${second.label} active so your decision-making stays fast and well-rounded.`,
      };
    }

    if (strongest.key === 'creative') {
      return {
        title: 'Innovation Mode',
        deepDive: `Creative Thinking is your strongest DNA trait. You absorb ideas best through projects, prototypes, and story-based problem solving.`,
        coachNote: `Pair that creativity with ${second.label} practice to turn ideas into repeatable outcomes.`,
      };
    }

    if (strongest.key === 'verbal') {
      return {
        title: 'Expression Advantage',
        deepDive: `Verbal Intelligence leads your profile. You can accelerate learning by teaching concepts aloud, debating strategies, and summarizing lessons in your own words.`,
        coachNote: `Sharpen ${second.label} to balance communication strength with technical execution.`,
      };
    }

    if (strongest.key === 'visual_spatial') {
      return {
        title: 'Visual Systems Mode',
        deepDive: `Visual Spatial reasoning is your top advantage. You think in structures, flow, and patterns, which makes diagrams and concept maps especially powerful for retention.`,
        coachNote: `Use quick verbal recaps after each visual map to build ${second.label} at the same pace.`,
      };
    }

    if (strongest.key === 'memory') {
      return {
        title: 'Retention Engine',
        deepDive: `Memory Processing is currently your strongest asset. You can convert revision into long-term mastery faster than most learners.`,
        coachNote: `Add weekly challenge sets to push ${second.label} and ensure transfer, not just recall.`,
      };
    }

    return {
      title: 'Pattern Mastery',
      deepDive: `Pattern Recognition is your dominant strength. You notice hidden structure quickly, which is ideal for coding, advanced math, and strategic problem-solving.`,
      coachNote: `Keep stretching ${second.label} to make your pattern speed translate into broader academic performance.`,
    };
  }, [effectiveDna]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-10 text-white relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 lg:mb-10"
        >
          <div className="flex items-center gap-2 mb-2">
            <Brain size={20} className="text-violet-400" />
            <span className="text-white/50 uppercase tracking-widest text-sm font-bold">Cognitive Profile</span>
          </div>
          <h1 className="text-4xl font-extrabold pb-2">
            {user?.name}'s <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Learning DNA</span>
          </h1>
          <p className="text-white/40">Deep Dive section for analyzing your cognitive strengths and growth dimensions.</p>
        </motion.div>

        {loading ? (
          <div className="glass-card p-10 mb-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full border-4 border-violet-300/20 border-t-violet-400 animate-spin" />
              <p className="text-white/75 text-sm tracking-wide">Analyzing your DNA...</p>
            </div>
          </div>
        ) : null}
        {error ? <p className="text-red-300 mb-4 text-sm">{error}</p> : null}

        {!loading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          
          <motion.div 
            className="glass-card p-5 sm:p-6 h-[380px] sm:h-[440px] lg:h-[500px] flex flex-col"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Activity size={18} className="text-violet-400" />
                Aptitude Spectrum (Radar)
              </h2>
              <div className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold">
                Level 4 Synthesizer
              </div>
            </div>
            
            <div className="flex-1 w-full min-h-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
                  />
                  <Radar
                    name="Aptitude"
                    dataKey="score"
                    stroke={accentColor}
                    strokeWidth={3}
                    fill={accentColor}
                    fillOpacity={0.2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="space-y-8">
            <motion.div
              className="glass-card p-5 sm:p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Activity size={18} className="text-indigo-300" />
                Dimension Breakdown (Bar)
              </h3>
              <div className="h-[300px] sm:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={barData} layout="vertical" margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={true} vertical={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="dimension" tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.92)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#c4b5fd', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="score" fill="#8b5cf6" radius={[0, 10, 10, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div
              className="glass-card p-5 sm:p-6 border-l-4 border-l-violet-500"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
               <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Bot size={18} className="text-violet-300" />
                TARA's DNA Analysis
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-violet-200/80 mb-2">
                    <Sparkles size={14} />
                    {taraAnalysis.title}
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {taraAnalysis.deepDive}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-white/60 text-sm leading-relaxed">
                    {taraAnalysis.coachNote}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="glass-card p-5 sm:p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Award size={18} className="text-amber-400" />
                  The Vault
                </h2>
                <span className="text-white/30 text-sm">{badges.filter(b => b.earned).length}/{badges.length} Unlocked</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {badges.map((badge, i) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + (i * 0.05) }}
                    whileHover={badge.earned ? { scale: 1.05, y: -2 } : {}}
                    className={`
                      relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-center
                      ${badge.earned 
                        ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                        : 'bg-white/5 border-white/5 opacity-50 grayscale hover:grayscale-0'
                      }
                    `}
                  >
                    <div className="text-4xl mb-2 drop-shadow-md">
                      {badge.earned ? badge.icon : '🔒'}
                    </div>
                    <p className="text-white/90 text-xs font-bold mb-1">{badge.name}</p>
                    {badge.earned && (
                      <span className={`
                        text-[9px] px-2 py-0.5 rounded-full font-bold
                        ${badge.rarity === 'Gold' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          badge.rarity === 'Silver' ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' :
                          'bg-orange-500/20 text-orange-400 border border-orange-500/30'}
                      `}>
                        {badge.rarity}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
        ) : null}
      </div>
    </div>
  );
};

export default LearningDNA;
