// src/components/ui/FormatBadge.tsx
// Badges vectoriels de formats techniques cinéma officiels de CinéLyon App
import React from 'react';

export type CinemaFormatType =
  | 'imax'
  | 'dolby'
  | 'dolby_cinema'
  | '4dx'
  | 'screenx'
  | 'ice'
  | '3d'
  | 'atmos'
  | 'vost'
  | 'vf'
  | 'vfst'
  | '35mm'
  | string;

interface FormatBadgeProps {
  format: CinemaFormatType;
  height?: number;
  className?: string;
}

export function FormatBadge({ format, height = 18, className = '' }: FormatBadgeProps) {
  const norm = (format || '').toLowerCase().trim();

  // IMAX
  if (norm.includes('imax')) {
    return (
      <svg
        height={height}
        viewBox="0 0 56 22"
        className={`inline-block shrink-0 rounded-[4px] select-none ${className}`}
        aria-label="Format IMAX"
      >
        <rect width="56" height="22" rx="4" fill="#000000" />
        <text
          x="28"
          y="15"
          fill="#0077DA"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="11"
          fontWeight="900"
          textAnchor="middle"
          letterSpacing="1"
        >
          IMAX
        </text>
      </svg>
    );
  }

  // DOLBY CINEMA
  if (norm.includes('dolby') || norm.includes('cinema')) {
    return (
      <svg
        height={height}
        viewBox="0 0 60 22"
        className={`inline-block shrink-0 rounded-[4px] select-none ${className}`}
        aria-label="Format Dolby Cinema"
      >
        <rect width="60" height="22" rx="4" fill="#1A1C20" />
        <text
          x="30"
          y="15"
          fill="#FFFFFF"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="10"
          fontWeight="800"
          textAnchor="middle"
          letterSpacing="0.5"
        >
          DOLBY
        </text>
      </svg>
    );
  }

  // 4DX
  if (norm.includes('4dx')) {
    return (
      <svg
        height={height}
        viewBox="0 0 48 22"
        className={`inline-block shrink-0 rounded-[4px] select-none ${className}`}
        aria-label="Format 4DX"
      >
        <rect width="48" height="22" rx="4" fill="#E50914" />
        <text
          x="24"
          y="15"
          fill="#FFFFFF"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="11"
          fontWeight="900"
          textAnchor="middle"
          letterSpacing="0.5"
        >
          4DX
        </text>
      </svg>
    );
  }

  // SCREENX
  if (norm.includes('screenx') || norm.includes('screen-x')) {
    return (
      <svg
        height={height}
        viewBox="0 0 68 22"
        className={`inline-block shrink-0 rounded-[4px] select-none ${className}`}
        aria-label="Format ScreenX"
      >
        <rect width="68" height="22" rx="4" fill="#1C1C1E" />
        <text
          x="34"
          y="15"
          fill="#FFCC00"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="10"
          fontWeight="800"
          textAnchor="middle"
          letterSpacing="0.5"
        >
          ScreenX
        </text>
      </svg>
    );
  }

  // ICE
  if (norm.includes('ice')) {
    return (
      <svg
        height={height}
        viewBox="0 0 44 22"
        className={`inline-block shrink-0 rounded-[4px] select-none ${className}`}
        aria-label="Format ICE Immersive"
      >
        <rect width="44" height="22" rx="4" fill="#00A3E0" />
        <text
          x="22"
          y="15"
          fill="#FFFFFF"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="11"
          fontWeight="900"
          textAnchor="middle"
        >
          ICE
        </text>
      </svg>
    );
  }

  // 3D
  if (norm === '3d' || (norm.includes('3d') && !norm.includes('4dx'))) {
    return (
      <svg
        height={height}
        viewBox="0 0 40 22"
        className={`inline-block shrink-0 rounded-[4px] select-none ${className}`}
        aria-label="Format 3D"
      >
        <rect width="40" height="22" rx="4" fill="#3A3A3C" />
        <text
          x="20"
          y="15"
          fill="#34C759"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="11"
          fontWeight="900"
          textAnchor="middle"
        >
          3D
        </text>
      </svg>
    );
  }

  // ATMOS
  if (norm.includes('atmos')) {
    return (
      <svg
        height={height}
        viewBox="0 0 58 20"
        className={`inline-block shrink-0 rounded-[4px] select-none ${className}`}
        aria-label="Format Dolby Atmos"
      >
        <rect width="58" height="20" rx="4" fill="#2C2C2E" />
        <text
          x="29"
          y="14"
          fill="#5AC8FA"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="9"
          fontWeight="800"
          textAnchor="middle"
        >
          ATMOS
        </text>
      </svg>
    );
  }

  // VOST / VOSTFR
  if (norm.includes('vost')) {
    return (
      <svg
        height={height}
        viewBox="0 0 46 20"
        className={`inline-block shrink-0 rounded-[4px] select-none ${className}`}
        aria-label="Version VOST"
      >
        <rect width="46" height="20" rx="4" fill="#444cf7" />
        <text
          x="23"
          y="14"
          fill="#FFFFFF"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="10"
          fontWeight="800"
          textAnchor="middle"
        >
          VOST
        </text>
      </svg>
    );
  }

  // VFST
  if (norm.includes('vfst')) {
    return (
      <svg
        height={height}
        viewBox="0 0 46 20"
        className={`inline-block shrink-0 rounded-[4px] select-none ${className}`}
        aria-label="Version VFST"
      >
        <rect width="46" height="20" rx="4" fill="#5856D6" />
        <text
          x="23"
          y="14"
          fill="#FFFFFF"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="10"
          fontWeight="800"
          textAnchor="middle"
        >
          VFST
        </text>
      </svg>
    );
  }

  // VF
  if (norm === 'vf') {
    return (
      <svg
        height={height}
        viewBox="0 0 34 20"
        className={`inline-block shrink-0 rounded-[4px] select-none ${className}`}
        aria-label="Version VF"
      >
        <rect width="34" height="20" rx="4" fill="#007AFF" />
        <text
          x="17"
          y="14"
          fill="#FFFFFF"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="10"
          fontWeight="800"
          textAnchor="middle"
        >
          VF
        </text>
      </svg>
    );
  }

  // 35mm
  if (norm.includes('35mm')) {
    return (
      <span
        className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-[4px] bg-amber-500/25 border border-amber-500/30 text-amber-500 dark:text-amber-300 font-bold text-[9px] uppercase tracking-wider ${className}`}
      >
        35MM
      </span>
    );
  }

  // Fallback générique propre
  return (
    <span
      className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-[4px] bg-neutral-200 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 font-bold text-[9px] uppercase tracking-wide ${className}`}
    >
      {format}
    </span>
  );
}
