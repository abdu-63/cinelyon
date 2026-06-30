// src/components/layout/Footer.tsx
// Pied de page

import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer>
      <div className="container_footer">
        <div className="footer-info">
          <p>© {year} CinéLyon — Toutes les séances de cinéma à Lyon</p>
          <p>
            Données issues d&apos;AlloCiné · <Link href="/suggestions">Signaler une erreur</Link>
          </p>
        </div>

        <div className="footer-social">
          <a
            href="https://www.instagram.com/cinelyon.fr/"
            className="social-link"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram CinéLyon"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
          <a
            href="https://www.letterboxd.com"
            className="social-link"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Letterboxd"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.983.42a11.58 11.58 0 1 0 0 23.16A11.58 11.58 0 0 0 11.983.42zm-3.62 16.394H6.287V7.186h2.076v9.628zm3.62 0H9.907V7.186h2.076v9.628zm3.62 0h-2.076V7.186h2.076v9.628z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
