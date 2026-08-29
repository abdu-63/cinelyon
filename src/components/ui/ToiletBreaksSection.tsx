// src/components/ui/ToiletBreaksSection.tsx
'use client';

import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { ToiletBreaksInfo, ToiletBreak, Film } from '@/types';
import { buildToiletBreaksInfo } from '@/utils/toiletBreakUtils';

interface ToiletBreaksSectionProps {
  info?: ToiletBreaksInfo | null;
  film?: Film | null;
}

export function ToiletBreaksSection({ info, film }: ToiletBreaksSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const breaksInfo: ToiletBreaksInfo | null = info || (film ? buildToiletBreaksInfo(film) : null);

  if (!breaksInfo || !breaksInfo.eligible || !breaksInfo.breaks || breaksInfo.breaks.length === 0) {
    return null;
  }

  return (
    <div className="p-5 rounded-3xl liquid-glass border border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <Clock size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Pauses Conseillées (RunPee)</h3>
            <p className="text-xs text-neutral-400">
              Moments idéaux pour s&apos;absenter sans rater l&apos;intrigue
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
          {breaksInfo.breaks.length} pause{breaksInfo.breaks.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2.5">
        {breaksInfo.breaks.map((b: ToiletBreak, i: number) => {
          const isExpanded = expandedId === b.id || (expandedId === null && i === 0);
          return (
            <div
              key={b.id || i}
              className="rounded-2xl bg-black/30 border border-white/10 overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? '' : b.id)}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-blue-400 font-mono">
                    {b.timestamp || `${b.timestampMinutes} min`}
                  </span>
                  <span className="text-xs font-medium text-white">
                    Durée : {b.durationMinutes} min
                  </span>
                  {b.quality === 'best' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Idéal
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp size={16} className="text-neutral-400" />
                ) : (
                  <ChevronDown size={16} className="text-neutral-400" />
                )}
              </button>

              {isExpanded && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-white/5 space-y-2 text-xs text-neutral-300 animate-in fade-in duration-150">
                  {b.cue && (
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-0.5">
                        Signal de départ
                      </span>
                      <p>{b.cue}</p>
                    </div>
                  )}
                  {b.catchUpSummary && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
                        Ce qu&apos;il se passe pendant la pause
                      </span>
                      <p className="text-neutral-400 leading-relaxed">{b.catchUpSummary}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
