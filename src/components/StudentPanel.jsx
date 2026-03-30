import { useState } from 'react';
import { mcqsData, careers } from '../data';

export default function StudentPanel({ user, showToast }) {
    const [activeTab, setActiveTab] = useState('home');
    const [mcqs, setMcqs] = useState(mcqsData.map(q => ({ ...q, selected: null, submitted: false })));

    const handleMcqSelect = (qIndex, optIndex) => {
        if (mcqs[qIndex].submitted) return;
        const newMcqs = [...mcqs];
        newMcqs[qIndex].selected = optIndex;
        setMcqs(newMcqs);
    };

    const submitMcq = (qIndex) => {
        if (mcqs[qIndex].submitted || mcqs[qIndex].selected === null) return;
        const newMcqs = [...mcqs];
        newMcqs[qIndex].submitted = true;
        setMcqs(newMcqs);
        if (newMcqs[qIndex].selected === newMcqs[qIndex].correct) {
            showToast('Correct! +10 points added 🎉');
        }
    };

    return (
        <>
            <div className="topbar-nav" style={{ position: 'absolute', top: 15, left: 150, zIndex: 101 }}>
                <button className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>Dashboard</button>
                <button className={`nav-btn ${activeTab === 'dna' ? 'active' : ''}`} onClick={() => setActiveTab('dna')}>Learning DNA</button>
                <button className={`nav-btn ${activeTab === 'career' ? 'active' : ''}`} onClick={() => setActiveTab('career')}>Career</button>
            </div>

            {activeTab === 'home' && (
                <div className="panel active">
                    <div className="page-header">
                        <div className="page-title">Good morning, <span>{user.name}</span> 👋</div>
                        <div className="page-sub">You're on a 7-day streak! Keep it up.</div>
                    </div>

                    <div className="stats-row">
                        <div className="stat-card blue"><div className="stat-icon">🔥</div><div className="stat-val">7</div><div className="stat-label">Day Streak</div></div>
                        <div className="stat-card green"><div className="stat-icon">⭐</div><div className="stat-val">82%</div><div className="stat-label">Avg Score</div></div>
                        <div className="stat-card amber"><div className="stat-icon">✅</div><div className="stat-val">24</div><div className="stat-label">Tasks Done</div></div>
                        <div className="stat-card pink"><div className="stat-icon">🏆</div><div className="stat-val">#3</div><div className="stat-label">Leaderboard</div></div>
                    </div>

                    <div className="grid-2 mb-16">
                        <div className="card">
                            <div className="card-title"><span className="card-title-icon">📅</span>Weekly Streak</div>
                            <div className="streak-row">
                                <div className="streak-day done">M</div>
                                <div className="streak-day done">T</div>
                                <div className="streak-day done">W</div>
                                <div className="streak-day done">T</div>
                                <div className="streak-day done">F</div>
                                <div className="streak-day today">S</div>
                                <div className="streak-day empty">S</div>
                            </div>
                            <div style={{ marginTop: '14px', fontSize: '13px', color: 'var(--text2)' }}>Complete today's tasks to extend your streak!</div>
                        </div>
                        <div className="card">
                            <div className="card-title"><span className="card-title-icon">📊</span>Subject Progress</div>
                            <div className="prog-row"><div className="prog-label"><span>Mathematics</span><span>88%</span></div><div className="prog-bar-wrap"><div className="prog-bar" style={{ width: '88%', background: 'linear-gradient(90deg,#4f8cff,#6ee7b7)' }}></div></div></div>
                            <div className="prog-row"><div className="prog-label"><span>Physics</span><span>72%</span></div><div className="prog-bar-wrap"><div className="prog-bar" style={{ width: '72%', background: 'linear-gradient(90deg,#f59e0b,#f472b6)' }}></div></div></div>
                            <div className="prog-row"><div className="prog-label"><span>Chemistry</span><span>55%</span></div><div className="prog-bar-wrap"><div className="prog-bar" style={{ width: '55%', background: 'linear-gradient(90deg,#f87171,#f59e0b)' }}></div></div></div>
                            <div className="prog-row"><div className="prog-label"><span>English</span><span>91%</span></div><div className="prog-bar-wrap"><div className="prog-bar" style={{ width: '91%', background: 'linear-gradient(90deg,#6ee7b7,#4f8cff)' }}></div></div></div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-title"><span className="card-title-icon">🎯</span>Today's Tasks</div>
                        {mcqs.map((q, i) => (
                            <div key={i} className="mcq-card">
                                <div className="mcq-header">
                                    <div className="mcq-num">{i + 1}</div>
                                    <div className="mcq-q">{q.q}</div>
                                </div>
                                <div className="mcq-options">
                                    {q.opts.map((opt, j) => {
                                        let className = "mcq-opt";
                                        if (q.submitted) {
                                            if (j === q.correct) className += " correct";
                                            else if (j === q.selected) className += " wrong";
                                        } else if (q.selected === j) {
                                            className += " selected";
                                        }
                                        return (
                                            <div key={j} className={className} onClick={() => handleMcqSelect(i, j)}>
                                                {opt}
                                            </div>
                                        );
                                    })}
                                </div>
                                {!q.submitted ? (
                                    <div className="mcq-submit">
                                        <button className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '13px' }} onClick={() => submitMcq(i)}>Submit Answer</button>
                                    </div>
                                ) : (
                                    <div className="mcq-submit">
                                        <span style={{ fontSize: '13px', color: q.selected === q.correct ? 'var(--accent2)' : 'var(--danger)' }}>
                                            {q.selected === q.correct ? '✅ Correct! +10 pts' : '❌ Incorrect'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'dna' && (
                <div className="panel active">
                    <div className="page-header">
                        <div className="page-title">Your Learning DNA 🧬</div>
                        <div className="page-sub">AI-powered analysis of your academic strengths and areas to improve</div>
                    </div>
                    <div className="grid-2 mb-16">
                        <div className="card">
                            <div className="card-title"><span className="card-title-icon">💪</span>Strengths</div>
                            <div className="dna-grid">
                                <div className="dna-item strong"><div className="dna-item-label">Mathematics</div><div className="dna-item-val" style={{ color: 'var(--accent2)' }}>Expert</div></div>
                                <div className="dna-item strong"><div className="dna-item-label">English</div><div className="dna-item-val" style={{ color: 'var(--accent2)' }}>Advanced</div></div>
                                <div className="dna-item strong"><div className="dna-item-label">Logical Reasoning</div><div className="dna-item-val" style={{ color: 'var(--accent2)' }}>Strong</div></div>
                                <div className="dna-item strong"><div className="dna-item-label">Problem Solving</div><div className="dna-item-val" style={{ color: 'var(--accent2)' }}>Strong</div></div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-title"><span className="card-title-icon">🎯</span>Areas to Improve</div>
                            <div className="dna-grid">
                                <div className="dna-item weak"><div className="dna-item-label">Chemistry</div><div className="dna-item-val" style={{ color: 'var(--danger)' }}>Needs Work</div></div>
                                <div className="dna-item weak"><div className="dna-item-label">Organic Chem</div><div className="dna-item-val" style={{ color: 'var(--danger)' }}>Weak</div></div>
                                <div className="dna-item weak"><div className="dna-item-label">Current Affairs</div><div className="dna-item-val" style={{ color: 'var(--accent3)' }}>Average</div></div>
                                <div className="dna-item weak"><div className="dna-item-label">Essay Writing</div><div className="dna-item-val" style={{ color: 'var(--accent3)' }}>Average</div></div>
                            </div>
                        </div>
                    </div>
                    <div className="card mb-16">
                        <div className="card-title"><span className="card-title-icon">💡</span>AI Recommendations</div>
                        <div className="alert-list">
                            <div className="alert-item warn">
                                <div className="alert-icon">📚</div>
                                <div><div className="alert-text">Focus on Organic Chemistry — your score dropped 12% this week. Practice daily MCQs on reaction mechanisms.</div><div className="alert-time">Suggested by TARA AI</div></div>
                            </div>
                            <div className="alert-item warn">
                                <div className="alert-icon">📰</div>
                                <div><div className="alert-text">Read one current affairs article daily. Enable daily news digest in notifications.</div><div className="alert-time">Suggested by TARA AI</div></div>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-title"><span className="card-title-icon">🎖️</span>Badges Earned</div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ background: 'var(--bg3)', borderRadius: '10px', padding: '12px 16px', textAlign: 'center' }}><div style={{ fontSize: '28px' }}>🔥</div><div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px' }}>7-Day Streak</div></div>
                            <div style={{ background: 'var(--bg3)', borderRadius: '10px', padding: '12px 16px', textAlign: 'center' }}><div style={{ fontSize: '28px' }}>🥇</div><div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px' }}>Math Master</div></div>
                            <div style={{ background: 'var(--bg3)', borderRadius: '10px', padding: '12px 16px', textAlign: 'center' }}><div style={{ fontSize: '28px' }}>⚡</div><div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px' }}>Fast Learner</div></div>
                            <div style={{ background: 'var(--bg3)', borderRadius: '10px', padding: '12px 16px', textAlign: 'center', opacity: 0.4 }}><div style={{ fontSize: '28px' }}>🏆</div><div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px' }}>Top Ranker</div></div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'career' && (
                <div className="panel active">
                    <div className="page-header">
                        <div className="page-title">Career Exploration 🚀</div>
                        <div className="page-sub">Discover career paths based on your Learning DNA</div>
                    </div>
                    <div className="career-grid">
                        {careers.map(c => (
                            <div key={c.id} className="career-card" onClick={() => alert(c.info)}>
                                <div className="career-icon">{c.icon}</div>
                                <div className="career-name">{c.name}</div>
                                <div className="career-desc">{c.desc}</div>
                                {c.bestMatch && (
                                    <div style={{ marginTop: '8px', fontSize: '11px', background: 'rgba(79,140,255,0.12)', color: 'var(--accent)', padding: '3px 8px', borderRadius: '20px', display: 'inline-block' }}>
                                        ⭐ Best Match
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}