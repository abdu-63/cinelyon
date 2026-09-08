// src/components/ui/IonIcons.tsx
// Icônes officielles vectorielles SVG extraites de CinéLyon App (Ionicons officielles)
import React from 'react';

export interface IonIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
}

// ─── 1. ICÔNES DE CATÉGORIES DE FILTRES (FilterBar) ──────────────────────────

/** Nouveautés */
export function SparklesOutlineIcon({ size = 16, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path
        d="M259.92 262.91L216.4 149.77a9 9 0 00-16.8 0l-43.52 113.14a9 9 0 01-5.17 5.17L37.77 311.6a9 9 0 000 16.8l113.14 43.52a9 9 0 015.17 5.17l43.52 113.14a9 9 0 0016.8 0l43.52-113.14a9 9 0 015.17-5.17l113.14-43.52a9 9 0 000-16.8l-113.14-43.52a9 9 0 01-5.17-5.17zM108 68L88 16 68 68 16 88l52 20 20 52 20-52 52-20-52-20zM426.67 117.33L400 48l-26.67 69.33L304 144l69.33 26.67L400 240l26.67-69.33L496 144l-69.33-26.67z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </svg>
  );
}

/** Créneaux Horaires */
export function TimeOutlineIcon({ size = 16, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path
        d="M256 64C150 64 64 150 64 256s86 192 192 192 192-86 192-192S362 64 256 64z"
        stroke={color}
        strokeMiterlimit="10"
        strokeWidth="32"
      />
      <path
        d="M256 128v144h96"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </svg>
  );
}

/** Formats & Expériences */
export function FilmOutlineIcon({ size = 16, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <rect x="48" y="96" width="416" height="320" rx="28" ry="28" stroke={color} strokeLinejoin="round" strokeWidth="32" />
      <rect x="384" y="336" width="80" height="80" rx="28" ry="28" stroke={color} strokeLinejoin="round" strokeWidth="32" />
      <rect x="384" y="256" width="80" height="80" rx="28" ry="28" stroke={color} strokeLinejoin="round" strokeWidth="32" />
      <rect x="384" y="176" width="80" height="80" rx="28" ry="28" stroke={color} strokeLinejoin="round" strokeWidth="32" />
      <rect x="384" y="96" width="80" height="80" rx="28" ry="28" stroke={color} strokeLinejoin="round" strokeWidth="32" />
      <rect x="48" y="336" width="80" height="80" rx="28" ry="28" stroke={color} strokeLinejoin="round" strokeWidth="32" />
      <rect x="48" y="256" width="80" height="80" rx="28" ry="28" stroke={color} strokeLinejoin="round" strokeWidth="32" />
      <rect x="48" y="176" width="80" height="80" rx="28" ry="28" stroke={color} strokeLinejoin="round" strokeWidth="32" />
      <rect x="48" y="96" width="80" height="80" rx="28" ry="28" stroke={color} strokeLinejoin="round" strokeWidth="32" />
      <rect x="128" y="96" width="256" height="160" rx="28" ry="28" stroke={color} strokeLinejoin="round" strokeWidth="32" />
      <rect x="128" y="256" width="256" height="160" rx="28" ry="28" stroke={color} strokeLinejoin="round" strokeWidth="32" />
    </svg>
  );
}

/** Cinémas Lyonnais */
export function BusinessOutlineIcon({ size = 16, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
        d="M176 416v64M80 32h192a32 32 0 0132 32v412a4 4 0 01-4 4H48h0V64a32 32 0 0132-32zM320 192h112a32 32 0 0132 32v256h0-160 0V208a16 16 0 0116-16z"
      />
      <g fill={color}>
        <path d="M98.08 431.87a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zM98.08 351.87a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zM98.08 271.87a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zM98.08 191.87a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zM98.08 111.87a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zM178.08 351.87a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zM178.08 271.87a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zM178.08 191.87a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zM178.08 111.87a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zM258.08 431.87a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zM258.08 351.87a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zM258.08 271.87a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79z" />
        <ellipse cx="256" cy="176" rx="15.95" ry="16.03" transform="rotate(-45 255.99 175.996)" />
        <path d="M258.08 111.87a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zM400 400a16 16 0 1016 16 16 16 0 00-16-16zM400 320a16 16 0 1016 16 16 16 0 00-16-16zM400 240a16 16 0 1016 16 16 16 0 00-16-16zM336 400a16 16 0 1016 16 16 16 0 00-16-16zM336 320a16 16 0 1016 16 16 16 0 00-16-16zM336 240a16 16 0 1016 16 16 16 0 00-16-16z" />
      </g>
    </svg>
  );
}

