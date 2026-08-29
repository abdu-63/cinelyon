// src/utils/tclRouting.ts
// Fonctions d'itinéraires et de transport en commun TCL pour le Web

import { CinemaInfo } from '@/types';

export interface RouteAppOption {
  id: 'tcl' | 'apple' | 'google' | 'citymapper';
  title: string;
  getUrl: (cinema: CinemaInfo) => string;
}

export const ROUTE_OPTIONS: RouteAppOption[] = [
  {
    id: 'google',
    title: 'Google Maps (Itinéraire TCL / Transport)',
    getUrl: (cinema) =>
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        `${cinema.name} ${cinema.address}`
      )}&travelmode=transit`,
  },
  {
    id: 'citymapper',
    title: 'Citymapper Lyon',
    getUrl: (cinema) =>
      `https://citymapper.com/directions?endcoord=${cinema.latitude}%2C${cinema.longitude}&endname=${encodeURIComponent(
        cinema.name
      )}&endaddress=${encodeURIComponent(cinema.address)}`,
  },
  {
    id: 'apple',
    title: 'Apple Plans',
    getUrl: (cinema) =>
      `https://maps.apple.com/?daddr=${encodeURIComponent(`${cinema.name}, ${cinema.address}`)}&dirflg=r`,
  },
];

export function openCinemaRoute(cinema: CinemaInfo, optionId: 'google' | 'citymapper' | 'apple' = 'google') {
  const option = ROUTE_OPTIONS.find((o) => o.id === optionId) || ROUTE_OPTIONS[0];
  const url = option.getUrl(cinema);
  window.open(url, '_blank', 'noopener,noreferrer');
}
