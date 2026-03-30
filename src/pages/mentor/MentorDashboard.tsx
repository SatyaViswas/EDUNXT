import React from 'react';
import MentorPanel from '@/components/MentorPanel';

const MentorDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-white">Mentor Dashboard</h1>
          <p className="mt-1 text-sm text-white/60">Live batches, assignments, student issues, and roadmap planning.</p>
        </div>
        <MentorPanel />
      </div>
    </div>
  );
};

export default MentorDashboard;