/** Genres */
export function PricetagsOutlineIcon({ size = 16, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path
        d="M403.29 32H280.36a14.46 14.46 0 00-10.2 4.2L24.4 281.9a28.85 28.85 0 000 40.7l117 117a28.86 28.86 0 0040.71 0L427.8 194a14.46 14.46 0 004.2-10.2v-123A28.66 28.66 0 00403.29 32z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path d="M352 144a32 32 0 1132-32 32 32 0 01-32 32z" fill={color} />
      <path
        d="M230 480l262-262a13.81 13.81 0 004-10V80"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </svg>
  );
}

/** Réalisateurs */
export function PersonOutlineIcon({ size = 16, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path
        d="M344 144c-3.92 52.87-44 96-88 96s-84.15-43.12-88-96c-4-55 35-96 88-96s92 42 88 96z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path
        d="M256 304c-87 0-175.3 48-191.64 138.6C62.39 453.52 68.57 464 80 464h352c11.44 0 17.62-10.48 15.65-21.4C431.3 352 343 304 256 304z"
        stroke={color}
        strokeMiterlimit="10"
        strokeWidth="32"
      />
    </svg>
  );
}

/** Acteurs & Casting */
export function PeopleOutlineIcon({ size = 16, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path
        d="M402 168c-2.93 40.67-33.1 72-66 72s-63.12-31.32-66-72c-3-42.31 26.37-72 66-72s69 30.46 66 72z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path
        d="M336 304c-65.17 0-127.84 32.37-143.54 95.41-2.08 8.34 3.15 16.59 11.72 16.59h263.65c8.57 0 13.77-8.25 11.72-16.59C463.85 335.36 401.18 304 336 304z"
        stroke={color}
        strokeMiterlimit="10"
        strokeWidth="32"
      />
      <path
        d="M200 185.94c-2.34 32.48-26.72 58.06-53 58.06s-50.7-25.57-53-58.06C91.61 152.15 115.34 128 147 128s55.39 24.77 53 57.94z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path
        d="M206 306c-18.05-8.27-37.93-11.45-59-11.45-52 0-102.1 25.85-114.65 76.2-1.65 6.66 2.53 13.25 9.37 13.25H154"
        stroke={color}
        strokeLinecap="round"
        strokeMiterlimit="10"
        strokeWidth="32"
      />
    </svg>
  );
}

// ─── 2. ACTIONS DU CODE DE SYNCHRONISATION (Settings / ProfileHeroCard) ───────

/**
 * Régénérer un code de synchronisation (Ionicons refresh-outline officiel de CinéLyon App)
 * Flèche circulaire unique épurée
 */
export function RefreshOutlineIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path
        d="M320 146s24.36-12-64-12a160 160 0 10160 160"
        stroke={color}
        strokeLinecap="round"
        strokeMiterlimit="10"
        strokeWidth="32"
      />
      <path
        d="M256 58l80 80-80 80"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </svg>
  );
}

/** Afficher le code (eye-outline) */
export function EyeOutlineIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path
        d="M255.66 112c-77.94 0-157.89 45.11-220.83 135.33a16 16 0 00-.27 17.77C82.92 340.8 161.8 400 255.66 400c92.84 0 173.34-59.38 221.79-135.25a16.14 16.14 0 000-17.47C428.89 172.28 347.8 112 255.66 112z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <circle cx="256" cy="256" r="80" stroke={color} strokeMiterlimit="10" strokeWidth="32" />
    </svg>
  );
}

