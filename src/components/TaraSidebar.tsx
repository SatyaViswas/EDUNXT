import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import {
  X, Sparkles, Send,  BookOpen,
  Brain, GraduationCap, TrendingDown, Compass,
  ChevronRight, Lightbulb
} from 'lucide-react';

/* ─── Context Configuration ─── */

type TaraPersona = {
  name: string;
  role: string;
  avatar: string;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  greeting: string;
  suggestions: string[];
  icon: React.ReactNode;
};

const TARA_CONTEXTS: Record<string, TaraPersona> = {
  '/student/career': {
    name: 'TARA',
    role: 'Career Counselor',
    avatar: '🎓',
    accentColor: '#f59e0b',
    gradientFrom: 'from-saffron-600/20',
    gradientTo: 'to-amber-600/20',
    greeting: "Hi! I'm TARA, your Career Counselor. Based on your Learning DNA showing strong Logical and Pattern Recognition scores, I think you'd really thrive in an analytical field. Shall we explore your top-matched streams?",
    icon: <Compass size={16} />,
    suggestions: [
      "Based on my DNA, which stream suits me?",
      "What does MPC lead to?",
      "How do I prepare for JEE?",
      "Compare MPC vs BiPC for me",
    ],
  },
  '/student/dna': {
    name: 'TARA',
    role: 'Cognitive Coach',
    avatar: '🧬',
    accentColor: '#8b5cf6',
    gradientFrom: 'from-violet-600/20',
    gradientTo: 'to-indigo-600/20',
    greeting: "Hello! I'm analyzing your Learning DNA right now. Your Creative Thinking score of 90% is exceptional — you're a natural synthesizer. Let me show you how to leverage this for faster learning.",
    icon: <Brain size={16} />,
    suggestions: [
      "How can I improve my Verbal score?",
      "What activities boost Memory Processing?",
      "Explain my Pattern Recognition strength",
      "Design a 7-day improvement plan for me",
    ],
  },
  '/student/dashboard': {
    name: 'TARA',
    role: 'Study Companion',
    avatar: '🌟',
    accentColor: '#3b82f6',
    gradientFrom: 'from-blue-600/20',
    gradientTo: 'to-brand-600/20',
    greeting: "Hey! Ready for today's missions? You're on a 12-day streak — let's keep it going! I can help you prioritize tasks or give you a quick challenge to earn bonus XP.",
    icon: <Sparkles size={16} />,
    suggestions: [
      "What should I focus on today?",
      "Give me a quick 5-min challenge",
      "Explain today's math topic simply",
      "How do I improve my streak?",
    ],
  },
  '/ngo/at-risk': {
    name: 'TARA',
    role: 'Risk Analyst',
    avatar: '📊',
    accentColor: '#ef4444',
    gradientFrom: 'from-red-600/20',
    gradientTo: 'to-orange-600/20',
    greeting: "I've analyzed the at-risk data. Critical alert: there's a 20% dropout spike in Cluster B driven by mentor attendance issues. I recommend triggering immediate check-ins with mentors currently assigned there.",
    icon: <TrendingDown size={16} />,
    suggestions: [
      "Show me the dropout hotspots by center",
      "Which mentors have the poorest retention?",
      "Draft a mentor intervention message",
      "What caused the spike in Class 6 drop-offs?",
    ],
  },
  '/ngo/overview': {
    name: 'TARA',
    role: 'Executive Analyst',
    avatar: '🏢',
    accentColor: '#3b82f6',
    gradientFrom: 'from-brand-600/20',
    gradientTo: 'to-violet-600/20',
    greeting: "Good morning, Director. This quarter's value-added growth is tracking at +40 ALL across all three centers. Center C is outperforming projections by 12%. Shall I generate a donor impact briefing?",
    icon: <Sparkles size={16} />,
    suggestions: [
      "Generate a donor impact summary",
      "Compare the 3 centers' performance",
      "Which subject needs more resources?",
      "Predict next quarter's growth rate",
    ],
  },
  '/ngo/mentors': {
    name: 'TARA',
    role: 'HR Intelligence',
    avatar: '🛡️',
    accentColor: '#8b5cf6',
    gradientFrom: 'from-violet-600/20',
    gradientTo: 'to-purple-600/20',
    greeting: "There are 2 mentor applications pending review. My vetting analysis suggests approving Rohit Sharma — his pedagogy quiz scores indicate strong empathy alignment (78%). Sunita Rao needs a secondary review on subject depth.",
    icon: <GraduationCap size={16} />,
    suggestions: [
      "Analyze pending mentor applications",
      "Who has the highest MIS score?",
      "Which mentors need retraining?",
      "Show me mentor-to-student ratio gaps",
    ],
  },
  '/mentor/progress': {
    name: 'TARA',
    role: "Teacher's Assistant",
    avatar: '📚',
    accentColor: '#10b981',
    gradientFrom: 'from-emerald-600/20',
    gradientTo: 'to-teal-600/20',
    greeting: "Here's a quick briefing: 3 students in your Class 8 batch are struggling with Fractions. I've generated a 20-minute remedial lesson plan using visual aids and manipulatives specifically for your Foundational batch.",
    icon: <BookOpen size={16} />,
    suggestions: [
      "Give me a lesson plan for Fractions",
      "Which students need 1:1 attention?",
      "Suggest an activity for visual learners",
      "How do I explain Algebra intuitively?",
    ],
  },
  '/mentor/dashboard': {
    name: 'TARA',
    role: 'Mentor Coach',
    avatar: '🎯',
    accentColor: '#10b981',
    gradientFrom: 'from-emerald-600/20',
    gradientTo: 'to-teal-600/20',
    greeting: "Good session day! Your Class 8 batch has an upcoming session. Based on last week's results, I suggest opening with a 5-min 'Algebraic Expression Recap' before jumping into new content.",
    icon: <Lightbulb size={16} />,
    suggestions: [
      "Prepare me for today's session",
      "What topics need more time?",
      "Give me a hook activity for Class 8",
      "How can I improve the batch's ALL score?",
    ],
  },
};

