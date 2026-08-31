// src/context/ThemeContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { LIGHT_COLORS, DARK_COLORS, PRIMARY_VARIANTS } from '@/lib/theme';

export type ThemeMode = 'light' | 'dark' | 'system';
export type PrimaryColorVariant = 'violet' | 'blue' | 'white' | 'black' | 'cleardark';

interface ThemeContextType {
  mode: ThemeMode;
  primaryColor: PrimaryColorVariant;
  isDark: boolean;
  liquidGlassEnabled: boolean;
  colors: typeof LIGHT_COLORS & typeof PRIMARY_VARIANTS.violet;
  setMode: (mode: ThemeMode) => void;
  setPrimaryColor: (color: PrimaryColorVariant) => void;
  setLiquidGlassEnabled: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [primaryColor, setPrimaryColorState] = useState<PrimaryColorVariant>('violet');
  const [liquidGlassEnabled, setLiquidGlassEnabledState] = useState<boolean>(true);
  const [systemIsDark, setSystemIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const storedMode = localStorage.getItem('cinelyon_theme_mode') as ThemeMode | null;
      const storedColor = localStorage.getItem('cinelyon_theme_primary') as PrimaryColorVariant | null;
      const storedGlass = localStorage.getItem('cinelyon_liquid_glass');

      if (storedMode) setModeState(storedMode);
      if (storedColor) setPrimaryColorState(storedColor);
      if (storedGlass !== null) setLiquidGlassEnabledState(storedGlass === 'true');

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemIsDark(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } catch {
      // Ignorer
    }
  }, []);

  const isDark = useMemo(() => {
    if (mode === 'system') return systemIsDark;
    return mode === 'dark';
  }, [mode, systemIsDark]);

  const colors = useMemo(() => {
    const baseColors = isDark ? DARK_COLORS : LIGHT_COLORS;
    let primary = PRIMARY_VARIANTS[primaryColor] || PRIMARY_VARIANTS.violet;

    if (primaryColor === 'white') {
      primary = isDark
        ? {
            ...PRIMARY_VARIANTS.white,
            primary: '#ffffff',
            primaryHover: '#f0f0f0',
            primaryContrast: '#121214',
          }
        : {
            ...PRIMARY_VARIANTS.black,
            primary: '#1c1c1e',
            primaryHover: '#2c2c2e',
            primaryContrast: '#ffffff',
          };
    } else if (primaryColor === 'black') {
      primary = isDark
        ? {
            ...PRIMARY_VARIANTS.white,
            primary: '#ffffff',
            primaryHover: '#f0f0f0',
            primaryContrast: '#121214',
          }
        : {
            ...PRIMARY_VARIANTS.black,
            primary: '#1c1c1e',
            primaryHover: '#2c2c2e',
            primaryContrast: '#ffffff',
          };
    } else if (primaryColor === 'cleardark') {
      primary = isDark ? PRIMARY_VARIANTS.white : PRIMARY_VARIANTS.black;
    }

    let showtimeText = primary.primary;
    if (isDark) {
      if (primaryColor === 'violet') {
        showtimeText = '#a2a7ff';
      } else if (primaryColor === 'blue') {
        showtimeText = '#63b3ed';
      } else if (primaryColor === 'white' || primaryColor === 'cleardark' || primaryColor === 'black') {
        showtimeText = '#ffffff';
      }
    } else {
      if (primaryColor === 'violet') {
        showtimeText = '#444cf7';
      } else if (primaryColor === 'blue') {
        showtimeText = '#0161A7';
      } else if (primaryColor === 'white' || primaryColor === 'cleardark' || primaryColor === 'black') {
        showtimeText = '#111111';
      }
    }

    return {
      ...baseColors,
      ...primary,
      showtimeText,
    };
  }, [isDark, primaryColor]);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    root.setAttribute('data-primary', primaryColor);
    root.classList.toggle('dark', isDark);
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-hover', colors.primaryHover);
    root.style.setProperty('--primary-contrast', colors.primaryContrast);
    root.style.setProperty('--showtime-text', colors.showtimeText);
  }, [isDark, primaryColor, colors, mounted]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem('cinelyon_theme_mode', newMode);
    } catch {
      // Ignorer
    }
  };

  const setPrimaryColor = (newColor: PrimaryColorVariant) => {
    setPrimaryColorState(newColor);
    try {
      localStorage.setItem('cinelyon_theme_primary', newColor);
    } catch {
      // Ignorer
    }
  };

  const setLiquidGlassEnabled = (enabled: boolean) => {
    setLiquidGlassEnabledState(enabled);
    try {
      localStorage.setItem('cinelyon_liquid_glass', String(enabled));
    } catch {
      // Ignorer
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        primaryColor,
        isDark,
        liquidGlassEnabled,
        colors,
        setMode,
        setPrimaryColor,
        setLiquidGlassEnabled,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
