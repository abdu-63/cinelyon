// src/components/ui/ToiletBreaksSection.tsx
'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { ToiletBreaksInfo, ToiletBreak, Film } from '@/types';
import { buildToiletBreaksInfo } from '@/utils/toiletBreakUtils';

interface ToiletBreaksSectionProps {
  info?: ToiletBreaksInfo | null;
  film?: Film | null;
}

export function ToiletBreaksSection({ info, film }: ToiletBreaksSectionProps) {
  const [isSectionOpen, setIsSectionOpen] = useState(true);
  const [expandedBreakId, setExpandedBreakId] = useState<string | null>('break-0');

  const breaksInfo: ToiletBreaksInfo | null = info || (film ? buildToiletBreaksInfo(film) : null);

  if (!breaksInfo || !breaksInfo.eligible || !breaksInfo.breaks || breaksInfo.breaks.length === 0) {
    return null;
  }

  const timesSummary = breaksInfo.breaks
    .map((b) => b.timestamp || `${b.timestampMinutes} min`)
    .join(' · ');

  return (
    <div className="space-y-2 px-1">
      {/* Header avec Titre + Badge horaire + Chevron d'ouverture */}
      <button
        type="button"
        onClick={() => setIsSectionOpen(!isSectionOpen)}
        className="w-full flex items-center justify-between text-left group select-none"
      >
        <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
          Pauses Toilettes
        </h3>
        <div className="flex items-center gap-2">
          <span className="px-3 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#4f5af6] border border-blue-200 dark:border-blue-800 text-xs font-semibold">
            {timesSummary}
          </span>
          {isSectionOpen ? (
            <ChevronUp size={16} className="text-neutral-400" />
          ) : (
            <ChevronDown size={16} className="text-neutral-400" />
          )}
        </div>
      </button>

      {isSectionOpen && (
        <div className="space-y-3 pt-1 animate-in fade-in duration-150">
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            Pauses de 3 min conseillées sans rater d&apos;élément clé de l&apos;intrigue :
          </p>

          <div className="space-y-3">
            {breaksInfo.breaks.map((b: ToiletBreak, idx: number) => {
              const breakId = b.id || `break-${idx}`;
              const isExpanded = expandedBreakId === breakId;

              return (
                <div key={breakId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {b.timestamp || `${b.timestampMinutes} min`}
                      </span>
                      <span className="text-neutral-500">
                        ({b.durationMinutes} min)
                      </span>
                      <span className="text-neutral-400">•</span>
                      {b.quality === 'best' ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Idéal</span>
                        </span>
                      ) : (
                        <span className="font-semibold text-[#4f5af6] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4f5af6]" />
                          <span>Secondaire</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedBreakId(isExpanded ? null : breakId)}
                      className="text-xs font-semibold text-[#4f5af6] hover:underline flex items-center gap-0.5"
                    >
                      <span>{isExpanded ? 'Masquer' : `Résumé ${b.durationMinutes} min`}</span>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>

                  {b.cue && (
                    <p className="text-xs text-neutral-700 dark:text-neutral-300">
                      <span className="font-medium text-neutral-500">Départ :</span> {b.cue}
                    </p>
                  )}

                  {isExpanded && (
                    <div className="p-3.5 rounded-[18px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 shadow-sm space-y-1 animate-in fade-in duration-150">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white">
                        <Sparkles size={13} className="text-[#4f5af6]" />
                        <span>Pendant les {b.durationMinutes} min :</span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {b.catchUpSummary ||
                          "Pendant votre absence, l'intrigue secondaire progresse calmement sans événement ni rebondissement majeur."}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
