import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_TEXT = 'I am having trouble connecting to my brain right now, but I am still here to help!';

function mapPage(pathname) {
  if (pathname.includes('/student/dna')) return 'learning-dna';
  if (pathname.includes('/student/career')) return 'career-logic';
  return 'dashboard';
}

export default function TaraBot() {
  const location = useLocation();
  const [fullText, setFullText] = useState('');
  const [typedText, setTypedText] = useState('');
  const [loading, setLoading] = useState(false);

  const currentPage = useMemo(() => mapPage(location.pathname), [location.pathname]);

  useEffect(() => {
    const token = localStorage.getItem('sahaayak_token') || localStorage.getItem('access_token');

    const fetchGuidance = async () => {
      if (!token) {
        setFullText(DEFAULT_TEXT);
        return;
      }

      setLoading(true);
      try {
        console.debug('TARA fetch for page:', currentPage, 'path:', location.pathname);
        const response = await fetch(
          `http://localhost:8000/student/guidance?page=${encodeURIComponent(currentPage)}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Guidance fetch failed: ${response.status}`);
        }

        const data = await response.json();
        const guidance = data?.guidance_text || data?.guidance || DEFAULT_TEXT;
        setFullText(guidance);
      } catch {
        setFullText(DEFAULT_TEXT);
      } finally {
        setLoading(false);
      }
    };

    fetchGuidance();
  }, [location.pathname, currentPage]);

  useEffect(() => {
    if (!fullText) {
      setTypedText('');
      return;
    }

    setTypedText('');
    let idx = 0;
    const timer = setInterval(() => {
      idx += 1;
      setTypedText(fullText.slice(0, idx));
      if (idx >= fullText.length) {
        clearInterval(timer);
      }
    }, 18);

    return () => clearInterval(timer);
  }, [fullText]);

  return (
    <div
      style={{
        border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: 14,
        background: 'rgba(15, 23, 42, 0.88)',
        color: '#e5e7eb',
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>🤖</span>
        <strong style={{ color: '#f8fafc' }}>TARA</strong>
      </div>
      <p style={{ marginTop: 10, color: '#cbd5e1', minHeight: 48 }}>
        {typedText}
        {loading ? <span style={{ opacity: 0.7 }}>...</span> : null}
      </p>
    </div>
  );
}
