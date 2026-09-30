import React from 'react';

interface VaaniLogoProps {
  className?: string;
  size?: number;
}

export const VaaniLogo: React.FC<VaaniLogoProps> = ({ className = 'w-8 h-8', size = 32 }) => {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="VAANI Logo"
    >
      <rect width="32" height="32" rx="8" fill="#141416" />
      {/* Outer Convergent Vector / Voice Crest */}
      <path
        d="M7 11.5L16 23.5L25 11.5"
        stroke="#F4F4F5"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner Harmonic Resonance Wave */}
      <path
        d="M11.5 11.5L16 17.5L20.5 11.5"
        stroke="#10B981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Sovereign Apex Beacon Pulse */}
      <circle cx="16" cy="7" r="1.5" fill="#10B981" />
    </svg>
  );
};
