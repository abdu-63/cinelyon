// src/components/ui/RottenTomatoesIcon.tsx
import React from 'react';

interface RottenTomatoesIconProps {
  size?: number;
  className?: string;
}

export function RottenTomatoesIcon({ size = 16, className = '' }: RottenTomatoesIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Tomato Body */}
      <circle cx="12" cy="14" r="8" fill="#FA320A" />
      <path
        d="M12 7C9.5 7 5 9 5 14C5 18.5 8.5 21 12 21C15.5 21 19 18.5 19 14C19 9 14.5 7 12 7Z"
        fill="#FA320A"
      />
      {/* Tomato Green Leaf / Stem */}
      <path
        d="M12 4V7M12 7L9 5M12 7L15 5M12 7L8 8M12 7L16 8"
        stroke="#469632"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
