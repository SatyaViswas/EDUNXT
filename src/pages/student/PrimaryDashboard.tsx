import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import DNAChart from '@/components/DNAChart';
import DailyMissions from '@/components/student/DailyMissions';
import {
  Star, Lock, CheckCircle2, Flame, Trophy, Map,
  Sparkles, Heart, Zap, ChevronRight, X, Medal
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────── */
interface Level {
  id: number;
  title: string;
  subject: string;
  emoji: string;
  status: 'locked' | 'active' | 'complete';
  stars: number;
  color: string;
  badge?: string;
}

/* ── Data ───────────────────────────────────────────── */
const adventureLevels: Level[] = [
  { id: 1, title: 'Numbers Kingdom', subject: 'Mathematics', emoji: '🔢', status: 'complete', stars: 3, color: 'from-blue-500 to-cyan-500', badge: 'Number Wizard' },
  { id: 2, title: 'Story Forest', subject: 'English', emoji: '📖', status: 'complete', stars: 2, color: 'from-emerald-500 to-teal-500', badge: 'Word Explorer' },
  { id: 3, title: 'Shape Island', subject: 'Geometry', emoji: '🔺', status: 'active', stars: 0, color: 'from-saffron-500 to-amber-500' },
  { id: 4, title: 'Science Volcano', subject: 'Science', emoji: '🌋', status: 'locked', stars: 0, color: 'from-red-500 to-orange-500' },
  { id: 5, title: 'History Castle', subject: 'Social Studies', emoji: '🏰', status: 'locked', stars: 0, color: 'from-purple-500 to-violet-500' },
  { id: 6, title: 'Art Galaxy', subject: 'Creative Arts', emoji: '🎨', status: 'locked', stars: 0, color: 'from-pink-500 to-rose-500' },
];

const taraMessages = [
  "You're doing great! Let's conquer Shape Island! 🏆",
  "3 more XP to unlock Science Volcano! ⚡",
  "You earned the Word Explorer badge! 🌟",
  "Remember: Practice makes perfect! 💪",
];

const badges = [
  { id: 1, name: 'Number Wizard', icon: '🔢', earned: true, rarity: 'Gold' },
  { id: 2, name: 'Word Explorer', icon: '📖', earned: true, rarity: 'Silver' },
  { id: 3, name: 'Shape Master', icon: '🔺', earned: false, rarity: 'Gold' },
  { id: 4, name: 'Science Star', icon: '🔬', earned: false, rarity: 'Diamond' },
];

const StarRating: React.FC<{ stars: number; max?: number }> = ({ stars, max = 3 }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <Star
        key={i}
        size={12}
        className={i < stars ? 'text-amber-400 fill-amber-400' : 'text-white/20'}
      />
    ))}
  </div>
);

/* ── TARA Companion ───────────────────────────────── */
const TaraCompanion: React.FC<{ message: string }> = ({ message }) => (
  <motion.div
    className="flex items-end gap-3"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.5 }}
  >
    {/* TARA avatar */}
    <motion.div
      className="relative flex-shrink-0"
      animate={{ y: [0, -6, 0] }}
      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/30">
        🤖
      </div>
      {/* glow ring */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 opacity-20 blur-md -z-10" />
      {/* Sparkle */}
      <motion.div
        className="absolute -top-1 -right-1 text-base"
        animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        ✨
      </motion.div>
    </motion.div>

    {/* Speech bubble */}
    <motion.div
      className="relative bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl rounded-bl-sm px-4 py-3 max-w-xs"
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
    >
      <p className="text-white/90 text-sm font-medium leading-snug">{message}</p>
      <p className="text-white/40 text-xs mt-1">TARA · Your Learning Companion</p>
      {/* tail */}
      <div className="absolute -left-2 bottom-3 w-0 h-0 border-r-8 border-r-white/10 border-y-8 border-y-transparent" />
    </motion.div>
  </motion.div>
);