const DEFAULT_PERSONA: TaraPersona = {
  name: 'TARA',
  role: 'AI Assistant',
  avatar: '🤖',
  accentColor: '#3b82f6',
  gradientFrom: 'from-brand-600/20',
  gradientTo: 'to-violet-600/20',
  greeting: "Hi! I'm TARA, your Sahaayak AI Assistant. Navigate to a specific section and I'll adapt my expertise to help you there.",
  icon: <Sparkles size={16} />,
  suggestions: [
    "What can you help me with?",
    "Tell me about Sahaayak",
  ],
};

const TARA_FALLBACK_MESSAGE = 'I am having trouble connecting to my brain right now, but I am still here to help!';

const AI_RESPONSES: Record<string, string> = {
  "Based on my DNA, which stream suits me?":
    "Based on your Learning DNA, MPC (Math, Physics, Chemistry) is your best fit with a **94% match**. Your Logical Reasoning (85%) and Pattern Recognition (88%) scores are in the top percentile for IIT aspirants. I'd also suggest exploring Computer Science as a specialization.",
  "What does MPC lead to?":
    "MPC opens doors to: **Engineering (JEE/BITSAT)**, **Data Science**, **Aerospace**, and **Pure Mathematics**. The IITs, NITs, and BITS Pilani are top institutions. Want me to generate a 2-year preparation roadmap?",
  "Show me the dropout hotspots by center":
    "**Cluster B** has the highest dropout rate at 23%, primarily in Class 6-7. The root cause analysis points to mentor attendance falling below 80% in 3 of 5 sessions this month. Triggering mentor check-in alerts is the recommended immediate action.",
  "Give me a lesson plan for Fractions":
    "**20-min Remedial Plan for Fractions (Visual Learners):**\n\n• **0-5 min**: Pizza/pie chart analogy — draw and shade fractions on board\n• **5-12 min**: Manipulative exercise — students fold paper to represent 1/2, 1/4, 3/4\n• **12-18 min**: Partner quiz — each student creates 2 fraction problems for their neighbor\n• **18-20 min**: Exit ticket — name one fraction equivalent to 2/4\n\nThis approach has shown 35% better retention for visual learners.",
  "Which students need 1:1 attention?":
    "Based on the Mastery Log data, **Rahul Sharma** (ALL: 42) needs immediate 1:1 support in Algebra Basics and Geometry. **Arjun Singh** (ALL: 65) is showing gaps in Geometry. I'd recommend 10-min check-ins at the start of your next 2 sessions.",
};

const getAIResponse = (question: string, persona: TaraPersona): string => {
  const exactMatch = AI_RESPONSES[question];
  if (exactMatch) return exactMatch;
  return `Great question! As your ${persona.role}, I'm analyzing your context. Based on the current data patterns and your profile, the key insight here is: **${question.toLowerCase().includes('how') ? 'consistent practice over 7 days shows 3x improvement in similar cohorts' : 'focus on your top-strength area first, then bridge the gaps systematically'}**. Would you like me to dig deeper into this?`;
};

/* ─── Message Types ─── */

interface Message {
  id: string;
  role: 'user' | 'tara';
  content: string;
  timestamp: Date;
}

/* ─── The Component ─── */

