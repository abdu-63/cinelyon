// src/components/ui/PostCreditsBadge.tsx
'use client';

import React from 'react';
import { Sparkles, Film, HelpCircle } from 'lucide-react';
import { PostCreditsInfo } from '@/types';

interface PostCreditsBadgeProps {
  info?: PostCreditsInfo | null;
}

export function PostCreditsBadge({ info }: PostCreditsBadgeProps) {
  if (!info || info.status === 'unknown') return null;

  const isPositive = info.hasMidCredits || info.hasEndCredits;

  return (
    <div
      className={`p-4 rounded-[22px] border flex items-start gap-3.5 transition-all shadow-sm ${
        isPositive
          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
          : 'bg-white dark:bg-[#1c1c1e] border-black/[0.06] dark:border-white/10 text-neutral-700 dark:text-neutral-300'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
          isPositive ? 'bg-amber-500/20 text-amber-500' : 'bg-neutral-100 dark:bg-white/10 text-neutral-500 dark:text-neutral-400'
        }`}
      >
        {isPositive ? <Sparkles size={18} /> : <Film size={18} />}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-neutral-900 dark:text-white">{info.title || 'Scènes Post-Générique'}</span>
          <span
            className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
              isPositive ? 'bg-amber-100 dark:bg-amber-500/30 text-amber-700 dark:text-amber-300' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
            }`}
          >
            {info.badgeLabel || (isPositive ? 'Scène présente' : 'Aucune scène')}
          </span>
        </div>
        {info.summary && (
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">{info.summary}</p>
        )}
      </div>
    </div>
  );
}
