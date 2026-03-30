import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Dna, 
  Map, 
  BarChart, 
  Users, 
  AlertTriangle, 
  ShieldCheck, 
  LogOut,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { TaraSidebar } from '@/components/TaraSidebar';

export const Sidebar: React.FC = () => {
  const { user, logout } = useUser();
  const location = useLocation();
  const [taraOpen, setTaraOpen] = useState(false);

  if (!user) return null;

  const std = parseInt(user.standard || '1', 10);

  // Build the link items dynamically based on role
  type NavItem = { name: string; path: string; icon: React.ReactNode };
  let navItems: NavItem[] = [];

  if (user.role === 'Student') {
    navItems.push({ name: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={20} /> });
    navItems.push({ name: 'Learning DNA', path: '/student/dna', icon: <Dna size={20} /> });
    if (std >= 8) {
      navItems.push({ name: 'Career Tracker', path: '/student/career', icon: <Map size={20} /> });
    }
  } else if (user.role === 'Mentor') {
    navItems.push({ name: 'Dashboard', path: '/mentor/dashboard', icon: <LayoutDashboard size={20} /> });
    navItems.push({ name: 'Student Progress', path: '/mentor/progress', icon: <BarChart size={20} /> });
  } else if (user.role === 'NGO') {
    navItems.push({ name: 'Overview', path: '/ngo/overview', icon: <LayoutDashboard size={20} /> });
    navItems.push({ name: 'At-Risk Watch', path: '/ngo/at-risk', icon: <AlertTriangle size={20} /> });
    navItems.push({ name: 'Mentor Network', path: '/ngo/mentors', icon: <Users size={20} /> });
  }

  // Profile icon/badge color mapping
  const roleColors = {
    Student: 'from-blue-500 to-indigo-500',
    Mentor: 'from-emerald-500 to-teal-500',
    NGO: 'from-violet-500 to-purple-500',
  };
  const roleGradient = user.role ? (roleColors[user.role] ?? 'from-slate-500 to-slate-400') : 'from-slate-500 to-slate-400';

  // Detect if current page has a known TARA context
  const TARA_PAGES: Record<string, { label: string; color: string }> = {
    '/student/career':  { label: 'Counselor Mode', color: '#f59e0b' },
    '/student/dna':     { label: 'Coach Mode', color: '#8b5cf6' },
    '/student/dashboard': { label: 'Study Mode', color: '#3b82f6' },
    '/ngo/at-risk':     { label: 'Analyst Mode', color: '#ef4444' },
    '/ngo/overview':    { label: 'Executive Mode', color: '#3b82f6' },
    '/ngo/mentors':     { label: 'HR Mode', color: '#8b5cf6' },
    '/mentor/progress': { label: 'Teacher Mode', color: '#10b981' },
    '/mentor/dashboard':{ label: 'Coach Mode', color: '#10b981' },
  };
  const taraContext = TARA_PAGES[location.pathname];

  return (
    <>
      <div className="w-64 h-full bg-slate-900 border-r border-white/10 flex flex-col pt-6 relative shadow-2xl z-40">
        
        {/* Brand */}
        <div className="px-6 mb-10 text-white font-extrabold text-2xl tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <span className="text-white text-lg leading-none">S</span>
          </div>
          Sahaayak
        </div>

        {/* Profile summary */}
        <div className="px-6 mb-8 pt-2">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleGradient} p-[2px]`}>
              <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center font-bold text-white text-sm">
                {user.name.charAt(0)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">{user.name}</p>
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider truncate flex items-center gap-1">
                {user.role} {user.role === 'Mentor' && user.isVerified && <ShieldCheck size={10} className="text-emerald-400" />}
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 text-xs font-bold text-white/30 uppercase tracking-widest mb-3 ml-2">Navigation</div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`
                  relative flex items-center justify-between px-3 py-3 rounded-xl font-medium transition-all group overflow-hidden
                  ${isActive ? 'text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}
                `}
              >
                <div className="flex items-center gap-3 relative z-10">
                  <div className={`transition-colors ${isActive ? 'text-brand-400' : 'text-white/40 group-hover:text-white/70'}`}>
                    {item.icon}
                  </div>
                  {item.name}
                </div>
                
                <ChevronRight 
                  size={16} 
                  className={`transition-all ${isActive ? 'text-brand-400 opacity-100' : 'text-white/20 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`} 
                />

                {/* Active Background Pill */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 bg-brand-500/10 border border-brand-500/20 rounded-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* TARA Assistant Button */}
        <div className="px-4 pb-3">
          <button
            onClick={() => setTaraOpen(true)}
            className="w-full group relative overflow-hidden"
          >
            <div className={`
              relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
              ${taraContext
                ? 'border-white/20 bg-white/5 hover:bg-white/[0.08]'
                : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
              }
            `}>
              {/* Glow orb */}
              <div className="relative flex-shrink-0">
                <div
                  className="absolute inset-0 rounded-full blur-md opacity-60 animate-pulse"
                  style={{ backgroundColor: taraContext?.color ?? '#3b82f6' }}
                />
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-base relative z-10 border"
                  style={{
                    backgroundColor: `${taraContext?.color ?? '#3b82f6'}20`,
                    borderColor: `${taraContext?.color ?? '#3b82f6'}30`
                  }}
                >
                  <Sparkles size={16} style={{ color: taraContext?.color ?? '#3b82f6' }} />
                </div>
              </div>

              <div className="flex-1 min-w-0 text-left">
                <p className="text-white font-bold text-sm">Ask TARA</p>
                <p className="text-white/40 text-[10px] truncate">
                  {taraContext?.label ?? 'AI Assistant'}
                </p>
              </div>

              <ChevronRight size={14} className="text-white/20 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </div>
          </button>
        </div>

        {/* User Actions / Footer */}
        <div className="p-4 border-t border-white/10 mt-auto bg-slate-950/30">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white/50 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all group font-medium"
          >
            <LogOut size={18} className="group-hover:text-red-400 transition-colors" />
            <span className="group-hover:text-red-400 transition-colors">Sign Out</span>
          </button>
        </div>
      </div>

      {/* TARA Chat Sidebar */}
      <TaraSidebar isOpen={taraOpen} onClose={() => setTaraOpen(false)} />
    </>
  );
};
