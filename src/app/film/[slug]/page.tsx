// src/app/film/[slug]/page.tsx
// Page détail d'un film — Server Component Next.js (sans aucun émoji)

import { supabase } from '@/lib/supabase';
import { buildFilmList } from '@/utils/showtimes';
import { FilmRaw, Film } from '@/types';
import { getTodayIso, formatDayLabel } from '@/utils/dateUtils';
import { optimizePosterUrl, toYoutubeEmbedUrl } from '@/utils/imageUtils';
import { decodeHtmlEntities } from '@/utils/textUtils';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import FilmShowtimesTabs from '@/components/ui/FilmShowtimesTabs';

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

async function fetchFilm(slug: string): Promise<{ film: Film | null; allFilms: Film[] }> {
  const today = getTodayIso();
  const { data, error } = await supabase
    .from('showtimes')
    .select('date, movies')
    .gte('date', today)
    .order('date');

  if (error || !data) return { film: null, allFilms: [] };

  const rows = data as { date: string; movies: FilmRaw[] }[];
  const { films } = buildFilmList(rows, null);
  const film = films.find((f) => f.slug === slug) ?? null;
  return { film, allFilms: films };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { film } = await fetchFilm(slug);
  if (!film) return { title: 'Film introuvable' };

  return {
    title: `${film.title} (${film.release_year}) — CinéLyon`,
    description: `Séances de ${film.title} à Lyon. ${film.synopsis?.slice(0, 150) ?? ''}`,
    openGraph: {
      title: `${film.title} — CinéLyon`,
      description: film.synopsis?.slice(0, 200) ?? '',
      images: film.affiche ? [optimizePosterUrl(film.affiche, 500)] : [],
    },
  };
}

function renderStars(rating: number) {
  return (
    <div style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          width="13"
          height="13"
          fill={i < Math.round(rating) ? '#ffb800' : 'none'}
          stroke="#ffb800"
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default async function FilmDetailPage({ params }: Props) {
  const { slug } = await params;
  const { film } = await fetchFilm(slug);

  if (!film) {
    notFound();
  }

  const posterUrl = optimizePosterUrl(film.affiche, 300);
  const backdropUrl = film.backdrop ?? null;
  const trailerEmbedUrl = film.trailer_url ? toYoutubeEmbedUrl(film.trailer_url) : null;
  const dayLabels = Object.keys(film.seancesByDayGrouped);
  const ratingDisplay = film.rating !== 'Note inconnue' ? film.rating : null;

  return (
    <div className="film-detail" style={{ paddingBottom: 60 }}>
      {/* ── Breadcrumb ── */}
      <nav aria-label="Fil d'Ariane" style={{ padding: '16px 0 0', fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Link href="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Accueil</Link>
        <span style={{ fontSize: 10, color: 'var(--text-light)' }}>
          <svg viewBox="0 0 24 24" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
        <span>{film.title}</span>
      </nav>

      {/* ── Hero backdrop ── */}
      {(backdropUrl || posterUrl) && (
        <div
          style={{
            width: '100%',
            height: 260,
            borderRadius: 16,
            overflow: 'hidden',
            marginTop: 16,
            position: 'relative',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backdropUrl ?? posterUrl}
            alt={`Backdrop ${film.title}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
            loading="eager"
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, transparent 50%, var(--bg-main) 100%)',
            }}
          />
        </div>
      )}

      {/* ── Hero info ── */}
      <div className="film-hero" style={{ marginTop: backdropUrl ? 0 : 32 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterUrl || '/images/nocontent.png'}
          alt={`Affiche de ${film.title}`}
          className="film-hero-poster"
          style={{ viewTransitionName: `poster-${film.slug}`, width: 160 }}
        />

        <div className="film-hero-info">
          <h1 className="film-title">
            {film.title}
            {film.release_year !== 'inconnue' && (
              <span className="film-year"> ({film.release_year})</span>
            )}
          </h1>

          <div className="film-meta">
            {film.director && film.director !== 'Inconnu' && (
              <p>
                <strong>Réalisateur</strong> : {film.director}
              </p>
            )}
            {film.genres && (
              <p>
                <strong>Genre</strong> : {film.genres}
              </p>
            )}
            {film.duree && (
              <p>
                <strong>Durée</strong> : {film.duree}
              </p>
            )}
          </div>

          <div className="film-scores" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {ratingDisplay && (
              <span className="score-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="#ffb800" stroke="#ffb800" strokeWidth="1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                AlloCiné {ratingDisplay}
              </span>
            )}
            {film.tmdb_score !== null && (
              <span className="score-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h1v2H6V4zm0 4h1v2H6V8zm0 8h1v2H6v-2zm12 4H8v-2h1v-2H8v-2h1v-2H8V8h1V6H8V4h10v16zm0-14h-1v2h1V6zm0 4h-1v2h1v-2zm0 8h-1v2h1v-2z" />
                </svg>
                TMDB {film.tmdb_score}/10
              </span>
            )}
            {film.rt_score && (
              <span className="score-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="#ff4d4d">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1z" fill="#00cc66" />
                </svg>
                {film.rt_score}
              </span>
            )}
          </div>

          {/* Providers streaming */}
          {film.watch_providers && film.watch_providers.length > 0 && (
            <div className="providers-row" style={{ marginTop: 12 }}>
              {film.watch_providers.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                p.logo_path ? <img
                  key={p.name}
                  src={p.logo_path}
                  alt={p.name}
                  className="provider-logo"
                  width={28}
                  height={28}
                  style={{ width: 28, height: 28, borderRadius: 6 }}
                /> : null
              ))}
            </div>
          )}

          <div className="film-actions">
            {film.url && (
              <a href={film.url} target="_blank" rel="noopener noreferrer" className="film-action-btn">
                Letterboxd
              </a>
            )}
            {film.allocine_url && (
              <a href={film.allocine_url} target="_blank" rel="noopener noreferrer" className="film-action-btn">
                AlloCiné
              </a>
            )}
            {film.trailer_url && (
              <a href={film.trailer_url} target="_blank" rel="noopener noreferrer" className="film-action-btn primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Bande-annonce
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Synopsis ── */}
      {film.synopsis && film.synopsis !== 'Synopsis non disponible' && (
        <>
          <h2 className="film-section-title">Synopsis</h2>
          <p className="film-synopsis">{decodeHtmlEntities(film.synopsis)}</p>
        </>
      )}

      {/* ── Trailer embed ── */}
      {trailerEmbedUrl && (
        <>
          <h2 className="film-section-title">Bande-annonce</h2>
          <div className="trailer-container">
            <iframe
              className="trailer-iframe"
              src={trailerEmbedUrl}
              title={`Bande-annonce de ${film.title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </>
      )}

      {/* ── Séances ── */}
      {dayLabels.length > 0 && (
        <>
          <h2 className="film-section-title">Séances</h2>
          <FilmShowtimesTabs film={film} dayLabels={dayLabels} />
        </>
      )}

      {/* ── Critiques ── */}
      {film.reviews && film.reviews.length > 0 && (
        <>
          <h2 className="film-section-title">Critiques spectateurs</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {film.reviews.slice(0, 5).map((review, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--card-bg)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                  <strong style={{ fontSize: 14 }}>{decodeHtmlEntities(review.author)}</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {renderStars(review.rating)}
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {review.date}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {decodeHtmlEntities(review.text)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: 32 }}>
        <Link href="/" className="film-action-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Retour aux séances
        </Link>
      </div>
    </div>
  );
}
