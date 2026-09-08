// src/components/ui/InstagramIcon.tsx
// Icône officielle Instagram vectorielle dégradée de CinéLyon App
import React from 'react';
import { InstagramLogo } from './BrandIcons';

export function InstagramIcon({
  size = 16,
  className = '',
  variant = 'gradient',
}: {
  size?: number;
  className?: string;
  variant?: 'gradient' | 'mono-light' | 'mono-dark' | 'currentColor';
}) {
  return <InstagramLogo size={size} className={className} variant={variant} />;
}
