import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Star, Shapes, Brain, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import type { Standard } from '@/context/UserContext';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

/* ═══════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════ */
interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type DiagnosticPhase = 'pick-class' | 'visual-game' | 'adaptive-mcq' | 'complete';

interface MCQQuestion {
  id: number;
  level: 'foundation' | 'intermediate' | 'advanced';
  question: string;
  options: string[];
  correctIndex: number;
  subject: string;
}

/* ═══════════════════════════════════════════════════════════
   Adaptive MCQ bank (stepped-down structure)
═══════════════════════════════════════════════════════════ */
const mcqBank: MCQQuestion[] = [
  {
    id: 1, level: 'advanced', subject: 'Mathematics',
    question: 'If f(x) = x² – 3x + 2, what is f(4)?',
    options: ['6', '10', '8', '14'],
    correctIndex: 0,
  },
  {
    id: 2, level: 'intermediate', subject: 'Mathematics',
    question: 'Solve for x: 3x + 9 = 24',
    options: ['5', '7', '3', '6'],
    correctIndex: 0,
  },
  {
    id: 3, level: 'foundation', subject: 'Mathematics',
    question: 'What is 15 × 6?',
    options: ['80', '90', '95', '85'],
    correctIndex: 1,
  },
  {
    id: 4, level: 'advanced', subject: 'Science',
    question: 'Which organelle is called the powerhouse of the cell?',
    options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi apparatus'],
    correctIndex: 2,
  },
  {
    id: 5, level: 'intermediate', subject: 'Science',
    question: 'What is the chemical formula for water?',
    options: ['CO₂', 'H₂O', 'O₂', 'NaCl'],
    correctIndex: 1,
  },
  {
    id: 6, level: 'foundation', subject: 'Science',
    question: 'The Sun rises in the __.',
    options: ['West', 'North', 'East', 'South'],
    correctIndex: 2,
  },
];

/* ═══════════════════════════════════════════════════════════
   Visual Pattern Game (Class 1-5)
═══════════════════════════════════════════════════════════ */
const patterns = [
  { sequence: ['🔴', '🔵', '🔴', '🔵', '❓'], answer: '🔵', options: ['🔴', '🔵', '🟢', '🟡'], label: 'Red-Blue pattern' },
  { sequence: ['⭐', '⭐', '🌙', '⭐', '⭐', '❓'], answer: '🌙', options: ['⭐', '🌙', '☀️', '🌟'], label: 'Star-Moon pattern' },
  { sequence: ['🟦', '🟦', '🟦', '🔴', '🟦', '🟦', '🟦', '❓'], answer: '🔴', options: ['🟦', '🔻', '🔴', '🟡'], label: 'Square-Red pattern' },
];

