// src/components/ui/CinemaBrand.tsx
// Composant d'affichage d'enseigne de cinéma avec logo SVG vectoriel officiel
'use client';

import React from 'react';
import {
  PatheLogo,
  UgcLogo,
  InstitutLumiereLogo,
  LumiereLogo,
  CgrLogo,
  CineMeyzieuLogo,
  CineTobogganLogo,
  CinemaSaintDenisLogo,
  ComoediaLogo,
  LesAmphisLogo,
  GerardPhilipeLogo,
} from './CinemaLogos';
import { getBrand } from '@/lib/constants';
import { useTheme } from '@/context/ThemeContext';

interface CinemaBrandProps {
  cinemaName?: string;
  brandName?: string;
  hideText?: boolean;
  compact?: boolean;
  className?: string;
}

export const CinemaBrand = React.memo(function CinemaBrand({
  cinemaName,
  brandName: explicitBrand,
  hideText = false,
  compact = false,
  className = '',
}: CinemaBrandProps) {
  const { isDark } = useTheme();
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';

  const brand = explicitBrand || (cinemaName ? getBrand(cinemaName) : 'Autre');

  const renderLogo = () => {
    switch (brand) {
      case 'Pathé':
        return <PatheLogo width={compact ? 36 : 50} height={compact ? 28 : 38} isDark={isDark} />;
      case 'UGC':
        return <UgcLogo width={compact ? 36 : 50} height={compact ? 24 : 33} isDark={isDark} />;
      case 'Institut Lumière':
        return <InstitutLumiereLogo width={compact ? 22 : 30} height={compact ? 22 : 30} isDark={isDark} />;
      case 'Lumière':
        return <LumiereLogo width={compact ? 32 : 44} height={compact ? 22 : 30} isDark={isDark} />;
      case 'CGR':
        return <CgrLogo width={compact ? 26 : 36} height={compact ? 22 : 30} isDark={isDark} />;
      case 'Ciné Meyzieu':
        return <CineMeyzieuLogo width={compact ? 20 : 28} height={compact ? 24 : 32} isDark={isDark} />;
      case 'Ciné Toboggan':
        return <CineTobogganLogo width={compact ? 26 : 36} height={compact ? 20 : 26} isDark={isDark} />;
      case 'Cinéma Saint-Denis':
        return <CinemaSaintDenisLogo width={compact ? 32 : 45} height={compact ? 16 : 22} color="#9B0000" isDark={isDark} />;
      case 'Comoedia':
        return <ComoediaLogo width={compact ? 36 : 50} height={compact ? 16 : 20} isDark={isDark} />;
      case 'Cinéma Les Amphis':
        return <LesAmphisLogo width={compact ? 42 : 60} height={compact ? 16 : 20} isDark={isDark} />;
      case 'Gérard-Philipe':
        return <GerardPhilipeLogo width={compact ? 42 : 60} height={compact ? 16 : 22} isDark={isDark} />;
      default:
        return null;
    }
  };

  const logo = renderLogo();

  if (hideText) {
    return <div className={`flex items-center justify-center ${className}`}>{logo}</div>;
  }

  return (
    <div className={`flex items-center gap-2 mb-2 px-1 ${className}`}>
      {logo && <div className="shrink-0 flex items-center justify-center">{logo}</div>}
      <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-heading">
        {brand}
      </span>
    </div>
  );
});
