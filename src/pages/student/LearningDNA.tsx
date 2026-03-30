import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip,
  BarChart, CartesianGrid, XAxis, YAxis, Bar
} from 'recharts';
import { Shield, Brain, Medal, Zap, Lock, Star, Sparkles, ChevronRight, Award, Activity } from 'lucide-react';
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
  const [dna, setDna] = useState<LearningDNAStats>(DEFAULT_DNA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const accentColor = '#8b5cf6'; // Violet theme for DNA

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
        setDna({
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

  const radarData = useMemo(() => ([
    { subject: 'Logical', value: dna.logical, fullMark: 100 },
    { subject: 'Verbal', value: dna.verbal, fullMark: 100 },
    { subject: 'Creative', value: dna.creative, fullMark: 100 },
    { subject: 'Visual-Spatial', value: dna.visual_spatial, fullMark: 100 },
    { subject: 'Memory', value: dna.memory, fullMark: 100 },
    { subject: 'Pattern', value: dna.pattern, fullMark: 100 },
  ]), [dna]);

  const barData = useMemo(() => ([
    { key: 'Logical', score: dna.logical },
    { key: 'Verbal', score: dna.verbal },
    { key: 'Creative', score: dna.creative },
    { key: 'Visual', score: dna.visual_spatial },
    { key: 'Memory', score: dna.memory },
    { key: 'Pattern', score: dna.pattern },
  ]), [dna]);

  return (
    <div className="min-h-screen p-8 text-white relative">
      {/* Background glow lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
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

        {loading ? <p className="text-white/60 mb-4">Loading Learning DNA...</p> : null}
        {error ? <p className="text-red-300 mb-4 text-sm">{error}</p> : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Radar Chart Section */}
          <motion.div 
            className="glass-card p-6 h-[500px] flex flex-col"
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
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'Inter' }} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
                  />
                  <Radar
                    name="Aptitude"
                    dataKey="value"
                    stroke={accentColor}
                    strokeWidth={3}
                    fill={accentColor}
                    fillOpacity={0.2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Right Column */}
          <div className="space-y-8">
            <motion.div
              className="glass-card p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <BarChart size={18} className="text-indigo-300" />
                Dimension Breakdown (Bar)
              </h3>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="key" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.92)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#c4b5fd', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="score" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Insights Panel */}
            <motion.div
              className="glass-card p-6 border-l-4 border-l-violet-500"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
               <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-brand-400" />
                TARA's DNA Analysis
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <p className="text-white/80 text-sm leading-relaxed">
                    You have an exceptionally high <strong className="text-violet-300">Creative Thinking</strong> score. This means you excel when concepts are visually mapped out or linked to real-world storytelling. Let's incorporate more mind-maps into your daily missions.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-white/60 text-sm leading-relaxed">
                    Your <strong className="text-white/80">Memory Processing</strong> is a bit lower compared to your pattern recognition. Using flashcards and spaced repetition for the next 7 days will significantly boost this metric.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Badge Vault */}
            <motion.div
              className="glass-card p-6"
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
      </div>
    </div>
  );
};

export default LearningDNA;
