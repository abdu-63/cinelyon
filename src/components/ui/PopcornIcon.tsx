// src/components/ui/PopcornIcon.tsx
import React from 'react';

interface PopcornIconProps {
  size?: number;
  className?: string;
}

export function PopcornIcon({ size = 20, className = '' }: PopcornIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Box */}
      <path
        d="M6 9L8 21H16L18 9H6Z"
        fill="#E11D48"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Stripes */}
      <path d="M10 9L10.5 21" stroke="#FFFFFF" strokeWidth="1.5" />
      <path d="M14 9L13.5 21" stroke="#FFFFFF" strokeWidth="1.5" />
      {/* Popcorn Kernels on Top */}
      <path
        d="M7 9C5.5 9 4.5 7.5 5.5 6C5 4.5 6.5 3 8 3.5C9.5 2.5 11.5 3 12 4.5C12.8 3 14.8 2.8 16 4C17.5 3.5 19 4.8 18.5 6.5C19.5 7.5 19 9 17.5 9"
        fill="#FBBF24"
        stroke="#D97706"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="6" r="1" fill="#F59E0B" />
      <circle cx="14" cy="5.5" r="1" fill="#F59E0B" />
    </svg>
  );
}
