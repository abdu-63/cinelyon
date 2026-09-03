// src/context/ThemeContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { LIGHT_COLORS, DARK_COLORS, PRIMARY_VARIANTS } from '@/lib/theme';

export type ThemeMode = 'light' | 'dark' | 'system';
export type PrimaryColorVariant = 'violet' | 'blue' | 'white' | 'black' | 'cleardark';
export type LiquidGlassMode = 'disabled' | 'medium' | 'high';

interface ThemeContextType {
  mode: ThemeMode;
  primaryColor: PrimaryColorVariant;
  isDark: boolean;
  liquidGlassEnabled: boolean;
  liquidGlassMode: LiquidGlassMode;
  colors: typeof LIGHT_COLORS & typeof PRIMARY_VARIANTS.violet;
  setMode: (mode: ThemeMode) => void;
  setPrimaryColor: (color: PrimaryColorVariant) => void;
  setLiquidGlassEnabled: (enabled: boolean) => void;
  setLiquidGlassMode: (mode: LiquidGlassMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [primaryColor, setPrimaryColorState] = useState<PrimaryColorVariant>('violet');
  const [liquidGlassMode, setLiquidGlassModeState] = useState<LiquidGlassMode>('medium');
  const [systemIsDark, setSystemIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const storedMode = localStorage.getItem('cinelyon_theme_mode') as ThemeMode | null;
      const storedColor = localStorage.getItem('cinelyon_theme_primary') as PrimaryColorVariant | null;
      const storedGlassMode = localStorage.getItem('cinelyon_liquid_glass_mode') as LiquidGlassMode | null;

      if (storedMode) setModeState(storedMode);
      if (storedColor) setPrimaryColorState(storedColor);

      if (storedGlassMode === 'medium' || storedGlassMode === 'high') {
        setLiquidGlassModeState(storedGlassMode);
      } else {
        setLiquidGlassModeState('medium');
      }

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

  const liquidGlassEnabled = useMemo(() => liquidGlassMode !== 'disabled', [liquidGlassMode]);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    root.setAttribute('data-primary', primaryColor);
    root.setAttribute('data-liquid-glass', liquidGlassMode);
    root.classList.toggle('dark', isDark);
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-hover', colors.primaryHover);
    root.style.setProperty('--primary-contrast', colors.primaryContrast);
    root.style.setProperty('--showtime-text', colors.showtimeText);

    if (liquidGlassMode === 'disabled') {
      root.style.setProperty('--glass-blur', '0px');
      root.style.setProperty('--glass-saturate', '100%');
      root.style.setProperty('--glass-card-bg', isDark ? '#1c1c1e' : '#ffffff');
      root.style.setProperty('--glass-card-border', isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)');
      root.style.setProperty('--glass-card-shadow', isDark ? '0 8px 24px rgba(0, 0, 0, 0.45)' : '0 4px 16px rgba(0, 0, 0, 0.04)');
    } else if (liquidGlassMode === 'medium') {
      root.style.setProperty('--glass-blur', '14px');
      root.style.setProperty('--glass-saturate', '150%');
      root.style.setProperty('--glass-card-bg', isDark ? 'rgba(28, 28, 30, 0.84)' : 'rgba(255, 255, 255, 0.86)');
      root.style.setProperty('--glass-card-border', isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.07)');
      root.style.setProperty('--glass-card-shadow', isDark ? '0 8px 28px rgba(0, 0, 0, 0.45)' : '0 4px 18px rgba(0, 0, 0, 0.05)');
    } else {
      // high / crystal
      root.style.setProperty('--glass-blur', '22px');
      root.style.setProperty('--glass-saturate', '190%');
      root.style.setProperty('--glass-card-bg', isDark ? 'rgba(28, 28, 30, 0.65)' : 'rgba(255, 255, 255, 0.75)');
      root.style.setProperty('--glass-card-border', isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.09)');
      root.style.setProperty('--glass-card-shadow', isDark ? '0 12px 36px rgba(0, 0, 0, 0.55)' : '0 6px 24px rgba(0, 0, 0, 0.06)');
    }
  }, [isDark, primaryColor, liquidGlassMode, colors, mounted]);

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

  const setLiquidGlassMode = (newMode: LiquidGlassMode) => {
    setLiquidGlassModeState(newMode);
    try {
      localStorage.setItem('cinelyon_liquid_glass_mode', newMode);
      localStorage.setItem('cinelyon_liquid_glass', String(newMode !== 'disabled'));
    } catch {
      // Ignorer
    }
  };

  const setLiquidGlassEnabled = (enabled: boolean) => {
    setLiquidGlassMode(enabled ? 'high' : 'disabled');
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        primaryColor,
        isDark,
        liquidGlassEnabled,
        liquidGlassMode,
        colors,
        setMode,
        setPrimaryColor,
        setLiquidGlassEnabled,
        setLiquidGlassMode,
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