const VisualGame: React.FC<{ standard: Standard; onComplete: () => void }> = ({ standard, onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const pattern = patterns[currentIdx];

  const handleAnswer = (option: string) => {
    if (showFeedback) return;
    setSelected(option);
    setShowFeedback(true);
    if (option === pattern.answer) setCorrect((c) => c + 1);

    setTimeout(() => {
      setShowFeedback(false);
      setSelected(null);
      if (currentIdx < patterns.length - 1) {
        setCurrentIdx((i) => i + 1);
      } else {
        onComplete();
      }
    }, 1200);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Progress */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-white/40 mb-2">
          <span>Question {currentIdx + 1} of {patterns.length}</span>
          <span>⭐ {correct} correct</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((currentIdx) / patterns.length) * 100}%` }} />
        </div>
      </div>

      {/* Prompt */}
      <div className="text-center">
        <p className="text-white/50 text-sm mb-2">What comes next in the pattern?</p>
        <h3 className="text-lg font-semibold text-white">{pattern.label}</h3>
      </div>

      {/* Sequence */}
      <motion.div className="flex items-center gap-3 flex-wrap justify-center" layout>
        {pattern.sequence.map((item, i) => (
          <motion.div
            key={i}
            className={`
              text-3xl w-14 h-14 flex items-center justify-center rounded-xl border-2
              ${item === '❓' ? 'border-brand-500 bg-brand-500/20 animate-pulse' : 'border-white/10 bg-white/5'}
            `}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
          >
            {item}
          </motion.div>
        ))}
      </motion.div>

      {/* Options */}
      <div className="grid grid-cols-4 gap-3 w-full">
        {pattern.options.map((opt) => {
          const isSelected = selected === opt;
          const isCorrect = opt === pattern.answer;
          const feedbackColor = showFeedback && isSelected
            ? isCorrect ? 'border-emerald-400 bg-emerald-500/20' : 'border-red-400 bg-red-500/20'
            : 'border-white/10 bg-white/5 hover:bg-white/10';

          return (
            <motion.button
              key={opt}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAnswer(opt)}
              className={`text-3xl w-full h-16 rounded-xl border-2 transition-all duration-200 cursor-pointer ${feedbackColor}`}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Adaptive MCQ (Class 6-12)
═══════════════════════════════════════════════════════════ */
const AdaptiveMCQ: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [currentLevel, setCurrentLevel] = useState<'advanced' | 'intermediate' | 'foundation'>('advanced');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [questionsAsked, setQuestionsAsked] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAsked, setTotalAsked] = useState(0);

  const availableQuestions = mcqBank.filter(
    (q) => q.level === currentLevel && !questionsAsked.includes(q.id)
  );
  const currentQ = availableQuestions[0] ?? mcqBank.find(q => !questionsAsked.includes(q.id));

  const handleAnswer = (idx: number) => {
    if (showFeedback || !currentQ) return;
    setSelected(idx);
    setShowFeedback(true);
    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) setScore((s) => s + 1);

    setTimeout(() => {
      setShowFeedback(false);
      setSelected(null);
      setQuestionsAsked((prev) => [...prev, currentQ.id]);
      setTotalAsked((t) => t + 1);

      if (totalAsked >= 5) {
        onComplete();
        return;
      }

      // Adaptive step-down logic
      if (!isCorrect && currentLevel === 'advanced') setCurrentLevel('intermediate');
      else if (!isCorrect && currentLevel === 'intermediate') setCurrentLevel('foundation');

    }, 1300);
  };

  if (!currentQ) {
    onComplete();
    return null;
  }

  const levelColor = {
    advanced: 'text-red-400 bg-red-500/10 border-red-500/20',
    intermediate: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    foundation: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  }[currentLevel];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-brand-400" />
          <span className="text-white/70 text-sm font-medium">Adaptive Assessment</span>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium uppercase tracking-wide ${levelColor}`}>
          {currentLevel} level
        </span>
      </div>

      {/* Progress */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${(totalAsked / 6) * 100}%` }} />
      </div>

      {/* Subject badge */}
      <div className="text-xs text-white/30 uppercase tracking-widest">{currentQ.subject}</div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <h3 className="text-white font-semibold text-base leading-relaxed mb-6">
            Q{totalAsked + 1}. {currentQ.question}
          </h3>

          <div className="space-y-3">
            {currentQ.options.map((opt, i) => {
              const isSelected = selected === i;
              const isCorrect = i === currentQ.correctIndex;
              let optStyle = 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/25';
              if (showFeedback && isSelected) {
                optStyle = isCorrect
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                  : 'border-red-400 bg-red-500/20 text-red-300';
              } else if (showFeedback && isCorrect) {
                optStyle = 'border-emerald-400/50 bg-emerald-500/10';
              }

              return (
                <motion.button
                  key={i}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleAnswer(i)}
                  className={`
                    w-full text-left px-4 py-3.5 rounded-xl border-2 text-white/80 text-sm
                    transition-all duration-200 cursor-pointer font-medium
                    ${optStyle}
                  `}
                >
                  <span className="text-white/40 mr-3 font-mono text-xs">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {opt}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Step-down hint */}
      <p className="text-white/25 text-xs text-center">
        Questions adapt based on your responses · Finding your foundation level
      </p>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Main StudentDiagnostic Component
═══════════════════════════════════════════════════════════ */
const STANDARD_LABELS: { value: Standard; label: string }[] = [
  { value: '1', label: 'Class 1' }, { value: '2', label: 'Class 2' },
  { value: '3', label: 'Class 3' }, { value: '4', label: 'Class 4' },
  { value: '5', label: 'Class 5' }, { value: '6', label: 'Class 6' },
  { value: '7', label: 'Class 7' }, { value: '8', label: 'Class 8' },
  { value: '9', label: 'Class 9' }, { value: '10', label: 'Class 10' },
  { value: '11', label: 'Class 11' }, { value: '12', label: 'Class 12' },
  { value: 'UG', label: 'Undergraduate' },
];

const StudentDiagnostic: React.FC<Props> = ({ isOpen, onClose }) => {
  const [phase, setPhase] = useState<DiagnosticPhase>('pick-class');
  const [selectedStandard, setSelectedStandard] = useState<Standard>(null);
  const { login } = useUser();
  const navigate = useNavigate();

  const isVisualGroup = (s: Standard) =>
    s !== null && s !== 'UG' && parseInt(s) <= 5;

  const handleStandardConfirm = () => {
    if (!selectedStandard) return;
    if (isVisualGroup(selectedStandard)) {
      setPhase('visual-game');
    } else {
      setPhase('adaptive-mcq');
    }
  };

  const handleDiagnosticComplete = () => {
    setPhase('complete');
    setTimeout(() => {
      login({
        id: `student-${Date.now()}`,
        name: 'New Student',
        email: 'student@sahaayak.in',
        role: 'Student',
        standard: selectedStandard ?? '1',
      });
      navigate('/student', { replace: true });
    }, 2000);
  };

  const handleClose = () => {
    setPhase('pick-class');
    setSelectedStandard(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={phase === 'complete' ? undefined : handleClose}
      size="lg"
      preventClose={phase === 'complete'}
      showClose={phase !== 'complete'}
      title={
        phase === 'pick-class' ? '📚 Learning Level Diagnostic' :
        phase === 'visual-game' ? '🎮 Visual Pattern Recognition' :
        phase === 'adaptive-mcq' ? '🧠 Adaptive Assessment' : undefined
      }
    >
      <AnimatePresence mode="wait">
        {/* Phase: Pick Class */}
        {phase === 'pick-class' && (
          <motion.div
            key="pick-class"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex flex-col gap-6"
          >
            <p className="text-white/60 text-sm leading-relaxed">
              We personalize your entire learning journey based on your current class. 
              Select your grade to begin a short, fun assessment.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {STANDARD_LABELS.map(({ value, label }) => (
                <motion.button
                  key={value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedStandard(value)}
                  className={`
                    py-3 px-2 rounded-xl border-2 text-sm font-semibold transition-all duration-200 cursor-pointer
                    ${selectedStandard === value
                      ? 'border-brand-500 bg-brand-500/20 text-brand-300'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:text-white'}
                    ${value === 'UG' ? 'col-span-4' : ''}
                  `}
                >
                  {label}
                </motion.button>
              ))}
            </div>
            {selectedStandard && isVisualGroup(selectedStandard) && (
              <motion.div
                className="flex items-center gap-2 text-sm p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Shapes size={16} />
                You'll play a fun visual pattern matching game!
              </motion.div>
            )}
            {selectedStandard && !isVisualGroup(selectedStandard) && (
              <motion.div
                className="flex items-center gap-2 text-sm p-3 rounded-xl bg-saffron-500/10 border border-saffron-500/20 text-saffron-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Brain size={16} />
                You'll answer a few adaptive MCQs to find your foundation level.
              </motion.div>
            )}
            <Button
              fullWidth
              size="lg"
              disabled={!selectedStandard}
              onClick={handleStandardConfirm}
              rightIcon={<ChevronRight size={18} />}
            >
              Start Diagnostic
            </Button>
          </motion.div>
        )}

        {/* Phase: Visual Game */}
        {phase === 'visual-game' && (
          <motion.div
            key="visual-game"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
          >
            <VisualGame standard={selectedStandard} onComplete={handleDiagnosticComplete} />
          </motion.div>
        )}

        {/* Phase: Adaptive MCQ */}
        {phase === 'adaptive-mcq' && (
          <motion.div
            key="adaptive-mcq"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
          >
            <AdaptiveMCQ onComplete={handleDiagnosticComplete} />
          </motion.div>
        )}

        {/* Phase: Complete */}
        {phase === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 py-8 text-center"
          >
            <motion.div
              className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
            >
              <CheckCircle2 size={40} className="text-emerald-400" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white">Assessment Complete! 🎉</h2>
            <p className="text-white/50">Building your personalized learning path...</p>
            <div className="w-48 progress-bar mt-4">
              <motion.div
                className="progress-fill"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.8, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};

export default StudentDiagnostic;
