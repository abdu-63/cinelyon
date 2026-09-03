// src/components/navigation/FloatingLiquidGlassTabBar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Film, Heart, Sparkles, Settings } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/context/ThemeContext';

interface NavItem {
  key: string;
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }>;
  isAction?: boolean;
  actionId?: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'films', href: '/', labelKey: 'navigation.films', icon: Film },
  { key: 'favorites', href: '/#favorites', labelKey: 'navigation.favorites', icon: Heart },
  { key: 'cinebot', href: '#cinebot', labelKey: 'cinebot.title', icon: Sparkles, isAction: true, actionId: 'open-cinebot' },
  { key: 'settings', href: '#settings', labelKey: 'navigation.settings', icon: Settings, isAction: true, actionId: 'open-settings' },
];

export function FloatingLiquidGlassTabBar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isDark, primaryColor, colors } = useTheme();

  const isMonochrome =
    primaryColor === 'white' ||
    primaryColor === 'black' ||
    primaryColor === 'cleardark';

  const activeIconColor = isMonochrome
    ? isDark
      ? '#ffffff'
      : '#121212'
    : colors.primary;

  const handleAction = (actionId?: string) => {
    if (actionId === 'open-cinebot') {
      window.dispatchEvent(new CustomEvent('cinelyon:open-cinebot'));
    } else if (actionId === 'open-settings') {
      window.dispatchEvent(new CustomEvent('cinelyon:open-settings'));
    }
  };

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center pointer-events-none md:hidden px-4">
      <nav
        aria-label="Navigation mobile principale"
        className="pointer-events-auto liquid-glass-dock rounded-full px-2 py-2 flex items-center gap-1 max-w-md w-full justify-around shadow-2xl"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : !item.isAction && pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleAction(item.actionId)}
                aria-label={t(item.labelKey)}
                className="relative flex flex-col items-center justify-center w-14 h-12 rounded-full transition-transform active:scale-95 text-neutral-400 hover:text-white"
              >
                <Icon size={20} className="stroke-[2.2]" />
                <span className="text-[10px] font-medium tracking-tight mt-0.5 opacity-80">{t(item.labelKey)}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              aria-label={t(item.labelKey)}
              className="relative flex flex-col items-center justify-center w-14 h-12 rounded-full transition-transform active:scale-95 text-neutral-400 hover:text-neutral-200"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className={`absolute inset-0 rounded-full shadow-inner ${
                    isMonochrome
                      ? isDark
                        ? 'bg-white/15 border border-white/25'
                        : 'bg-black/10 border border-black/15'
                      : 'bg-primary/20 border border-primary/40'
                  }`}
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <Icon
                size={20}
                className="stroke-[2.2] relative z-10 drop-shadow-sm"
                style={{ color: isActive ? activeIconColor : undefined }}
              />
              <span
                className={`text-[10px] font-medium tracking-tight mt-0.5 relative z-10 ${
                  isActive ? 'font-semibold' : 'opacity-80'
                }`}
                style={{ color: isActive ? activeIconColor : undefined }}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
