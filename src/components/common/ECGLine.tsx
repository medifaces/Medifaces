import React from 'react';

export const ECGLine: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center w-full overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 320 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-8 stroke-white/80"
      >
        <path
          d="M 0 18 L 60 18 L 75 18 L 85 4 L 95 32 L 105 10 L 115 22 L 125 18 L 190 18 L 205 18 L 215 4 L 225 32 L 235 10 L 245 22 L 255 18 L 305 18"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Titik Amber di Ujung */}
        <circle cx="312" cy="18" r="4.5" fill="#F2A65A" />
      </svg>
    </div>
  );
};