/** Masquer le code (eye-off-outline) */
export function EyeOffOutlineIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path
        d="M432 448a15.92 15.92 0 01-11.31-4.69l-352-352a16 16 0 0122.62-22.62l352 352A16 16 0 01432 448zM255.66 384c-41.49 0-81.5-12.28-118.92-36.5-34.07-22-64.74-53.51-88.7-91v-.08c19.94-28.57 41.78-52.73 65.24-72.21a2 2 0 00.14-2.94L93.5 161.38a2 2 0 00-2.71-.12c-24.92 21-48.05 46.76-69.08 76.92a31.92 31.92 0 00-.64 35.54c26.41 41.33 60.4 76.14 98.28 100.65C162 402 207.9 416 255.66 416a239.13 239.13 0 0075.8-12.58 2 2 0 00.77-3.31l-21.58-21.58a4 4 0 00-3.83-1 204.8 204.8 0 01-51.16 6.47zM490.84 238.6c-26.46-40.92-60.79-75.68-99.27-100.53C349 110.55 302 96 255.66 96a227.34 227.34 0 00-74.89 12.83 2 2 0 00-.75 3.31l21.55 21.55a4 4 0 003.88 1 192.82 192.82 0 0150.21-6.69c40.69 0 80.58 12.43 118.55 37 34.71 22.4 65.74 53.88 89.76 91a.13.13 0 010 .16 310.72 310.72 0 01-64.12 72.73 2 2 0 00-.15 2.95l19.9 19.89a2 2 0 002.7.13 343.49 343.49 0 0068.64-78.48 32.2 32.2 0 00-.1-34.78z"
        fill={color}
      />
      <path
        d="M256 160a95.88 95.88 0 00-21.37 2.4 2 2 0 00-1 3.38l112.59 112.56a2 2 0 003.38-1A96 96 0 00256 160zM165.78 233.66a2 2 0 00-3.38 1 96 96 0 00115 115 2 2 0 001-3.38z"
        fill={color}
      />
    </svg>
  );
}

/** Copier le code (copy-outline) */
export function CopyOutlineIcon({ size = 15, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <rect x="128" y="128" width="336" height="336" rx="57" ry="57" stroke={color} strokeLinejoin="round" strokeWidth="32" />
      <path
        d="M383.5 128l.5-24a56.16 56.16 0 00-56-56H112a64.19 64.19 0 00-64 64v216a56.16 56.16 0 0056 56h24"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </svg>
  );
}

/** Modifier le pseudo (pencil) */
export function PencilIcon({ size = 15, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="44"
        d="M358.62 129.28L86.49 402.08 70 442l39.92-16.49 272.8-272.13-24.1-24.1zM413.07 74.84l-11.79 11.78 24.1 24.1 11.79-11.79a16.51 16.51 0 000-23.34l-.75-.75a16.51 16.51 0 00-23.35 0z"
      />
    </svg>
  );
}

// ─── 3. ICÔNES DE SECTIONS DES RÉGLAGES (SettingsModal) ────────────────────────

/** Lier un appareil (phone-portrait) */
export function PhonePortraitIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill={color} className={className} style={style}>
      <path d="M336 0H176a64 64 0 00-64 64v384a64 64 0 0064 64h160a64 64 0 0064-64V64a64 64 0 00-64-64zm32 448a32 32 0 01-32 32H176a32 32 0 01-32-32V64a32 32 0 0132-32h11.35a7.94 7.94 0 017.3 4.75A32 32 0 00224 56h64a32 32 0 0029.35-19.25 7.94 7.94 0 017.3-4.75H336a32 32 0 0132 32z" />
    </svg>
  );
}

/** Ajouter un ami (person-add) */
export function PersonAddIcon({ size = 16, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill={color} className={className} style={style}>
      <path d="M288 256c52.79 0 99.43-49.71 104-110.82 2.27-30.7-7.36-59.33-27.12-80.6C345.33 43.57 318 32 288 32c-30.24 0-57.59 11.5-77 32.38-19.63 21.11-29.2 49.8-27 80.78C188.49 206.28 235.12 256 288 256zM495.38 439.76c-8.44-46.82-34.79-86.15-76.19-113.75C382.42 301.5 335.83 288 288 288s-94.42 13.5-131.19 38c-41.4 27.6-67.75 66.93-76.19 113.75-1.93 10.73.69 21.34 7.19 29.11A30.94 30.94 0 00112 480h352a30.94 30.94 0 0024.21-11.13c6.48-7.77 9.1-18.38 7.17-29.11zM104 288v-40h40a16 16 0 000-32h-40v-40a16 16 0 00-32 0v40H32a16 16 0 000 32h40v40a16 16 0 0032 0z" />
    </svg>
  );
}

