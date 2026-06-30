'use client';
// src/components/ui/FilmShowtimesTabs.tsx
// Onglets jours pour la page film — Client Component avec menu calendrier

import React, { useState, useRef, useEffect } from 'react';
import { Film, Seance } from '@/types';
import { formatTime } from '@/utils/dateUtils';
import { downloadICS, generateGoogleCalendarUrl } from '@/utils/calendarUtils';

interface Props {
  film: Film;
  dayLabels: string[];
}

export default function FilmShowtimesTabs({ film, dayLabels }: Props) {
  const [selectedDay, setSelectedDay] = useState<string>(dayLabels[0] ?? '');

  const groupedForDay = film.seancesByDayGrouped[selectedDay] ?? {};

  return (
    <div>
      {/* Onglets de jours */}
      <div className="film-day-tabs">
        {dayLabels.map((dayLabel) => {
          const cinemas = film.seancesByDay[dayLabel] ?? {};
          const hasAvantPremiere = Object.values(cinemas).some((seances) =>
            seances.some((s) => s.format && s.format.toLowerCase().includes('première'))
          );

          return (
            <button
              key={dayLabel}
              type="button"
              className={`film-cal-btn${selectedDay === dayLabel ? ' active' : ''}${hasAvantPremiere ? ' has-notification' : ''}`}
              onClick={() => setSelectedDay(dayLabel)}
              aria-pressed={selectedDay === dayLabel}
            >
              {dayLabel}
            </button>
          );
        })}
      </div>

      {/* Séances groupées par enseigne */}
      {Object.entries(groupedForDay).map(([brand, cinemas]) => (
        <div key={brand} className="brand-section">
          <p className="brand-name">{brand}</p>
          {Object.entries(cinemas).map(([cinemaName, seances]) => (
            <div key={cinemaName}>
              <div className="seance_container" style={{ marginLeft: 0, marginRight: 0 }}>
                <div className="cinema">
                  <a
                    href="#"
                    className="cinema-link"
                    onClick={(e) => e.preventDefault()}
                  >
                    {cinemaName}
                  </a>
                </div>
                <div className="horaires_container">
                  {seances.map((seance, idx) => (
                    <SeancePillDetail
                      key={`${seance.time}-${idx}`}
                      film={film}
                      seance={seance}
                      cinema={cinemaName}
                      dayLabel={selectedDay}
                    />
                  ))}
                </div>
              </div>
              <div style={{ height: 6 }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Composant SeancePillDetail ───────────────────────────────────────────────

interface SeancePillDetailProps {
  film: Film;
  seance: Seance;
  cinema: string;
  dayLabel: string;
}

function SeancePillDetail({ film, seance, cinema, dayLabel }: SeancePillDetailProps) {
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const isAvantPremiere = seance.format && seance.format.toLowerCase().includes('première');

  // Fermer le menu si clic en dehors
  useEffect(() => {
    if (!showCalendarMenu) return;
    const onClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setShowCalendarMenu(false);
      }
    };
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, [showCalendarMenu]);

  const handleCalendarClick = (e: React.MouseEvent, type: 'apple' | 'google') => {
    e.preventDefault();
    e.stopPropagation();
    
    const eventData = {
      title: film.title,
      releaseYear: film.release_year,
      cinema: cinema,
      duree: film.duree || '2h',
      letterboxd: film.url || `https://letterboxd.com/search/${encodeURIComponent(film.title)}`,
      time: seance.time,
      lang: seance.lang,
      dayLabel: dayLabel,
      ticketUrl: seance.ticketing_url || undefined,
    };

    if (type === 'apple') {
      downloadICS(eventData);
    } else {
      const url = generateGoogleCalendarUrl(eventData);
      window.open(url, '_blank');
    }

    setShowCalendarMenu(false);
  };

  const pillClass = [
    'horaire',
    seance.ticketing_url ? 'clickable' : '',
    isAvantPremiere ? 'avant-premiere' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <div className={pillClass}>
      <div className="horaire-top">
        <span className="lang-badge">{seance.lang}</span>
        {seance.format && (
          <span className="format-badge">{seance.format.split(', ')[0]}</span>
        )}
      </div>
      <div className="horaire-bottom">
        <p className="seance-time">{formatTime(seance.time)}</p>
        
        {/* Bouton calendrier */}
        <button
          ref={btnRef}
          className="calendar-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowCalendarMenu(!showCalendarMenu);
          }}
          title="Ajouter au calendrier"
          aria-label="Ajouter au calendrier"
          style={{ position: 'relative', zIndex: 3 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="16" y1="2" x2="16" y2="6" />
          </svg>
        </button>

        {/* Menu calendrier déroulant */}
        {showCalendarMenu && (
          <div
            ref={menuRef}
            className="calendar-menu"
            style={{
              top: '52px',
              left: '0px',
            }}
          >
            <button
              type="button"
              className="calendar-menu-option"
              onClick={(e) => handleCalendarClick(e, 'apple')}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ marginRight: 6 }}>
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              Apple Calendar
            </button>
            <button
              type="button"
              className="calendar-menu-option"
              onClick={(e) => handleCalendarClick(e, 'google')}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" style={{ marginRight: 6 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google Calendar
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (seance.ticketing_url) {
    return (
      <a
        href={seance.ticketing_url}
        target="_blank"
        rel="noopener noreferrer"
        className="horaire-link"
        aria-label={`Réserver ${seance.time} ${seance.lang}${seance.format ? ' ' + seance.format : ''}`}
        style={{ position: 'relative' }}
      >
        {content}
      </a>
    );
  }

  return <div style={{ position: 'relative' }}>{content}</div>;
}
