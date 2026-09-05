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
    if (compact) {
      switch (brand) {
        case 'Pathé':
          return <PatheLogo width={30} height={22} textColor={textColor} isDark={isDark} />;
        case 'UGC':
          return <UgcLogo width={30} height={20} isDark={isDark} />;
        case 'Institut Lumière':
          return <InstitutLumiereLogo width={20} height={20} color={textColor} isDark={isDark} />;
        case 'Lumière':
          return <LumiereLogo width={28} height={19} isDark={isDark} />;
        case 'CGR':
          return <CgrLogo width={24} height={20} textColor={textColor} isDark={isDark} />;
        case 'Ciné Meyzieu':
          return <CineMeyzieuLogo width={20} height={22} textColor={textColor} isDark={isDark} />;
        case 'Ciné Toboggan':
          return <CineTobogganLogo width={24} height={18} color={textColor} isDark={isDark} />;
        case 'Cinéma Saint-Denis':
          return <CinemaSaintDenisLogo width={30} height={15} color="#9B0000" />;
        case 'Comoedia':
          return <ComoediaLogo width={34} height={14} color={textColor} isDark={isDark} />;
        case 'Cinéma Les Amphis':
          return <LesAmphisLogo width={38} height={13} isDark={isDark} />;
        case 'Gérard-Philipe':
          return <GerardPhilipeLogo width={38} height={14} isDark={isDark} />;
        case 'Cinéma-Opéra':
        case 'Cinéma Opéra':
        case 'Cinema Opera':
        case 'Opéra':
        case 'Autre':
        default:
          return null;
      }
    }

    switch (brand) {
      case 'Pathé':
        return <PatheLogo width={50} height={38} textColor={textColor} isDark={isDark} />;
      case 'UGC':
        return <UgcLogo width={50} height={33} isDark={isDark} />;
      case 'Institut Lumière':
        return <InstitutLumiereLogo width={30} height={30} color={textColor} isDark={isDark} />;
      case 'Lumière':
        return <LumiereLogo width={44} height={30} isDark={isDark} />;
      case 'CGR':
        return <CgrLogo width={36} height={30} textColor={textColor} isDark={isDark} />;
      case 'Ciné Meyzieu':
        return <CineMeyzieuLogo width={28} height={32} textColor={textColor} isDark={isDark} />;
      case 'Ciné Toboggan':
        return <CineTobogganLogo width={36} height={26} color={textColor} isDark={isDark} />;
      case 'Cinéma Saint-Denis':
        return <CinemaSaintDenisLogo width={45} height={22} color="#9B0000" />;
      case 'Comoedia':
        return <ComoediaLogo width={50} height={20} color={textColor} isDark={isDark} />;
      case 'Cinéma Les Amphis':
        return <LesAmphisLogo width={60} height={20} isDark={isDark} />;
      case 'Gérard-Philipe':
        return <GerardPhilipeLogo width={60} height={22} isDark={isDark} />;
      case 'Cinéma-Opéra':
      case 'Cinéma Opéra':
      case 'Cinema Opera':
      case 'Opéra':
      case 'Autre':
      default:
        return null;
    }
  };

  const logo = renderLogo();

  if (!logo) {
    return null;
  }

  if (hideText) {
    return <div className={`flex items-center justify-center ${className}`}>{logo}</div>;
  }

  return (
    <div className={`flex items-center mb-2 px-1 ${className}`}>
      <div className="shrink-0 flex items-center justify-center">{logo}</div>
    </div>
  );
});
