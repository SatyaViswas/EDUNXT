import { useState } from 'react';
import { riskHighStudents, riskInactiveStudents } from '../data';

export default function NgoPanel() {
    const [activeTab, setActiveTab] = useState('home');
    const barChartVals = [62, 78, 55, 90, 84, 72, 95, 88];

    return (
        <>
            <div className="topbar-nav" style={{ position: 'absolute', top: 15, left: 150, zIndex: 101 }}>
                <button className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>Overview</button>
                <button className={`nav-btn ${activeTab === 'risk' ? 'active' : ''}`} onClick={() => setActiveTab('risk')}>At-Risk Students</button>
                <button className={`nav-btn ${activeTab === 'mentors' ? 'active' : ''}`} onClick={() => setActiveTab('mentors')}>Mentors</button>
            </div>

            {activeTab === 'home' && (
                <div className="panel active">
                    <div className="page-header">
                        <div className="page-title">NGO Dashboard 🏢</div>
                        <div className="page-sub">Platform-wide analytics and impact monitoring</div>
                    </div>

                    <div className="stats-row">
                        <div className="stat-card blue"><div className="stat-icon">🎓</div><div className="stat-val">248</div><div className="stat-label">Total Students</div></div>
                        <div className="stat-card green"><div className="stat-icon">🟢</div><div className="stat-val">179</div><div className="stat-label">Active (7d)</div></div>
                        <div className="stat-card amber"><div className="stat-icon">🧑‍🏫</div><div className="stat-val">22</div><div className="stat-label">Mentors</div></div>
                        <div className="stat-card pink"><div className="stat-icon">⚠️</div><div className="stat-val">18</div><div className="stat-label">At Risk</div></div>
                    </div>

                    <div className="analytics-row">
                        <div className="card">
                            <div className="card-title"><span className="card-title-icon">📊</span>Weekly Activity (last 8 weeks)</div>
                            <div className="chart-placeholder">
                                {barChartVals.map((val, idx) => (
                                    <div key={idx} className="chart-bar" style={{ height: `${val}%` }}></div>
                                ))}
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-title"><span className="card-title-icon">🍩</span>Student Stages</div>
                            <div className="donut-wrap">
                                <div className="donut"></div>
                                <div className="donut-legend">
                                    <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--accent2)' }}></div>Higher (68%)</div>
                                    <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--accent3)' }}></div>Intermediate (17%)</div>
                                    <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--danger)' }}></div>UG (15%)</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-title"><span className="card-title-icon">🏆</span>Top Performing Students</div>
                        <div className="table-wrap">
                            <table>
                                <thead><tr><th>Rank</th><th>Student</th><th>Stage</th><th>Score</th><th>Streak</th><th>Mentor</th></tr></thead>
                                <tbody>
                                    <tr><td>🥇 1</td><td>Ananya R.</td><td>Intermediate</td><td><span style={{ color: 'var(--accent2)' }}>96%</span></td><td>🔥 21d</td><td>Dr. Meera S.</td></tr>
                                    <tr><td>🥈 2</td><td>Vikram P.</td><td>Higher</td><td><span style={{ color: 'var(--accent2)' }}>94%</span></td><td>🔥 18d</td><td>Mr. Ravi K.</td></tr>
                                    <tr><td>🥉 3</td><td>Arjun S.</td><td>Higher</td><td><span style={{ color: 'var(--accent)' }}>82%</span></td><td>🔥 7d</td><td>Mr. Ravi K.</td></tr>
                                    <tr><td>4</td><td>Pooja M.</td><td>UG</td><td><span style={{ color: 'var(--accent)' }}>79%</span></td><td>🔥 5d</td><td>Dr. Meera S.</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'risk' && (
                <div className="panel active">
                    <div className="page-header">
                        <div className="page-title">At-Risk Students ⚠️</div>
                        <div className="page-sub">AI-detected students who need immediate intervention</div>
                    </div>

                    <div className="grid-2 mb-16">
                        <div className="card">
                            <div className="card-title" style={{ color: 'var(--danger)' }}>🔴 High Risk (Score &lt; 40%)</div>
                            <div className="student-list">
                                {riskHighStudents.map((s, i) => (
                                    <div key={i} className="student-item">
                                        <div className="student-av" style={{ background: `${s.color}22`, color: s.color }}>{s.avatar}</div>
                                        <div className="student-info">
                                            <div className="student-name">{s.name}</div>
                                            <div className="student-meta">{s.stage} · Score: <span style={{ color: 'var(--danger)' }}>{s.score}%</span></div>
                                        </div>
                                        <span className="risk-tag risk-high">High Risk</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-title" style={{ color: 'var(--accent3)' }}>🟡 Inactive (&gt; 3 days)</div>
                            <div className="student-list">
                                {riskInactiveStudents.map((s, i) => (
                                    <div key={i} className="student-item">
                                        <div className="student-av" style={{ background: `${s.color}22`, color: s.color }}>{s.avatar}</div>
                                        <div className="student-info">
                                            <div className="student-name">{s.name}</div>
                                            <div className="student-meta">{s.stage} · Last: {s.lastActive}</div>
                                        </div>
                                        <span className="risk-tag risk-med">Inactive</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-title"><span className="card-title-icon">📋</span>All At-Risk Students</div>
                        <div className="table-wrap">
                            <table>
                                <thead><tr><th>Student</th><th>Stage</th><th>Score</th><th>Last Active</th><th>Risk Reason</th><th>Assigned Mentor</th></tr></thead>
                                <tbody>
                                    {[...riskHighStudents, ...riskInactiveStudents].map((s, i) => (
                                        <tr key={i}>
                                            <td>{s.name}</td>
                                            <td>{s.stage}</td>
                                            <td><span style={{ color: s.score < 40 ? 'var(--danger)' : 'var(--accent3)' }}>{s.score}%</span></td>
                                            <td>{s.lastActive}</td>
                                            <td><span className={`risk-tag ${s.score < 40 ? 'risk-high' : 'risk-med'}`}>{s.reason}</span></td>
                                            <td>{s.mentor}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'mentors' && (
                <div className="panel active">
                    <div className="page-header">
                        <div className="page-title">Mentors Overview 🧑‍🏫</div>
                        <div className="page-sub">All registered mentors and their student assignments</div>
                    </div>
                    <div className="card">
                        <div className="table-wrap">
                            <table>
                                <thead><tr><th>Mentor</th><th>Specialization</th><th>Students</th><th>Avg Student Score</th><th>Active This Week</th></tr></thead>
                                <tbody>
                                    <tr><td>Dr. Meera Sharma</td><td>Science</td><td>12</td><td><span style={{ color: 'var(--accent2)' }}>88%</span></td><td><span className="risk-tag risk-ok">Active</span></td></tr>
                                    <tr><td>Mr. Ravi Kumar</td><td>Mathematics</td><td>10</td><td><span style={{ color: 'var(--accent2)' }}>85%</span></td><td><span className="risk-tag risk-ok">Active</span></td></tr>
                                    <tr><td>Ms. Pritha Das</td><td>English</td><td>8</td><td><span style={{ color: 'var(--accent)' }}>76%</span></td><td><span className="risk-tag risk-ok">Active</span></td></tr>
                                    <tr><td>Mr. Suresh Nair</td><td>Social Studies</td><td>7</td><td><span style={{ color: 'var(--accent3)' }}>61%</span></td><td><span className="risk-tag risk-med">Low</span></td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}