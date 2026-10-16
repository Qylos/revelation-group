import React from 'react';

export const WavyCoralUnderline: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 120 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-full h-2.5 ${className}`}
    preserveAspectRatio="none"
  >
    <path
      d="M2 7C18 2 30 11 46 6C62 1 74 11 90 6C102 2 110 9 118 5"
      stroke="#F25C54"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
  </svg>
);

export const DoodleStar: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-6 h-6',
  color = '#FDE047',
}) => (
  <svg
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M18 2L21.8 13.5L34 15.2L24.5 22.8L27.5 34L18 27.5L8.5 34L11.5 22.8L2 15.2L14.2 13.5L18 2Z"
      fill={color}
      stroke="#111827"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

export const DoodleSparkle: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-6 h-6',
  color = '#1A45E5',
}) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M16 2C16 10.5 21.5 16 30 16C21.5 16 16 21.5 16 30C16 21.5 10.5 16 2 16C10.5 16 16 10.5 16 2Z"
      fill={color}
    />
  </svg>
);

export const DoodleCurvedArrow: React.FC<{ className?: string }> = ({
  className = 'w-12 h-12',
}) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10 48C18 22 36 16 54 20"
      stroke="#111827"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeDasharray="3 3"
    />
    <path
      d="M46 12L55 20L45 27"
      stroke="#111827"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ProfitLossBadge: React.FC<{
  status: 'PROFIT' | 'LOSS';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ status, label, size = 'md' }) => {
  const isProfit = status === 'PROFIT';
  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-0.5 text-xs'
      : size === 'lg'
      ? 'px-4 py-1.5 text-sm'
      : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold tracking-wide border ${sizeClasses} ${
        isProfit
          ? 'bg-profit-bg text-profit-text border-profit-accent'
          : 'bg-loss-bg text-loss-text border-loss-accent'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isProfit ? 'bg-profit-text' : 'bg-loss-accent'
        }`}
      />
      {label || (isProfit ? 'PROFIT / UNTUNG' : 'LOSS / RUGI')}
    </span>
  );
};
