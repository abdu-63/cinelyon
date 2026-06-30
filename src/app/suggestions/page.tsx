// src/app/suggestions/page.tsx
// Page Suggestions — équivalent de /suggestions Flask

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Suggestions & Signalement — CinéLyon',
  description: 'Suggérez un film, signalez une erreur ou contactez l\'équipe CinéLyon.',
};

export default function SuggestionsPage() {
  return (
    <div style={{ margin: '0 10%', padding: '40px 0 80px' }}>
      <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
        <Link href="/" style={{ color: 'var(--primary)' }}>Accueil</Link>
        {' › '}
        <span>Suggestions</span>
      </nav>

      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: 'var(--text-main)' }}>
        Suggestions & Contact
      </h1>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 32 }}>
        Tu as remarqué une erreur dans les horaires, un film manquant, ou tu as une idée pour améliorer CinéLyon ? Fais-le nous savoir !
      </p>

      <div
        style={{
          background: 'var(--card-bg)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: 16,
          padding: '28px 32px',
          border: '1px solid var(--border-light)',
          boxShadow: '0 8px 32px var(--shadow-sm)',
          maxWidth: 600,
        }}
      >
        <SuggestionForm />
      </div>

      <div style={{ marginTop: 24, padding: '20px 24px', background: 'var(--card-solid)', borderRadius: 12, border: '1px solid var(--border-light)', maxWidth: 600 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Autres façons de nous contacter</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '4px 0' }}>
          📸 Instagram :{' '}
          <a href="https://www.instagram.com/cinelyon.fr/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
            @cinelyon.fr
          </a>
        </p>
      </div>
    </div>
  );
}

// Formulaire de suggestions (Client Component)
function SuggestionForm() {
  'use client';
  return (
    <form
      action="https://formspree.io/f/cinelyon"
      method="POST"
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <div>
        <label
          htmlFor="sugg-type"
          style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}
        >
          Type de message
        </label>
        <select
          id="sugg-type"
          name="type"
          className="search-input"
          style={{ width: '100%' }}
          required
        >
          <option value="">Choisir...</option>
          <option value="erreur">Erreur dans les horaires</option>
          <option value="film-manquant">Film manquant</option>
          <option value="suggestion">Suggestion de fonctionnalité</option>
          <option value="autre">Autre</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="sugg-msg"
          style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}
        >
          Message
        </label>
        <textarea
          id="sugg-msg"
          name="message"
          rows={5}
          placeholder="Décris ton problème ou ta suggestion..."
          required
          style={{
            width: '100%',
            padding: '12px 15px',
            borderRadius: 8,
            border: '2px solid var(--border-color)',
            fontFamily: 'healTheWebA, sans-serif',
            fontSize: 14,
            background: 'var(--card-solid)',
            color: 'var(--text-main)',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <label
          htmlFor="sugg-email"
          style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}
        >
          Email (optionnel)
        </label>
        <input
          type="email"
          id="sugg-email"
          name="email"
          placeholder="pour te répondre"
          className="search-input"
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
      </div>

      <button
        type="submit"
        className="reset-btn"
        style={{ alignSelf: 'flex-start', padding: '12px 28px' }}
      >
        Envoyer
      </button>
    </form>
  );
}
