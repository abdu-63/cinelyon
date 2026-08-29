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
      className={`p-4 rounded-3xl border flex items-start gap-3.5 transition-all ${
        isPositive
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          : 'bg-white/5 border-white/10 text-neutral-300'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
          isPositive ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-neutral-400'
        }`}
      >
        {isPositive ? <Sparkles size={18} /> : <Film size={18} />}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-white">{info.title || 'Scènes Post-Générique'}</span>
          <span
            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
              isPositive ? 'bg-amber-500/30 text-amber-300' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {info.badgeLabel || (isPositive ? 'Scène présente' : 'Aucune scène')}
          </span>
        </div>
        {info.summary && (
          <p className="text-xs text-neutral-300/80 mt-1 leading-relaxed">{info.summary}</p>
        )}
      </div>
    </div>
  );
}
