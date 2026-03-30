import { useState } from 'react';

export default function Auth({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState('student');
    const [name, setName] = useState('');

    const handleSubmit = () => {
        const finalName = name || (role === 'student' ? 'Arjun' : role === 'mentor' ? 'Ravi' : 'Admin');
        onLogin(finalName, role);
    };

    return (
        <div className="screen auth-screen active">
            <div className="auth-bg">
                <div className="auth-bg-orb o1"></div>
                <div className="auth-bg-orb o2"></div>
            </div>
            <div className="auth-box">
                <div className="auth-logo">
                    <div className="auth-logo-icon">🌱</div>
                    <div className="auth-logo-text">TAR<span>A</span></div>
                </div>
                <div className="auth-title">{isLogin ? 'Welcome back' : 'Create account'}</div>
                <div className="auth-sub">{isLogin ? 'AI Learning Continuum Platform' : 'Join TARA to start your learning journey'}</div>

                {!isLogin && (
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input className="form-input" type="text" placeholder="Arjun Sharma" onChange={e => setName(e.target.value)} />
                    </div>
                )}

                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" placeholder="you@example.com" defaultValue={isLogin ? "user@tara.io" : ""} />
                </div>

                <div className="form-group">
                    <label className="form-label">Password</label>
                    <input className="form-input" type="password" placeholder="••••••••" defaultValue={isLogin ? "password" : ""} />
                </div>

                {isLogin ? (
                    <div className="form-group" style={{ marginBottom: '26px' }}>
                        <label className="form-label">Login as</label>
                        <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                            <option value="student">🎓 Student</option>
                            <option value="mentor">🧑‍🏫 Mentor</option>
                            <option value="ngo">🏢 NGO Admin</option>
                        </select>
                    </div>
                ) : (
                    <div className="role-grid">
                        {['student', 'mentor', 'ngo'].map(r => (
                            <div key={r} className={`role-card ${role === r ? 'active' : ''}`} onClick={() => setRole(r)}>
                                <div className="r-name">{r.toUpperCase()}</div>
                            </div>
                        ))}
                    </div>
                )}

                <button className="btn btn-primary btn-full" onClick={handleSubmit}>
                    {isLogin ? 'Sign In →' : 'Create Account →'}
                </button>

                <div className="auth-switch">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <a onClick={() => setIsLogin(!isLogin)}>{isLogin ? 'Register here' : 'Sign in'}</a>
                </div>
            </div>
        </div>
    );
}