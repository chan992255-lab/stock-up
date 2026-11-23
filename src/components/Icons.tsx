import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 22) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const WalletIcon = ({ size, ...rest }: P) => (
  <svg {...base(size)} {...rest}>
    <path d="M4 8.2A2.2 2.2 0 0 1 6.2 6h11.6A2.2 2.2 0 0 1 20 8.2v8.6A2.2 2.2 0 0 1 17.8 19H6.2A2.2 2.2 0 0 1 4 16.8V8.2Z" />
    <path d="M15.5 12.6h4.5" />
    <circle cx="15.2" cy="12.6" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const ChartIcon = ({ size, ...rest }: P) => (
  <svg {...base(size)} {...rest}>
    <path d="M4 19V5" opacity="0.5" />
    <path d="M7 15.5 10.5 11l3 2.5L20 6" />
    <path d="M16.2 6H20v3.6" />
  </svg>
);

export const CalcIcon = ({ size, ...rest }: P) => (
  <svg {...base(size)} {...rest}>
    <rect x="5" y="3.5" width="14" height="17" rx="2.6" />
    <path d="M8.5 7.5h7" />
    <path d="M8.6 12h.01M12 12h.01M15.4 12h.01M8.6 15.8h.01M12 15.8h.01M15.4 15.8h.01" strokeWidth="2.4" />
  </svg>
);

export const GameIcon = ({ size, ...rest }: P) => (
  <svg {...base(size)} {...rest}>
    <path d="M8.4 8h7.2c2.9 0 4.6 2.4 4.9 5.1.3 2.8-1.9 4.9-4.3 4.3-1-.3-2-.9-3-1.5-.8-.5-1.6-.5-2.4 0-1 .6-2 1.2-3 1.5-2.4.6-4.6-1.5-4.3-4.3C3.8 10.4 5.5 8 8.4 8Z" />
    <path d="M8.2 11.2v2.4M7 12.4h2.4" />
    <circle cx="15.6" cy="11.9" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="17.6" cy="13.6" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const SearchIcon = ({ size, ...rest }: P) => (
  <svg {...base(size)} {...rest}>
    <circle cx="11" cy="11" r="6.4" />
    <path d="m16 16 4 4" />
  </svg>
);

export const StarIcon = ({ size, filled, ...rest }: P & { filled?: boolean }) => (
  <svg {...base(size)} {...rest} fill={filled ? 'currentColor' : 'none'}>
    <path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4L4.2 9.7l5.4-.8L12 4Z" />
  </svg>
);

export const CloseIcon = ({ size, ...rest }: P) => (
  <svg {...base(size)} {...rest}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const ChevronIcon = ({ size, ...rest }: P) => (
  <svg {...base(size)} {...rest}>
    <path d="m9 5 7 7-7 7" />
  </svg>
);

export const PlusIcon = ({ size, ...rest }: P) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const MinusIcon = ({ size, ...rest }: P) => (
  <svg {...base(size)} {...rest}>
    <path d="M5 12h14" />
  </svg>
);

export const TrophyIcon = ({ size, ...rest }: P) => (
  <svg {...base(size)} {...rest}>
    <path d="M8 4h8v4.2a4 4 0 0 1-8 0V4Z" />
    <path d="M8 5.2H5.6v1.6A3.2 3.2 0 0 0 8.8 10M16 5.2h2.4v1.6A3.2 3.2 0 0 1 15.2 10" />
    <path d="M12 12.2V16M9 20h6M10 16h4" />
  </svg>
);

export const BoltIcon = ({ size, ...rest }: P) => (
  <svg {...base(size)} {...rest}>
    <path d="M13.4 3 5.8 13.4h4.9L10 21l7.6-10.4h-4.9L13.4 3Z" />
  </svg>
);

export const CandleIcon = ({ size, ...rest }: P) => (
  <svg {...base(size)} {...rest}>
    <path d="M7 4v3.2M7 15.2V20M17 4v2M17 11v9" />
    <rect x="4.8" y="7.2" width="4.4" height="8" rx="1" />
    <rect x="14.8" y="6" width="4.4" height="5" rx="1" />
  </svg>
);

export const InfoIcon = ({ size, ...rest }: P) => (
  <svg {...base(size)} {...rest}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M12 11v5.4" />
    <circle cx="12" cy="8.2" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const TrendIcon = ({ size, ...rest }: P) => (
  <svg {...base(size)} {...rest}>
    <path d="M4 16.5 9.2 11l3.4 3 6.4-6.6" />
    <path d="M15 7.4h4.4V12" />
  </svg>
);