/* ── Level Card ──────────────────────────────────── */
const LevelCard: React.FC<{ level: Level; index: number; onClick: () => void }> = ({
  level, index, onClick,
}) => {
  const isEven = index % 2 === 0;

  return (
    <motion.div
      className="flex items-center gap-4"
      style={{ justifyContent: isEven ? 'flex-start' : 'flex-end' }}
      initial={{ opacity: 0, x: isEven ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
    >
      {/* Connector line for non-first items */}
      {index > 0 && (
        <div className="absolute left-1/2 -translate-x-1/2" style={{ height: '100%' }} />
      )}

      <motion.button
        whileHover={level.status !== 'locked' ? { scale: 1.05 } : {}}
        whileTap={level.status !== 'locked' ? { scale: 0.97 } : {}}
        onClick={level.status !== 'locked' ? onClick : undefined}
        className={`
          relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300
          ${level.status === 'complete' ? 'border-emerald-500/50 bg-emerald-500/10' :
            level.status === 'active' ? 'border-saffron-500/80 bg-saffron-500/15 cursor-pointer' :
            'border-white/10 bg-white/5 opacity-60 cursor-not-allowed'}
          ${level.status !== 'locked' ? 'hover:shadow-xl' : ''}
          w-72
        `}
      >
        {/* Emoji icon */}
        <div className={`
          w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0
          bg-gradient-to-br ${level.color}
          ${level.status === 'locked' ? 'grayscale opacity-50' : 'shadow-lg'}
        `}>
          {level.status === 'locked' ? <Lock size={20} className="text-white/60" /> : level.emoji}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium">
              {level.subject}
            </span>
            {level.status === 'active' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-saffron-500/20 text-saffron-400 border border-saffron-500/30 font-bold uppercase animate-pulse">
                Active!
              </span>
            )}
          </div>
          <p className="text-white font-bold text-sm">{level.title}</p>
          {level.status === 'complete' ? (
            <StarRating stars={level.stars} />
          ) : level.status === 'active' ? (
            <p className="text-saffron-400 text-xs font-medium mt-0.5">Tap to play! →</p>
          ) : (
            <p className="text-white/30 text-xs mt-0.5">Locked</p>
          )}
        </div>

        {/* Status icon */}
        {level.status === 'complete' && (
          <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
        )}
        {level.status === 'active' && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <Zap size={18} className="text-saffron-400 flex-shrink-0" />
          </motion.div>
        )}
      </motion.button>
    </motion.div>
  );
};

