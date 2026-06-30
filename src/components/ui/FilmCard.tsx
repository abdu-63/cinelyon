'use client';
// src/components/ui/FilmCard.tsx
// Carte film — portage fidèle avec synopsis interactif, bande-annonce et menu calendrier

import React, { useState, memo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Film, Seance, DateLabel } from '@/types';
import { formatDayLabel, formatTime, getDeltaForDate } from '@/utils/dateUtils';
import { isPastSeance } from '@/utils/showtimes';
import { downloadICS, generateGoogleCalendarUrl } from '@/utils/calendarUtils';
import { decodeHtmlEntities } from '@/utils/textUtils';

interface FilmCardProps {
  film: Film;
  isFavorite: boolean;
  onToggleFavorite: (filmId: string) => void;
  dates: DateLabel[];
  friendsWhoFavorited?: string[];
  hidePastShowtimes?: boolean;
}

export const FilmCard = memo(function FilmCard({
  film,
  isFavorite,
  onToggleFavorite,
  dates,
  friendsWhoFavorited = [],
  hidePastShowtimes = true,
}: FilmCardProps) {
  const dayLabels = Object.keys(film.seancesByDay);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(true);
  const synopsisRef = useRef<HTMLDivElement>(null);

  const hasSynopsis = film.synopsis && film.synopsis !== 'Synopsis non disponible';

  useEffect(() => {
    if (!hasSynopsis) return;

    const checkOverflow = () => {
      const el = synopsisRef.current;
      if (el) {
        setIsOverflowing(el.scrollHeight > 110);
      }
    };

    const frameId = requestAnimationFrame(checkOverflow);
    window.addEventListener('resize', checkOverflow);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [film.synopsis, hasSynopsis]);

  const ratingDisplay =
    film.rating !== 'Note inconnue' ? film.rating.replace('/5', '') : null;

  const selectedDayLabel = selectedDayIdx !== null ? (dayLabels[selectedDayIdx] ?? null) : null;
  const seancesForDay: Record<string, Seance[]> = selectedDayLabel
    ? (film.seancesByDay[selectedDayLabel] ?? {})
    : {};

  const selectedIsoDate = selectedDayLabel
    ? (() => {
        const dObj = dates.find((d) => formatDayLabel(d) === selectedDayLabel);
        return dObj ? dObj.isoDate : '';
      })()
    : '';

  return (
    <div className="film-block">
      {/* ── .container_infoFilm du site : card glassmorphism ── */}
      <div
        className={`container_infoFilm${film.isNew ? ' film-new' : ''}`}
        style={{ marginLeft: undefined, marginRight: undefined }}
        data-title={film.title.toLowerCase()}
        data-genres={(film.genres || '').toLowerCase()}
        data-director={(film.director || '').toLowerCase()}
        data-film-id={film.filmId}
      >
        {/* Lien de navigation transparent sur la card */}
        <Link
          href={`/film/${film.slug}`}
          className="film-card-link"
          aria-label={`Voir les séances de ${film.title}`}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
          }}
        />

        <div className="blur-background" />

        {/* .affiche */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={film.affiche || '/images/nocontent.png'}
          className="affiche"
          loading="lazy"
          decoding="async"
          width={200}
          height={288}
          alt={`Affiche de ${film.title}`}
          style={{ viewTransitionName: `poster-${film.slug}` }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/nocontent.png';
          }}
        />

        {film.isNew && <span className="new-badge">NOUVEAU</span>}

        {/* .infoFilm */}
        <div className="infoFilm">
          <h3 className="titreFilm">
            <span>
              {film.title}
              {film.release_year !== 'inconnue' && (
                <span className="release_year"> ({film.release_year})</span>
              )}
            </span>
            {/* Bouton favori — z-index supérieur au lien de la card */}
            <button
              className={`favorite-btn${isFavorite ? ' active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(film.filmId);
              }}
              aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              style={{ position: 'relative', zIndex: 2 }}
            >
              <svg className="favorite-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>
          </h3>

          <div className="info-content">
            {/* Badge d'amis qui aiment ce film */}
            {friendsWhoFavorited.length > 0 && (
              <div className="friend-badge" style={{ position: 'relative', zIndex: 2 }}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style={{ marginRight: 4, color: '#ff6b6b' }}>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                Favori de {friendsWhoFavorited.join(', ')}
              </div>
            )}

            {film.director && film.director !== 'Inconnu' && (
              <p className="realisateur">Réalisateur : {film.director}</p>
            )}
            {film.genres && <p className="genre">Genre : {film.genres}</p>}
            {film.duree && <p className="duree">Durée : {film.duree}</p>}
            {ratingDisplay && <p className="rating">Note : {ratingDisplay}</p>}

            {/* Providers streaming */}
            {film.watch_providers && film.watch_providers.length > 0 && (
              <div className="providers-row">
                {film.watch_providers.slice(0, 4).map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={p.name}
                    src={p.logo_path ?? ''}
                    className="provider-logo"
                    alt={p.name}
                    width={22}
                    height={22}
                  />
                ))}
              </div>
            )}

            {/* Synopsis + Actions (Fidélité Desktop) */}
            {hasSynopsis && (
              <div className="synopsis_container" style={{ position: 'relative', zIndex: 2 }}>
                <div
                  ref={synopsisRef}
                  className={`synopsis${isSynopsisExpanded ? ' expanded' : ''}${!isOverflowing ? ' no-gradient' : ''}`}
                >
                  <p>{decodeHtmlEntities(film.synopsis)}</p>
                </div>
                <div className="synopsis-actions">
                  {isOverflowing && (
                    <button
                      className="synopsis-toggle"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsSynopsisExpanded(!isSynopsisExpanded);
                      }}
                    >
                      {isSynopsisExpanded ? 'Lire moins' : 'Lire plus'}
                    </button>
                  )}
                  
                  {film.trailer_url && (
                    <a
                      href={film.trailer_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="trailer-btn"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Bande-annonce
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chevron */}
        <svg
          className="chevron-nav"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>

      <div className="film-spacer" />

      {/* ── .seances-wrapper : mini-calendar + séances ── */}
      {dayLabels.length > 0 && (
        <div className="seances-wrapper">
          <div className="mini-calendar">
            {dayLabels.map((dayLabel, idx) => {
              const cinemas = film.seancesByDay[dayLabel] ?? {};
              const hasAvantPremiere = Object.values(cinemas).some((seances) =>
                seances.some(
                  (s) => s.format && s.format.toLowerCase().includes('première')
                )
              );
              const isActive = selectedDayIdx === idx;

              return (
                <button
                  key={dayLabel}
                  className={`mini-cal-btn${isActive ? ' active' : ''}${hasAvantPremiere ? ' has-notification' : ''}`}
                  type="button"
                  onClick={() => setSelectedDayIdx(isActive ? null : idx)}
                  aria-pressed={isActive}
                >
                  {dayLabel}
                </button>
              );
            })}
          </div>

          {/* Séances du jour sélectionné */}
          {selectedDayLabel && (
            <DaySeances
              film={film}
              cinemas={seancesForDay}
              isoDate={selectedIsoDate}
              dayLabel={selectedDayLabel}
              hidePastShowtimes={hidePastShowtimes}
            />
          )}
        </div>
      )}

      <div className="responsive-div" />
    </div>
  );
});

// ── Composant DaySeances ─────────────────────────────────────────────────────

interface DaySeancesProps {
  film: Film;
  cinemas: Record<string, Seance[]>;
  isoDate: string;
  dayLabel: string;
  hidePastShowtimes: boolean;
}

function DaySeances({ film, cinemas, isoDate, dayLabel, hidePastShowtimes }: DaySeancesProps) {
  const isToday = getDeltaForDate(isoDate) === 0;

  return (
    <div className="day-seances show">
      {Object.entries(cinemas).map(([cinemaName, seances]) => {
        const visibleSeances = isToday && hidePastShowtimes
          ? seances.filter((s) => !isPastSeance(s.time))
          : seances;

        if (!visibleSeances.length) return null;

        return (
          <div key={cinemaName}>
            <div className="seance_container" style={{ position: 'relative' }}>
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
                {visibleSeances.map((seance, idx) => (
                  <SeancePillWithCalendar
                    key={`${seance.time}-${idx}`}
                    film={film}
                    seance={seance}
                    cinema={cinemaName}
                    dayLabel={dayLabel}
                  />
                ))}
              </div>
            </div>
            <div style={{ height: 5 }} />
          </div>
        );
      })}
    </div>
  );
}

// ── Composant SeancePillWithCalendar ─────────────────────────────────────────

interface SeancePillWithCalendarProps {
  film: Film;
  seance: Seance;
  cinema: string;
  dayLabel: string;
}

function SeancePillWithCalendar({ film, seance, cinema, dayLabel }: SeancePillWithCalendarProps) {
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
