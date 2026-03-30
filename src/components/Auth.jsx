import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8000';

const ROLE_OPTIONS = [
  { label: 'Student', value: 'Student' },
  { label: 'Mentor', value: 'Mentor' },
  { label: 'NGO', value: 'NGO' },
];

const ROLE_REDIRECTS = {
  STUDENT: '/student',
  MENTOR: '/mentor',
  NGO: '/ngo',
  Student: '/student',
  Mentor: '/mentor',
};

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const url = mode === 'signup' ? `${API_BASE}/auth/register` : `${API_BASE}/auth/login`;

      const payload =
        mode === 'signup'
          ? {
              email,
              password,
              role,
              full_name: email.split('@')[0] || 'User',
              ...(role === 'Student' ? { standard: 8 } : {}),
            }
          : {
              email,
              password,
            };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Invalid Credentials');
          return;
        }
        if (response.status === 400) {
          setError('User Already Exists');
          return;
        }
        const fallbackError = await response.json().catch(() => ({}));
        setError(fallbackError.detail || 'Authentication failed');
        return;
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('sahaayak_token', data.access_token);

      const redirectTo = ROLE_REDIRECTS[data.role] || '/ngo';
      navigate(redirectTo, { replace: true });
    } catch (e) {
      setError('Unable to connect to server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: 'radial-gradient(circle at 20% 20%, #1f2937 0%, #0b1020 45%, #05070f 100%)',
      padding: '24px'
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'rgba(17, 24, 39, 0.88)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
          color: '#f3f4f6'
        }}
      >
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p style={{ marginTop: 8, color: '#9ca3af' }}>
          Sign in to access your Sahaayak dashboard.
        </p>

        <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#d1d5db' }}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
              placeholder="name@example.com"
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#d1d5db' }}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
              placeholder="••••••••"
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#d1d5db' }}>Role</span>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {error ? (
            <div style={{
              background: 'rgba(127, 29, 29, 0.45)',
              border: '1px solid rgba(248, 113, 113, 0.5)',
              color: '#fecaca',
              padding: '10px 12px',
              borderRadius: 10,
              fontSize: 13,
            }}>
              {error}
            </div>
          ) : null}

          <button type="submit" disabled={isSubmitting} style={submitStyle}>
            {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </div>

        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 14, color: '#9ca3af' }}>
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => setMode((m) => (m === 'login' ? 'signup' : 'login'))}
            style={{ color: '#93c5fd', background: 'transparent', border: 0, cursor: 'pointer' }}
          >
            {mode === 'login' ? 'Sign Up' : 'Login'}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(3, 7, 18, 0.7)',
  color: '#f9fafb',
  padding: '10px 12px',
  outline: 'none',
};

const submitStyle = {
  borderRadius: 10,
  border: '1px solid rgba(96, 165, 250, 0.65)',
  background: 'linear-gradient(90deg, #2563eb 0%, #0891b2 100%)',
  color: '#ffffff',
  fontWeight: 700,
  padding: '10px 14px',
  cursor: 'pointer',
};
