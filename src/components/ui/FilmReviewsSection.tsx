// src/components/ui/FilmReviewsSection.tsx
'use client';

import React, { useState } from 'react';
import { MessageSquare, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { Review } from '@/types';
import { decodeHtmlEntities } from '@/utils/textUtils';

interface FilmReviewsSectionProps {
  reviews?: Review[];
  rating?: string;
}

export function FilmReviewsSection({ reviews, rating }: FilmReviewsSectionProps) {
  const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});

  const toggleExpand = (idx: number) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const renderStars = (score: number) => {
    const stars = [];
    const fullStars = Math.floor(score);
    const hasHalf = score % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star key={i} size={12} className="fill-[#fecc00] text-[#fecc00]" />
        );
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(
          <div key={i} className="relative inline-flex items-center justify-center w-3 h-3">
            <Star size={12} className="text-neutral-300 dark:text-neutral-700" />
            <div className="absolute inset-0 overflow-hidden w-[50%]">
              <Star size={12} className="fill-[#fecc00] text-[#fecc00]" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} size={12} className="text-neutral-300 dark:text-neutral-700" />
        );
      }
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  if (!reviews || reviews.length === 0) {
    return (
      <div className="space-y-2 px-1">
        <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-semibold text-sm">
          <MessageSquare size={16} className="text-[#444cf7]" />
          <span>Critiques Spectateurs</span>
        </div>
        <div className="p-4 rounded-[20px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 shadow-sm text-center py-6">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal">
            Aucune critique spectateur disponible pour le moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-semibold text-sm">
          <MessageSquare size={16} className="text-[#444cf7]" />
          <span>Critiques Spectateurs</span>
        </div>
        <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-[#444cf7] text-[11px] font-medium flex items-center justify-center">
          {reviews.length}
        </span>
      </div>

      <div className="space-y-2.5">
        {reviews.map((rev, idx) => {
          const author = decodeHtmlEntities(rev.author || 'Anonyme');
          const text = decodeHtmlEntities(rev.text || '');
          const initial = author.charAt(0).toUpperCase();
          const isExpanded = !!expandedReviews[idx];
          const isLong = text.length > 220;
          const displayText = isLong && !isExpanded ? `${text.slice(0, 220)}...` : text;
          const score = typeof rev.rating === 'number' ? rev.rating : 3;

          return (
            <div
              key={idx}
              className="p-4 rounded-[20px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/10 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#444cf7] flex items-center justify-center font-semibold text-xs shrink-0 select-none">
                    {initial}
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-neutral-900 dark:text-white leading-tight">
                      {author}
                    </h4>
                    {rev.date && (
                      <span className="text-[10px] text-neutral-400 font-normal block mt-0.5">
                        {rev.date}
                      </span>
                    )}
                  </div>
                </div>

                {renderStars(score)}
              </div>

              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal">
                {displayText}
              </p>

              {isLong && (
                <button
                  type="button"
                  onClick={() => toggleExpand(idx)}
                  className="text-xs font-medium text-[#444cf7] hover:underline flex items-center gap-1 pt-0.5"
                >
                  <span>{isExpanded ? 'Réduire' : 'Lire la suite'}</span>
                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
