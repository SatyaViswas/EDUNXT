import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser, Role } from './context/UserContext';
import LoginPage from './pages/auth/LoginPage';
import StudentDashboard from './pages/student/StudentDashboard';
import MentorDashboard from './pages/mentor/MentorDashboard';
import NgoDashboard from './pages/ngo/NgoDashboard';
import { AppLayout } from './layouts/AppLayout';
import LearningDNA from './pages/student/LearningDNA';
import CareerTracker from './pages/student/CareerTracker';
import StudentProgress from './pages/mentor/StudentProgress';
import AtRiskPage from './pages/ngo/AtRiskPage';
import MentorNetwork from './pages/ngo/MentorNetwork';

/* ─── Stub Component for specific routes ─── */
const StubView = ({ title }: { title: string }) => (
  <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8 text-center text-white">
    <div className="text-6xl mb-6">🚧</div>
    <h1 className="text-3xl font-bold mb-3">{title} Module</h1>
    <p className="text-white/40 max-w-md">This view is currently under construction. Please check the Dashboard for active features.</p>
  </div>
);

/* ─── Smart Role-Based Redirect ─── */
const RoleRedirect: React.FC = () => {
  const { user } = useUser();
  if (!user) return <Navigate to="/auth/login" replace />;
  if (user.role === 'Student') return <Navigate to="/student/dashboard" replace />;
  if (user.role === 'Mentor') return <Navigate to="/mentor/dashboard" replace />;
  if (user.role === 'NGO') return <Navigate to="/ngo/overview" replace />;
  return <Navigate to="/auth/login" replace />;
};

/* ─── Loading Spinner ─── */
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-white/40 text-sm">Loading Sahaayak...</p>
    </div>
  </div>
);

/* ─── Route Protection Wrapper ─── */
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useUser();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (allowedRoles && (!user.role || !allowedRoles.includes(user.role))) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
};

/* ─── Public Only (redirect authenticated users) ─── */
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useUser();
  if (isLoading) return <LoadingScreen />;
  if (user) return <RoleRedirect />;
  return <>{children}</>;
};

/* ─── App ─── */
function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          {/* Auth */}
          <Route path="/auth/login" element={
            <PublicRoute><LoginPage /></PublicRoute>
          } />

          {/* Protected Routes inside AppLayout (Sidebar + Main) */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            
            {/* Student Routes */}
            <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['Student']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/dna" element={<ProtectedRoute allowedRoles={['Student']}><LearningDNA /></ProtectedRoute>} />
            <Route path="/student/career" element={<ProtectedRoute allowedRoles={['Student']}><CareerTracker /></ProtectedRoute>} />
            <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />

            {/* Mentor Routes */}
            <Route path="/mentor/dashboard" element={<ProtectedRoute allowedRoles={['Mentor']}><MentorDashboard /></ProtectedRoute>} />
            <Route path="/mentor/progress" element={<ProtectedRoute allowedRoles={['Mentor']}><StudentProgress /></ProtectedRoute>} />
            <Route path="/mentor" element={<Navigate to="/mentor/dashboard" replace />} />

            {/* NGO Routes */}
            <Route path="/ngo/overview" element={<ProtectedRoute allowedRoles={['NGO']}><NgoDashboard /></ProtectedRoute>} />
            <Route path="/ngo/at-risk" element={<ProtectedRoute allowedRoles={['NGO']}><AtRiskPage /></ProtectedRoute>} />
            <Route path="/ngo/mentors" element={<ProtectedRoute allowedRoles={['NGO']}><MentorNetwork /></ProtectedRoute>} />
            <Route path="/ngo" element={<Navigate to="/ngo/overview" replace />} />
          </Route>

          {/* Fallbacks */}
          <Route path="/unauthorized" element={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white/50">
              🚫 You don't have access to this area.
            </div>
          } />
          <Route path="/" element={<RoleRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
