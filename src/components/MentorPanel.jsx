import { useState } from 'react';
import { mentorStudents } from '../data';

export default function MentorPanel({ showToast }) {
    const [activeTab, setActiveTab] = useState('home');
    const [taskVal, setTaskVal] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');

    const handleTaskSubmit = () => {
        if (taskVal && selectedStudent) {
            showToast('Task suggestion sent! ✅');
            setTaskVal('');
        }
    };

    return (
        <>
            <div className="topbar-nav" style={{ position: 'absolute', top: 15, left: 150, zIndex: 101 }}>
                <button className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>Dashboard</button>
                <button className={`nav-btn ${activeTab === 'progress' ? 'active' : ''}`} onClick={() => setActiveTab('progress')}>Student Progress</button>
            </div>

            {activeTab === 'home' && (
                <div className="panel active">
                    <div className="page-header">
                        <div className="page-title">Mentor Dashboard 🧑‍🏫</div>
                        <div className="page-sub">Monitor and guide your assigned students</div>
                    </div>

                    <div className="stats-row">
                        <div className="stat-card blue"><div className="stat-icon">👥</div><div className="stat-val">8</div><div className="stat-label">My Students</div></div>
                        <div className="stat-card green"><div className="stat-icon">✅</div><div className="stat-val">6</div><div className="stat-label">Active Today</div></div>
                        <div className="stat-card amber"><div className="stat-icon">⚠️</div><div className="stat-val">2</div><div className="stat-label">Need Attention</div></div>
                        <div className="stat-card pink"><div className="stat-icon">📈</div><div className="stat-val">74%</div><div className="stat-label">Avg Score</div></div>
                    </div>

                    <div className="grid-2">
                        <div className="card">
                            <div className="card-title"><span className="card-title-icon">👥</span>Assigned Students</div>
                            <div className="student-list">
                                {mentorStudents.slice(0, 5).map((s, i) => (
                                    <div key={i} className="student-item">
                                        <div className="student-av" style={{ background: `${s.color}22`, color: s.color }}>{s.avatar}</div>
                                        <div className="student-info">
                                            <div className="student-name">{s.name}</div>
                                            <div className="student-meta">{s.stage} · Score: {s.score}% · 🔥{s.streak}d</div>
                                        </div>
                                        <span className={`risk-tag risk-${s.status}`}>{s.status === 'high' ? 'At Risk' : s.status === 'med' ? 'Watch' : 'Good'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-title"><span className="card-title-icon">⚠️</span>AI Alerts</div>
                            <div className="alert-list">
                                <div className="alert-item"><div className="alert-icon">🔴</div><div><div className="alert-text"><strong>Priya M.</strong> scored 32% in Chemistry — below threshold. Immediate intervention needed.</div><div className="alert-time">Today, 9:41 AM</div></div></div>
                                <div className="alert-item warn"><div className="alert-icon">🟡</div><div><div className="alert-text"><strong>Rahul K.</strong> inactive for 4 days. Needs motivation check-in.</div><div className="alert-time">Yesterday</div></div></div>
                                <div className="alert-item warn"><div className="alert-icon">🟡</div><div><div className="alert-text"><strong>Sneha P.</strong> struggling with Organic Chemistry. Suggest additional resources.</div><div className="alert-time">2 days ago</div></div></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'progress' && (
                <div className="panel active">
                    <div className="page-header">
                        <div className="page-title">Student Progress 📈</div>
                        <div className="page-sub">Detailed performance breakdown across all subjects</div>
                    </div>

                    <div className="card mb-16">
                        <div className="card-title"><span className="card-title-icon">📊</span>Class Performance Overview</div>
                        <div className="table-wrap">
                            <table>
                                <thead><tr><th>Student</th><th>Stage</th><th>Math</th><th>Science</th><th>English</th><th>Streak</th><th>Status</th></tr></thead>
                                <tbody>
                                    {mentorStudents.map((s, i) => (
                                        <tr key={i}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div className="student-av" style={{ width: '28px', height: '28px', background: `${s.color}22`, color: s.color, fontSize: '11px' }}>{s.avatar}</div>{s.name}
                                                </div>
                                            </td>
                                            <td>{s.stage}</td>
                                            <td><span style={{ color: s.score >= 70 ? 'var(--accent2)' : s.score >= 40 ? 'var(--accent3)' : 'var(--danger)' }}>{s.score}%</span></td>
                                            <td>{Math.max(20, s.score - 5)}%</td>
                                            <td>{Math.min(99, s.score + 8)}%</td>
                                            <td>🔥 {s.streak}d</td>
                                            <td><span className={`risk-tag risk-${s.status}`}>{s.status === 'high' ? 'At Risk' : s.status === 'med' ? 'Watch' : 'Good'}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-title"><span className="card-title-icon">✍️</span>Suggest Task to Student</div>
                        <div className="suggest-input">
                            <select className="form-select" style={{ maxWidth: '200px' }} value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
                                <option value="">Select Student</option>
                                {mentorStudents.map((s, i) => <option key={i} value={s.name}>{s.name}</option>)}
                            </select>
                            <input value={taskVal} onChange={e => setTaskVal(e.target.value)} placeholder="Type task or topic to practice…" />
                            <button onClick={handleTaskSubmit}>Send</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}