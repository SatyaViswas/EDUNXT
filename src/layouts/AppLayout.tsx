import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-white">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 w-full h-full overflow-y-auto relative bg-slate-950">
        <Outlet />
      </div>
    </div>
  );
};
