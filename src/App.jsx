import React, { useState } from 'react';
import Auth from './components/Auth';
import StudentPanel from './components/StudentPanel';
import MentorPanel from './components/MentorPanel';
import NgoPanel from './components/NgoPanel';
import TaraBot from './components/TaraBot';

export default function App() {
    const [user, setUser] = useState(null); // { name, role }
    const [toast, setToast] = useState(null);

    const handleLogin = (name, role) => setUser({ name, role });
    const handleLogout = () => setUser(null);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 2800);
    };

    if (!user) return <Auth onLogin={handleLogin} />;

    const renderPanel = () => {
        if (user.role === 'student') return <StudentPanel user={user} showToast={showToast} />;
        if (user.role === 'mentor') return <MentorPanel showToast={showToast} />;
        if (user.role === 'ngo') return <NgoPanel />;
    };

    return (
        <div className="screen app-screen active">
            <div className="topbar">
                <div className="topbar-logo">
                    <span style={{ fontSize: '20px' }}>🌱</span> TARA
                    <div className="topbar-logo-dot"></div>
                </div>
                <div className="topbar-right">
                    <div className="user-chip">
                        <div className="user-avatar" style={{ background: 'linear-gradient(135deg,#4f8cff,#6ee7b7)' }}>
                            {user.name[0].toUpperCase()}
                        </div>
                        <div>
                            <div className="user-name">{user.name}</div>
                            <div className={`role-badge role-${user.role}`}>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </div>
                        </div>
                    </div>
                    <button className="btn-ghost" onClick={handleLogout}>Logout</button>
                </div>
            </div>

            <div className="main-content">
                {renderPanel()}
            </div>

            <TaraBot />

            {toast && (
                <div id="toast" style={{ display: 'flex' }}>
                    ✅ <span>{toast}</span>
                </div>
            )}
        </div>
    );
}