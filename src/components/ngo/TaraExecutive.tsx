import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, FileText, Download, TrendingUp, Users, Presentation, Target, Target as TargetIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const mockImpactData = [
  { month: 'Jul', value: 45 },
  { month: 'Aug', value: 48 },
  { month: 'Sep', value: 54 },
  { month: 'Oct', value: 65 },
  { month: 'Nov', value: 78 },
  { month: 'Dec', value: 85 },
];

const ChartTip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="text-white/50">{label}</p>
        <p className="text-emerald-400 font-bold">ALL: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const TaraExecutive: React.FC<Props> = ({ isOpen, onClose }) => {
  const [reportOpen, setReportOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setReportOpen(true);
      onClose();
    }, 2000);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-80 bg-slate-900 border-l border-white/10 shadow-2xl z-40 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-lg">🤖</div>
                <h3 className="text-white font-bold">TARA Executive</h3>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div>
                <p className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-3">AI Highlights</p>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-emerald-300 text-sm">📈 +22% average growth in Math across Tier-2 cities this quarter.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-amber-300 text-sm">⚠️ Mentor attrition is up 4%. Suggest initiating appreciation week.</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-3">Actions</p>
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full flex flex-col items-center gap-3 p-5 rounded-2xl bg-gradient-to-br from-brand-600/20 to-violet-600/20 border border-brand-500/30 hover:border-brand-500/60 transition-colors text-left relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-brand-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {isGenerating ? (
                    <>
                      <Sparkles size={24} className="text-brand-400 animate-pulse" />
                      <p className="text-brand-300 font-bold text-center">Synthesizing Data...</p>
                    </>
                  ) : (
                    <>
                      <FileText size={24} className="text-brand-400 group-hover:scale-110 transition-transform" />
                      <div className="text-center">
                        <p className="text-white font-bold">Generate Donor Report</p>
                        <p className="text-white/40 text-xs mt-1">One-click Q3 Impact PDF</p>
                      </div>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-30"
          />
        )}
      </AnimatePresence>

      {/* Generated Report Modal */}
      <Modal 
        isOpen={reportOpen} 
        onClose={() => setReportOpen(false)} 
        size="full" 
        title={
          <div className="flex items-center gap-2">
            <Presentation className="text-brand-400" /> Executive Impact Report: Q3 2025
          </div>
        }
      >
        <div className="bg-white rounded-xl text-slate-900 p-8 md:p-12 max-w-4xl mx-auto shadow-2xl printable-area overflow-y-auto h-[70vh]">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-200 pb-6 mb-8">
            <div>
              <h1 className="text-4xl font-black text-slate-900 mb-2">Quarterly Impact Report</h1>
              <p className="text-slate-500 text-lg">Prepared by TARA AI for Sahaayak Board</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-brand-600">October 2025</p>
              <p className="text-slate-500 text-sm">Target: Global Education Fund</p>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-6 mb-12">
            {[
              { label: 'Total Active Beneficiaries', val: '14,250', icon: <Users size={20} className="text-brand-500" /> },
              { label: 'Avg Value-Added Growth (ALL)', val: '+62%', icon: <TrendingUp size={20} className="text-emerald-500" /> },
              { label: 'Verified Mentors Deployed', val: '1,120', icon: <TargetIcon size={20} className="text-violet-500" /> },
            ].map(stat => (
              <div key={stat.label} className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-white shadow-sm">{stat.icon}</div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                </div>
                <p className="text-3xl font-black text-slate-800">{stat.val}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            {/* Chart Area */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <TrendingUp className="text-emerald-500" /> Trajectory: Value-Added Growth
              </h2>
              <div className="h-64 rounded-xl border border-slate-200 p-4 bg-white">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockImpactData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={30} />
                    <Tooltip content={<ChartTip />} />
                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-slate-500 mt-4 leading-relaxed">
                The baseline Average Learning Level (ALL) at inception was 45. Through structured pedagogy and targeted mentoring, the nationwide cohort has bridged foundational gaps, reaching an ALL of 85.
              </p>
            </div>

            {/* AI Synthesized Insights */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Sparkles className="text-brand-500" /> Executive Synthesis
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-emerald-600 flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4" /> Key Wins
                  </h3>
                  <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm">
                    <li>Implementation of the 80/20 Vetting Logic increased mentor retention by 18%.</li>
                    <li>Session-in-a-Box reduced session prep time to under 5 minutes, boosting overall session frequency.</li>
                    <li>Mathematics mastery in Class 8 grew by 42% over 3 months.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-amber-600 flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" /> Current Roadblocks
                  </h3>
                  <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm">
                    <li>High deficit of Science Mentors in Southern regions.</li>
                    <li>Class 11 Science drop-off rates are triggering "Stagnant DNA" warnings in 12% of the demographic.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-brand-600 flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4" /> Next Quarter Action Plan
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    We require a $250k funding injection to digitize 400 new rural centers and aggressively recruit BiPC (Biology/Phy/Chem) specialized mentors.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-4 mt-8 pt-8 border-t border-slate-200">
            <Button variant="ghost" onClick={() => setReportOpen(false)}>Close Preview</Button>
            <Button variant="primary" leftIcon={<Download size={16} />}>Export PDF</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// Fallback icons specifically needed above
const CheckCircle = ({ className }: { className?: string }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const AlertTriangle = ({ className }: { className?: string }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

export default TaraExecutive;
