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
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [primaryColor, setPrimaryColorState] = useState<PrimaryColorVariant>('violet');
  const [liquidGlassEnabled, setLiquidGlassEnabledState] = useState<boolean>(true);
  const [systemIsDark, setSystemIsDark] = useState<boolean>(true);
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

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    root.setAttribute('data-primary', primaryColor);
    root.classList.toggle('dark', isDark);
  }, [isDark, primaryColor, mounted]);

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

  const colors = useMemo(() => {
    const baseColors = isDark ? DARK_COLORS : LIGHT_COLORS;
    const primary = PRIMARY_VARIANTS[primaryColor] || PRIMARY_VARIANTS.violet;
    return {
      ...baseColors,
      ...primary,
    };
  }, [isDark, primaryColor]);

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