/** Notifications (notifications) */
export function NotificationsIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill={color} className={className} style={style}>
      <path d="M440.08 341.31c-1.66-2-3.29-4-4.89-5.93-22-26.61-35.31-42.67-35.31-118 0-39-9.33-71-27.72-95-13.56-17.73-31.89-31.18-56.05-41.12a3 3 0 01-.82-.67C306.6 51.49 282.82 32 256 32s-50.59 19.49-59.28 48.56a3.13 3.13 0 01-.81.65c-56.38 23.21-83.78 67.74-83.78 136.14 0 75.36-13.29 91.42-35.31 118-1.6 1.93-3.23 3.89-4.89 5.93a35.16 35.16 0 00-4.65 37.62c6.17 13 19.32 21.07 34.33 21.07H410.5c14.94 0 28-8.06 34.19-21a35.17 35.17 0 00-4.61-37.66zM256 480a80.06 80.06 0 0070.44-42.13 4 4 0 00-3.54-5.87H189.12a4 4 0 00-3.55 5.87A80.06 80.06 0 00256 480z" />
    </svg>
  );
}

/** Rappels séances (time) */
export function TimeIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill={color} className={className} style={style}>
      <path d="M256 48C141.13 48 48 141.13 48 256s93.13 208 208 208 208-93.13 208-208S370.87 48 256 48zm96 240h-96a16 16 0 01-16-16V128a16 16 0 0132 0v128h80a16 16 0 010 32z" />
    </svg>
  );
}

/** Langue d'affichage (language) */
export function LanguageIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill={color} className={className} style={style}>
      <path d="M478.33 433.6l-90-218a22 22 0 00-40.67 0l-90 218a22 22 0 1040.67 16.79L316.66 406h102.67l18.33 44.39A22 22 0 00458 464a22 22 0 0020.32-30.4zM334.83 362L368 281.65 401.17 362zM267.84 342.92a22 22 0 00-4.89-30.7c-.2-.15-15-11.13-36.49-34.73 39.65-53.68 62.11-114.75 71.27-143.49H330a22 22 0 000-44H214V70a22 22 0 00-44 0v20H54a22 22 0 000 44h197.25c-9.52 26.95-27.05 69.5-53.79 108.36-31.41-41.68-43.08-68.65-43.17-68.87a22 22 0 00-40.58 17c.58 1.38 14.55 34.23 52.86 83.93.92 1.19 1.83 2.35 2.74 3.51-39.24 44.35-77.74 71.86-93.85 80.74a22 22 0 1021.07 38.63c2.16-1.18 48.6-26.89 101.63-85.59 22.52 24.08 38 35.44 38.93 36.1a22 22 0 0030.75-4.9z" />
    </svg>
  );
}

/** Exporter / Partager des données (share-social-outline) */
export function ShareSocialIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <circle cx="128" cy="256" r="48" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" />
      <circle cx="384" cy="112" r="48" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" />
      <circle cx="384" cy="400" r="48" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" />
      <path stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M169.83 279.53l172.34 96.94M342.17 135.53l-172.34 96.94" />
    </svg>
  );
}

/** Importer des données (download-outline) */
export function DownloadOutlineIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path
        d="M336 176h40a40 40 0 0140 40v208a40 40 0 01-40 40H136a40 40 0 01-40-40V216a40 40 0 0140-40h40"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path
        d="M176 272l80 80 80-80M256 48v288"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </svg>
  );
}

/** Supprimer / Déconnecter (trash-outline) */
export function TrashOutlineIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path
        d="M112 112l20 320c.95 18.49 14.4 32 32 32h184c17.67 0 30.87-13.51 32-32l20-320"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path stroke={color} strokeLinecap="round" strokeMiterlimit="10" strokeWidth="32" d="M80 112h352" />
      <path
        d="M192 112V72h0a23.93 23.93 0 0124-24h80a23.93 23.93 0 0124 24h0v40M256 176v224M184 176l8 224M328 176l-8 224"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </svg>
  );
}

/** Politique de confidentialité (shield-checkmark-outline) */
export function ShieldCheckmarkIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M336 176L225.2 304 176 255.8" />
      <path
        d="M463.1 112.37C373.68 96.33 336.71 84.45 256 48c-80.71 36.45-117.68 48.33-207.1 64.37C32.7 369.13 240.58 457.79 256 464c15.42-6.21 223.3-94.87 207.1-351.63z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </svg>
  );
}

/** Mentions Légales & CGU (document-text-outline) */
export function DocumentTextIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path
        d="M416 221.25V416a48 48 0 01-48 48H144a48 48 0 01-48-48V96a48 48 0 0148-48h98.75a32 32 0 0122.62 9.37l141.26 141.26a32 32 0 019.37 22.62z"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path
        d="M256 56v120a32 32 0 0032 32h120M176 288h160M176 368h160"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </svg>
  );
}

