'use client';
// src/components/layout/Header.tsx
// En-tête de la page avec logo, navigation et bouton thème (icônes SVG uniquement)

import Link from 'next/link';
import { useCallback, useState, useEffect } from 'react';

export default function Header() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = document.documentElement;
    const current = root.getAttribute('data-theme') as 'light' | 'dark' || 'light';
    setTheme(current);
  }, []);

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    setTheme(next);
    try {
      localStorage.setItem('cinelyon-theme', next);
    } catch (e) { /* ignore */ }
  }, []);

  return (
    <header>
      <div className="header-inner">
        <Link href="/" className="header-logo" id="headerTop">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/icon-192x192-rond.png"
            alt="CinéLyon logo"
            className="logo-img"
            width={36}
            height={36}
          />
          <span className="logo-title">CinéLyon</span>
        </Link>

        <nav className="header-nav">
          <Link href="/suggestions" className="film-action-btn" style={{ padding: '8px 14px', fontSize: 13 }}>
            Suggestions
          </Link>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-settings'))}
            className="film-action-btn"
            style={{
              padding: '8px 14px',
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              background: 'var(--card-solid)',
            }}
            type="button"
            aria-label="Réglages et synchronisation"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Réglages
          </button>
          <button
            className="theme-btn"
            onClick={toggleTheme}
            aria-label="Changer le thème"
            title="Changer le thème clair / sombre"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {theme === 'dark' ? (
              // Icône Soleil pour passer au thème clair
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              // Icône Lune pour passer au thème sombre
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
