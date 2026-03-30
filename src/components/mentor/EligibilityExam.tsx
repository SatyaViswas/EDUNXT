import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle2, AlertCircle, RefreshCw, ClipboardList } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import Button from '@/components/ui/Button';

interface ExamQuestion {
  id: number;
  type: 'technical' | 'pedagogy';
  question: string;
  options: string[];
  correct: number;
}

const EXAM_QUESTIONS: ExamQuestion[] = [
  // 80% Technical (4 questions)
  {
    id: 1, type: 'technical',
    question: 'Evaluate the integral of f(x) = 3x² over [0, 2].',
    options: ['8', '12', '16', '6'],
    correct: 0 // x^3 -> 8
  },
  {
    id: 2, type: 'technical',
    question: 'Solve for x: log₂(x-1) + log₂(x+1) = 3',
    options: ['x = 3', 'x = 4', 'x = ±3', 'x = 2'],
    correct: 0 // log2(x^2 - 1) = 3 -> x^2 - 1 = 8 -> x^2 = 9 -> x = 3
  },
  {
    id: 3, type: 'technical',
    question: 'What is the sum of the infinite geometric series 1 + 1/2 + 1/4 + 1/8 + ...?',
    options: ['1.5', 'Infinity', '2', '2.5'],
    correct: 2
  },
  {
    id: 4, type: 'technical',
    question: 'In a triangle ABC, if a=3, b=4, c=5, what is the value of sin(C)?',
    options: ['0.6', '0.8', '1.0', '0.75'],
    correct: 2 // C is 90 deg -> sin(90) = 1
  },
  // 20% Pedagogy (1 question)
  {
    id: 5, type: 'pedagogy',
    question: 'A student consistently makes sign errors in algebra. Your first intervention is:',
    options: [
      'Give them 50 practice problems on signs.',
      'Ask them to explain their thought process on a specific mistaken problem out loud.',
      'Tell them to pay more attention in class.',
      'Skip the topic and move to geometry.'
    ],
    correct: 1
  }
];

const EligibilityExam: React.FC = () => {
  const { updateUser } = useUser();
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const totalAnswered = Object.keys(answers).length;
  const isComplete = totalAnswered === EXAM_QUESTIONS.length;
  const score = EXAM_QUESTIONS.reduce((acc, q) => acc + (answers[q.id] === q.correct ? 1 : 0), 0);
  const passed = score >= 4; // 80% passing mark

  const handleStart = () => {
    setStarted(true);
  };

  const handleSelect = (qId: number, optIdx: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (passed) {
      setTimeout(() => {
        updateUser({ isVerified: true });
      }, 3000);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      {/* Heavy Blur Backdrop mapping to the parent container */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" />

      <motion.div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/80"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur px-6 py-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-tight">Dashboard Locked</h2>
            <p className="text-white/40 text-sm">Pass the 80/20 Eligibility Exam to unlock</p>
          </div>
        </div>

        <div className="p-6">
          {!started ? (
            <div className="py-8 text-center flex flex-col items-center">
              <ClipboardList size={48} className="text-white/20 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Sahaayak Mentor Vetting</h3>
              <p className="text-white/50 text-sm max-w-md mx-auto mb-8">
                To ensure quality education, all mentors must complete a short vetting exam. 
                <br /><br />
                <strong className="text-white/70">Format:</strong> 80% Technical Subject, 20% Pedagogy.<br />
                <strong className="text-white/70">Requirement:</strong> 4/5 correct to pass.
              </p>
              <Button size="lg" onClick={handleStart} rightIcon={<CheckCircle2 size={18} />}>
                Begin Exam
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {EXAM_QUESTIONS.map((q, i) => (
                <div key={q.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-white/40 font-mono text-sm">Q{i + 1}.</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                      q.type === 'technical' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {q.type}
                    </span>
                  </div>
                  <p className="text-white font-medium mb-4">{q.question}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = answers[q.id] === optIdx;
                      let btnClass = isSelected 
                        ? 'bg-brand-600/20 border-brand-500 text-white' 
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20';

                      if (submitted) {
                        const isCorrectOpt = q.correct === optIdx;
                        if (isCorrectOpt) {
                          btnClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-300';
                        } else if (isSelected && !isCorrectOpt) {
                          btnClass = 'bg-red-500/20 border-red-500 text-red-300 opacity-70';
                        } else {
                          btnClass = 'bg-white/5 border-white/5 text-white/30 cursor-not-allowed';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={submitted}
                          onClick={() => handleSelect(q.id, optIdx)}
                          className={`
                            text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium
                            ${btnClass}
                          `}
                        >
                          <span className="text-white/30 mr-2 font-mono text-xs">{String.fromCharCode(65 + optIdx)}.</span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Submission Area */}
              <div className="pt-6 border-t border-white/10 flex flex-col items-center gap-4">
                {!submitted ? (
                  <Button 
                    size="lg" 
                    fullWidth 
                    disabled={!isComplete} 
                    onClick={handleSubmit}
                  >
                    Submit Exam
                  </Button>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`w-full p-6 rounded-2xl border flex flex-col items-center text-center ${
                      passed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    {passed ? (
                      <>
                        <CheckCircle2 size={40} className="text-emerald-400 mb-3" />
                        <h3 className="text-xl font-bold text-white mb-1">Exam Passed! ({score}/5)</h3>
                        <p className="text-emerald-400/80 text-sm">Dashboard unlocking...</p>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={40} className="text-red-400 mb-3" />
                        <h3 className="text-xl font-bold text-white mb-1">Exam Failed ({score}/5)</h3>
                        <p className="text-red-400/80 text-sm mb-4">You need 4/5 to pass. Review your mistakes and try again.</p>
                        <Button variant="danger" onClick={handleRetry} leftIcon={<RefreshCw size={16} />}>
                          Retake Exam
                        </Button>
                      </>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default EligibilityExam;
