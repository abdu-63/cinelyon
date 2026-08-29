// src/components/ui/FlagIcon.tsx
import React from 'react';
import { SupportedLocale } from '@/i18n';

interface FlagIconProps {
  code: SupportedLocale | string;
  size?: number;
  className?: string;
}

export function FlagIcon({ code, size = 16, className = '' }: FlagIconProps) {
  const width = size;
  const height = Math.round((size * 3) / 4);

  switch (code.toLowerCase()) {
    case 'fr':
      return (
        <svg width={width} height={height} viewBox="0 0 640 480" className={`rounded-[3px] shadow-2xs inline-block shrink-0 ${className}`}>
          <g fillRule="evenodd" strokeWidth="1pt">
            <path fill="#fff" d="M0 0h640v480H0z" />
            <path fill="#00267f" d="M0 0h213.3v480H0z" />
            <path fill="#f31830" d="M426.7 0H640v480H426.7z" />
          </g>
        </svg>
      );
    case 'en':
      return (
        <svg width={width} height={height} viewBox="0 0 640 480" className={`rounded-[3px] shadow-2xs inline-block shrink-0 ${className}`}>
          <path fill="#012169" d="M0 0h640v480H0z" />
          <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z" />
          <path fill="#C8102E" d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L591 0h49zM0 0l239 176h-60L0 42V0z" />
          <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z" />
          <path fill="#C8102E" d="M272 0v480h96V0h-96zM0 192v96h640v-96H0z" />
        </svg>
      );
    case 'es':
      return (
        <svg width={width} height={height} viewBox="0 0 640 480" className={`rounded-[3px] shadow-2xs inline-block shrink-0 ${className}`}>
          <path fill="#c60b1e" d="M0 0h640v480H0z" />
          <path fill="#ffc400" d="M0 120h640v240H0z" />
        </svg>
      );
    case 'it':
      return (
        <svg width={width} height={height} viewBox="0 0 640 480" className={`rounded-[3px] shadow-2xs inline-block shrink-0 ${className}`}>
          <g fillRule="evenodd" strokeWidth="1pt">
            <path fill="#fff" d="M0 0h640v480H0z" />
            <path fill="#009246" d="M0 0h213.3v480H0z" />
            <path fill="#ce2b37" d="M426.7 0H640v480H426.7z" />
          </g>
        </svg>
      );
    case 'de':
      return (
        <svg width={width} height={height} viewBox="0 0 640 480" className={`rounded-[3px] shadow-2xs inline-block shrink-0 ${className}`}>
          <path fill="#ffce00" d="M0 320h640v160H0z" />
          <path d="M0 0h640v160H0z" />
          <path fill="#d00" d="M0 160h640v160H0z" />
        </svg>
      );
    case 'pt':
      return (
        <svg width={width} height={height} viewBox="0 0 640 480" className={`rounded-[3px] shadow-2xs inline-block shrink-0 ${className}`}>
          <path fill="#d00000" d="M0 0h640v480H0z" />
          <path fill="#006600" d="M0 0h240v480H0z" />
          <circle cx="240" cy="240" r="80" fill="#ffcc00" />
        </svg>
      );
    case 'ja':
      return (
        <svg width={width} height={height} viewBox="0 0 640 480" className={`rounded-[3px] shadow-2xs inline-block shrink-0 ${className}`}>
          <path fill="#fff" d="M0 0h640v480H0z" />
          <circle cx="320" cy="240" r="120" fill="#bc002d" />
        </svg>
      );
    case 'ar':
      return (
        <svg width={width} height={height} viewBox="0 0 640 480" className={`rounded-[3px] shadow-2xs inline-block shrink-0 ${className}`}>
          <path fill="#007a3d" d="M0 0h640v480H0z" />
          <path fill="#fff" d="M160 270h320v-60H160z" opacity="0.9" />
        </svg>
      );
    case 'tr':
      return (
        <svg width={width} height={height} viewBox="0 0 640 480" className={`rounded-[3px] shadow-2xs inline-block shrink-0 ${className}`}>
          <path fill="#e30a17" d="M0 0h640v480H0z" />
          <circle cx="270" cy="240" r="120" fill="#fff" />
          <circle cx="295" cy="240" r="96" fill="#e30a17" />
          <polygon fill="#fff" points="360,240 410,255 380,215 380,265 410,225" />
        </svg>
      );
    default:
      return (
        <span className={`px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-[9px] font-bold uppercase ${className}`}>
          {code}
        </span>
      );
  }
}