/** Mentions Légales / Informations (information-circle-outline) */
export function InformationCircleIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path
        d="M248 64C146.39 64 64 146.39 64 248s82.39 184 184 184 184-82.39 184-184S349.61 64 248 64z"
        stroke={color}
        strokeMiterlimit="10"
        strokeWidth="32"
      />
      <path
        d="M220 220h32v116"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path
        d="M208 340h88"
        stroke={color}
        strokeLinecap="round"
        strokeMiterlimit="10"
        strokeWidth="32"
      />
      <circle cx="248" cy="130" r="26" fill={color} />
    </svg>
  );
}

/** Suggestions & Aide (help-circle-outline) */
export function HelpCircleIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path d="M256 80a176 176 0 10176 176A176 176 0 00256 80z" stroke={color} strokeMiterlimit="10" strokeWidth="32" />
      <path
        d="M200 202.29s.84-17.5 19.57-32.57C230.68 160.77 244 158.18 256 158c10.93-.14 20.69 1.67 26.53 4.45 10 4.76 29.47 16.38 29.47 41.09 0 26-17 37.81-36.37 50.8S251 281.43 251 296"
        stroke={color}
        strokeLinecap="round"
        strokeMiterlimit="10"
        strokeWidth="28"
      />
      <circle cx="250" cy="348" r="20" fill={color} />
    </svg>
  );
}

/** Signaler un bug (bug-outline) */
export function BugOutlineIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path
        d="M370 378c28.89 23.52 46 46.07 46 86M142 378c-28.89 23.52-46 46.06-46 86M384 208c28.89-23.52 32-56.07 32-96M128 206c-28.89-23.52-32-54.06-32-94M464 288.13h-80M128 288.13H48M256 192v256"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path
        d="M256 448h0c-70.4 0-128-57.6-128-128v-96.07c0-65.07 57.6-96 128-96h0c70.4 0 128 25.6 128 96V320c0 70.4-57.6 128-128 128z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path
        d="M179.43 143.52a49.08 49.08 0 01-3.43-15.73A80 80 0 01255.79 48h.42A80 80 0 01336 127.79a41.91 41.91 0 01-3.12 14.3"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </svg>
  );
}

/** Palette de couleurs (color-palette) */
export function ColorPaletteIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill={color} className={className} style={style}>
      <path d="M441 336.2l-.06-.05c-9.93-9.18-22.78-11.34-32.16-12.92l-.69-.12c-9.05-1.49-10.48-2.5-14.58-6.17-2.44-2.17-5.35-5.65-5.35-9.94s2.91-7.77 5.34-9.94l30.28-26.87c25.92-22.91 40.2-53.66 40.2-86.59s-14.25-63.68-40.2-86.6c-35.89-31.59-85-49-138.37-49C223.72 48 162 71.37 116 112.11c-43.87 38.77-68 90.71-68 146.24s24.16 107.47 68 146.23c21.75 19.24 47.49 34.18 76.52 44.42a266.17 266.17 0 0086.87 15h1.81c61 0 119.09-20.57 159.39-56.4 9.7-8.56 15.15-20.83 15.34-34.56.21-14.17-5.37-27.95-14.93-36.84zM112 208a32 32 0 1132 32 32 32 0 01-32-32zm40 135a32 32 0 1132-32 32 32 0 01-32 32zm40-199a32 32 0 1132 32 32 32 0 01-32-32zm64 271a48 48 0 1148-48 48 48 0 01-48 48zm72-239a32 32 0 1132-32 32 32 0 01-32 32z" />
    </svg>
  );
}

/** Pinceau / Brush */
export function BrushIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill={color} className={className} style={style}>
      <path d="M233.15 360.11a15.7 15.7 0 01-4.92-.77 16 16 0 01-10.92-13c-2.15-15-19.95-32.46-36.62-35.85a16 16 0 01-8.69-26.33l211.09-235.1c.19-.22.39-.43.59-.63a56.57 56.57 0 0179.89 0 56.51 56.51 0 01.11 79.78l-219 227a16 16 0 01-11.53 4.9zM119.89 480.11c-32.14 0-65.45-16.89-84.85-43a16 16 0 0112.85-25.54c5.34 0 20-4.87 20-20.57 0-39.07 31.4-70.86 70-70.86s70 31.79 70 70.86c0 49.12-39.48 89.11-88 89.11z" />
    </svg>
  );
}