/* ── Main Primary Dashboard ────────────────────────── */
const PrimaryDashboard: React.FC = () => {
  const { user, logout } = useUser();
  const [taraMessageIdx, setTaraMessageIdx] = useState(0);
  const [activeLevelId, setActiveLevelId] = useState<number | null>(null);

  const totalXP = 340;
  const nextLevelXP = 500;
  const streak = 7;

  const handleTaraClick = () => {
    setTaraMessageIdx((i) => (i + 1) % taraMessages.length);
  };

  const dnaScores = { logical: 72, verbal: 58, creative: 85 };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Sky gradient top */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-indigo-950/80 to-transparent" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-40 left-20 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl animate-float" />
        {/* Stars */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-white/20 text-xs"
            style={{
              top: `${Math.random() * 30}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ repeat: Infinity, duration: 2 + Math.random() * 2, delay: Math.random() * 2 }}
          >
            ✦
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <div className="text-white/40 text-sm mb-1">👋 Hello, Explorer!</div>
            <h1 className="text-3xl font-extrabold text-white">
              {user?.name ?? 'Student'}'s{' '}
              <span className="gradient-text">Adventure Map</span>
            </h1>
            <p className="text-white/40 text-sm mt-1">Class {user?.standard} · Keep journeying!</p>
          </div>

          {/* XP + Streak */}
          <div className="flex items-center gap-4">
            <motion.div
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30"
              whileHover={{ scale: 1.05 }}
            >
              <Flame size={18} className="text-amber-400" />
              <div>
                <p className="text-amber-300 font-bold text-lg leading-none">{streak}</p>
                <p className="text-amber-400/60 text-[10px]">Day Streak</p>
              </div>
            </motion.div>
            <motion.div
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-500/15 border border-brand-500/30"
              whileHover={{ scale: 1.05 }}
            >
              <Trophy size={18} className="text-brand-400" />
              <div>
                <p className="text-brand-300 font-bold text-lg leading-none">{totalXP}</p>
                <p className="text-brand-400/60 text-[10px]">Total XP</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* XP Progress bar */}
        <motion.div
          className="mb-10 p-4 rounded-2xl bg-white/5 border border-white/10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/60 font-medium">⚡ Journey Progress</span>
            <span className="text-white/40 text-xs">{totalXP} / {nextLevelXP} XP to <strong className="text-white">Level 4</strong></span>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 via-violet-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${(totalXP / nextLevelXP) * 100}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Adventure Map (Left - 2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* TARA */}
            <motion.div
              className="cursor-pointer"
              onClick={handleTaraClick}
              title="Click TARA to get advice!"
            >
              <TaraCompanion message={taraMessages[taraMessageIdx]} />
            </motion.div>

            {/* Map Header */}
            <div className="flex items-center gap-2 text-white/50 text-sm font-medium">
              <Map size={16} />
              <span>Adventure Map · Your Learning Journey</span>
            </div>

            {/* Levels — zigzag layout */}
            <div className="relative space-y-4">
              {/* Vertical dashed line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px border-l-2 border-dashed border-white/10 -translate-x-1/2" />

              {adventureLevels.map((level, i) => (
                <LevelCard
                  key={level.id}
                  level={level}
                  index={i}
                  onClick={() => setActiveLevelId(level.id)}
                />
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Learning DNA */}
            <motion.div
              className="glass-card p-5"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-violet-400" />
                <h3 className="text-white font-semibold text-sm">Learning DNA</h3>
              </div>
              <DNAChart scores={dnaScores} size="sm" accentColor="#a78bfa" />
            </motion.div>

            {/* Badges */}
            <motion.div
              className="glass-card p-5"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Medal size={16} className="text-amber-400" />
                <h3 className="text-white font-semibold text-sm">Badge Collection</h3>
                <span className="ml-auto text-xs text-white/30">{badges.filter(b => b.earned).length}/{badges.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {badges.map((badge) => (
                  <motion.div
                    key={badge.id}
                    whileHover={badge.earned ? { scale: 1.05 } : {}}
                    className={`
                      relative p-3 rounded-xl border text-center transition-all
                      ${badge.earned
                        ? 'border-amber-500/40 bg-amber-500/10'
                        : 'border-white/10 bg-white/5 opacity-50'}
                    `}
                  >
                    <div className={`text-2xl mb-1 ${!badge.earned ? 'grayscale' : ''}`}>
                      {badge.earned ? badge.icon : '🔒'}
                    </div>
                    <p className="text-white/70 text-[10px] font-medium leading-tight">{badge.name}</p>
                    {badge.earned && (
                      <span className={`
                        text-[9px] px-1.5 py-0.5 rounded-full font-bold
                        ${badge.rarity === 'Gold' ? 'bg-amber-500/20 text-amber-400' :
                          badge.rarity === 'Silver' ? 'bg-slate-400/20 text-slate-400' :
                          'bg-cyan-500/20 text-cyan-400'}
                      `}>
                        {badge.rarity}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Daily Missions */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <DailyMissions accentColor="#ec4899" />
            </motion.div>

            {/* Subjects quick overview */}
            <motion.div
              className="glass-card p-5"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Heart size={16} className="text-pink-400" />
                <h3 className="text-white font-semibold text-sm">My Favourites</h3>
              </div>
              <div className="space-y-2.5">
                {[
                  { subject: 'Mathematics', progress: 78, color: '#60a5fa' },
                  { subject: 'English', progress: 62, color: '#a78bfa' },
                  { subject: 'Science', progress: 41, color: '#34d399' },
                ].map(({ subject, progress, color }) => (
                  <div key={subject}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{subject}</span>
                      <span className="text-white/40">{progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Level modal */}
      <AnimatePresence>
        {activeLevelId && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full"
              initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 20 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">{adventureLevels.find(l => l.id === activeLevelId)?.title}</h3>
                <button onClick={() => setActiveLevelId(null)} className="text-white/40 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <div className="text-6xl text-center mb-4">{adventureLevels.find(l => l.id === activeLevelId)?.emoji}</div>
              <p className="text-white/60 text-sm text-center mb-6">Level content coming soon — this is where the learning game would launch!</p>
              <button
                onClick={() => setActiveLevelId(null)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-saffron-500 to-amber-500 text-white font-bold hover:opacity-90 transition-opacity"
              >
                Start Adventure! 🚀
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrimaryDashboard;