interface TaraSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TaraSidebar: React.FC<TaraSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Resolve persona based on route
  const persona = TARA_CONTEXTS[location.pathname] ?? DEFAULT_PERSONA;

  const getGuidancePage = (path: string) => {
    if (path.includes('/student/dna')) return 'learning-dna';
    if (path.includes('/student/career')) return 'career-logic';
    if (path.includes('/student')) return 'dashboard';
    if (path.includes('/mentor/progress')) return 'update-progress';
    if (path.includes('/mentor')) return 'dashboard';
    if (path.includes('/ngo/at-risk')) return 'at-risk';
    if (path.includes('/ngo/mentors')) return 'pending-mentors';
    if (path.includes('/ngo')) return 'dashboard';
    return 'dashboard';
  };

  const getGuidanceEndpoint = (path: string) => {
    if (path.includes('/mentor')) return 'http://localhost:8000/mentor/guidance';
    if (path.includes('/ngo')) return 'http://localhost:8000/ngo/guidance';
    return 'http://localhost:8000/student/guidance';
  };

  // Reset conversation when route changes
  useEffect(() => {
    if (!isOpen) return;

    const speakMessage = (text: string) => {
      setIsTyping(true);
      setTimeout(() => {
        setMessages([{
          id: 'greeting',
          role: 'tara',
          content: text,
          timestamp: new Date(),
        }]);
        setIsTyping(false);
      }, 900);
    };

    const setDefaultGreeting = () => {
      setMessages([{
        id: 'greeting',
        role: 'tara',
        content: persona.greeting,
        timestamp: new Date(),
      }]);
    };

    const loadGuidance = async () => {
      const token = localStorage.getItem('sahaayak_token') || localStorage.getItem('access_token');
      if (!token) {
        setDefaultGreeting();
        return;
      }

      const currentPage = getGuidancePage(location.pathname);
      const endpoint = getGuidanceEndpoint(location.pathname);

      try {
        const response = await fetch(
          `${endpoint}?page=${encodeURIComponent(currentPage)}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Guidance API failed with status ${response.status}`);
        }

        const guidance = await response.json() as {
          guidance_title: string;
          guidance_text: string;
          key_actions: string[];
        };

        const responseText = guidance?.guidance_text || persona.greeting;
        speakMessage(responseText);
      } catch {
        speakMessage(TARA_FALLBACK_MESSAGE);
      }
    };

    setInput('');
    loadGuidance();
  }, [isOpen, location.pathname, user?.role, user?.token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('sahaayak_token') || localStorage.getItem('access_token');
      const currentPage = getGuidancePage(location.pathname);

      let answer = '';
      if (token && location.pathname.includes('/student')) {
        const response = await fetch('http://localhost:8000/student/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question: text,
            page: currentPage,
          }),
        });

        if (!response.ok) {
          throw new Error(`Student ask API failed with status ${response.status}`);
        }

        const data = await response.json() as { answer?: string };
        answer = data.answer || '';
      } else {
        answer = getAIResponse(text, persona);
      }

      const taraMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'tara',
        content: answer || TARA_FALLBACK_MESSAGE,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, taraMsg]);
    } catch {
      const taraMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'tara',
        content: TARA_FALLBACK_MESSAGE,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, taraMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatContent = (text: string) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split('**').map((part, j) =>
          j % 2 === 1
            ? <strong key={j} className="font-bold text-white">{part}</strong>
            : part
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[45]"
          />

          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-[360px] bg-slate-900 border-l border-white/10 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className={`p-4 border-b border-white/10 bg-gradient-to-r ${persona.gradientFrom} ${persona.gradientTo} relative`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg border-2"
                    style={{ borderColor: `${persona.accentColor}40`, backgroundColor: `${persona.accentColor}20` }}
                  >
                    {persona.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-extrabold text-base">{persona.name}</h3>
                      <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: persona.accentColor }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span style={{ color: persona.accentColor }} className="opacity-80">{persona.icon}</span>
                      <p className="text-white/50 text-xs font-semibold">{persona.role}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Context badge */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Context:</span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                  style={{ backgroundColor: `${persona.accentColor}15`, borderColor: `${persona.accentColor}30`, color: persona.accentColor }}
                >
                  {location.pathname.replace('/', '').replace('/', ' › ').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5
                      ${msg.role === 'tara'
                        ? 'bg-slate-700 border border-white/10'
                        : 'bg-gradient-to-br from-brand-500 to-violet-500'
                      }`}
                    >
                      {msg.role === 'tara' ? persona.avatar : (user?.name?.charAt(0) ?? 'U')}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                        ${msg.role === 'tara'
                          ? 'bg-slate-800 border border-white/5 text-white/80 rounded-tl-sm'
                          : 'text-white rounded-tr-sm'
                        }`}
                      style={msg.role === 'user' ? { backgroundColor: `${persona.accentColor}25`, borderColor: `${persona.accentColor}30`, border: '1px solid' } : {}}
                    >
                      {formatContent(msg.content)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-700 border border-white/10 text-sm flex-shrink-0">
                    {persona.avatar}
                  </div>
                  <div className="bg-slate-800 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: persona.accentColor }}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            {messages.length < 3 && (
              <div className="px-4 pb-2">
                <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider mb-2">Suggested Questions</p>
                <div className="flex flex-col gap-1.5">
                  {persona.suggestions.slice(0, 3).map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-left text-xs px-3 py-2 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.07] text-white/60 hover:text-white/90 transition-all flex items-center justify-between group"
                    >
                      <span>{s}</span>
                      <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-slate-950/50">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                  placeholder={`Ask ${persona.name}...`}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none transition-colors"
                  style={{ borderColor: input ? `${persona.accentColor}40` : '' }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isTyping}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                  style={{ backgroundColor: `${persona.accentColor}25`, color: persona.accentColor }}
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-center text-white/20 text-[10px] mt-2">Powered by TARA · Sahaayak AI</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TaraSidebar;