/** Mode sombre (moon-outline) */
export function MoonOutlineIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path
        d="M160 136c0-30.62 4.51-61.61 16-88C99.57 81.27 48 159.32 48 248c0 119.29 96.71 216 216 216 88.68 0 166.73-51.57 200-128-26.39 11.49-57.38 16-88 16-119.29 0-216-96.71-216-216z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </svg>
  );
}

/** Mode clair (sunny-outline) */
export function SunnyOutlineIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path
        d="M256 48v48M256 416v48M403.08 108.92l-33.94 33.94M142.86 369.14l-33.94 33.94M464 256h-48M96 256H48M403.08 403.08l-33.94-33.94M142.86 142.86l-33.94-33.94"
        stroke={color}
        strokeLinecap="round"
        strokeMiterlimit="10"
        strokeWidth="32"
      />
      <circle cx="256" cy="256" r="80" stroke={color} strokeLinecap="round" strokeMiterlimit="10" strokeWidth="32" />
    </svg>
  );
}

/** Chevron forward (chevron-forward) */
export function ChevronForwardIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="48" d="M184 112l144 144-144 144" />
    </svg>
  );
}

/** Chevron down (chevron-down) */
export function ChevronDownIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="48" d="M112 184l144 144 144-144" />
    </svg>
  );
}

/** Fermer (close) */
export function CloseIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill={color} className={className} style={style}>
      <path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z" />
    </svg>
  );
}

/** Checkmark (checkmark) */
export function CheckmarkIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M416 128L192 384l-96-96" />
    </svg>
  );
}

/** Déconnexion / Coupure (power-outline) */
export function PowerOutlineIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path d="M378 108a191.41 191.41 0 0170 148c0 106-86 192-192 192S64 362 64 256a192 192 0 0169-148M256 64v192" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" />
    </svg>
  );
}

/** Ajouter cercle (add-circle) */
export function AddCircleIcon({ size = 20, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill={color} className={className} style={style}>
      <path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm80 224h-64v64a16 16 0 01-32 0v-64h-64a16 16 0 010-32h64v-64a16 16 0 0132 0v64h64a16 16 0 010 32z" />
    </svg>
  );
}

/** Fermer cercle (close-circle) */
export function CloseCircleIcon({ size = 20, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill={color} className={className} style={style}>
      <path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm75.31 260.69a16 16 0 11-22.62 22.62L256 278.63l-52.69 52.68a16 16 0 01-22.62-22.62L233.37 256l-52.68-52.69a16 16 0 0122.62-22.62L256 233.37l52.69-52.68a16 16 0 0122.62 22.62L278.63 256z" />
    </svg>
  );
}

/** Avertissement (warning-outline) */
export function WarningOutlineIcon({ size = 18, className = '', style, color = 'currentColor' }: IonIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} style={style}>
      <path
        d="M85.57 446.25h340.86a32 32 0 0028.17-47.17L284.18 82.58c-12.09-22.44-44.27-22.44-56.36 0L57.4 399.08a32 32 0 0028.17 47.17z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path
        d="M250.26 195.39l5.74 122 5.73-121.95a5.74 5.74 0 00-5.79-6h0a5.74 5.74 0 00-5.68 5.95z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path d="M256 397.25a20 20 0 1120-20 20 20 0 01-20 20z" fill={color} />
    </svg>
  );
}

// ─── 4. SQUIRCLE APPLE DESIGN IDENTIQUE À CINÉLYON APP ─────────────────────────

/**
 * SettingsIconBadge
 * Reproduit fidèlement le SettingsIcon de CinéLyon App :
 * Dimensions 30x30, borderRadius 7px, avec fond coloré Apple
 */
export function SettingsIconBadge({
  backgroundColor,
  icon: Icon,
  color = '#FFFFFF',
  size = 17,
  className = '',
}: {
  backgroundColor: string;
  icon: React.ComponentType<IonIconProps>;
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`w-[30px] h-[30px] rounded-[7px] flex items-center justify-center shrink-0 shadow-xs select-none ${className}`}
      style={{ backgroundColor, color }}
    >
      <Icon size={size} color={color} />
    </div>
  );
}
