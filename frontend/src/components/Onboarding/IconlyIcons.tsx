import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  twoTone?: boolean;
}

export const IconlySearch: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`iconly-icon ${className}`}
  >
    <circle
      cx="11.7666"
      cy="11.7666"
      r="8.98856"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.0183 18.4851L21.5423 22"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 11.7666C8.5 9.96 9.96 8.5 11.7666 8.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.45"
    />
  </svg>
);

export const IconlyCode: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`iconly-icon ${className}`}
  >
    {}
    <rect
      x="2"
      y="3.5"
      width="20"
      height="14"
      rx="4"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Dấu code < và > */}
    <path
      d="M8.5 8.5L6.5 10.5L8.5 12.5"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.5 8.5L17.5 10.5L15.5 12.5"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.75 8L11.25 13"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.5"
    />
    {}
    <path
      d="M8.5 20.5H15.5"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    <path
      d="M12 17.5V20.5"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      opacity="0.45"
    />
  </svg>
);

export const IconlyAiChip: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`iconly-icon ${className}`}
  >
    {}
    <rect
      x="5"
      y="5"
      width="14"
      height="14"
      rx="3.5"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {}
    <path
      d="M12 8.5V15.5M8.5 12H15.5"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="2" fill={color} opacity="0.35" />
    {}
    <path
      d="M8.5 2V5M15.5 2V5M8.5 19V22M15.5 19V22M2 8.5H5M2 15.5H5M19 8.5H22M19 15.5H22"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.6"
    />
  </svg>
);

export const IconlyPalette: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`iconly-icon ${className}`}
  >
    {}
    <path
      d="M12 2C6.48 2 2 6.48 2 12C2 15.11 3.42 17.88 5.67 19.68C6.34 20.22 7.23 20.25 7.9 19.78C8.56 19.32 8.94 18.52 8.87 17.72C8.75 16.32 9.87 15.15 11.27 15.15H13C16.87 15.15 20 12.02 20 8.15C20 4.75 16.42 2 12 2Z"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {}
    <circle cx="7.5" cy="10" r="1.5" fill={color} />
    <circle cx="11.5" cy="7" r="1.5" fill={color} />
    <circle cx="15.5" cy="10" r="1.5" fill={color} opacity="0.5" />
  </svg>
);

export const IconlyGraph: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`iconly-icon ${className}`}
  >
    {}
    <path
      d="M21 21H5.4C4.07 21 3 19.93 3 18.6V3"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.5 15L11 10.5L14.5 14L20 8.5"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 8.5H20V11.5"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {}
    <circle cx="11" cy="10.5" r="1" fill={color} opacity="0.4" />
    <circle cx="14.5" cy="14" r="1" fill={color} opacity="0.4" />
  </svg>
);

export const IconlyDigital: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`iconly-icon ${className}`}
  >
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="5"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {}
    <path
      d="M13 7L8.5 13H12L11 17L15.5 11H12L13 7Z"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.2"
    />
  </svg>
);

export const IconlyDocument: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`iconly-icon ${className}`}
  >
    <path
      d="M15.75 2H8.25C5.03 2 3 4.29 3 7.52V16.48C3 19.71 5.03 22 8.25 22H15.75C18.97 22 21 19.71 21 16.48V7.52C21 4.29 18.97 2 15.75 2Z"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 8H16M8 12.5H13M8 17H11"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.5"
    />
  </svg>
);

export const IconlyDiscovery: React.FC<IconProps> = ({
  size = 32,
  color = 'currentColor',
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`iconly-icon ${className}`}
  >
    {/* Vòng ngoài la bàn */}
    <circle
      cx="12"
      cy="12"
      r="9.5"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {}
    <path
      d="M14.83 9.17L13.12 13.12L9.17 14.83L10.88 10.88L14.83 9.17Z"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.25"
    />
    <circle cx="12" cy="12" r="1.5" fill={color} />
  </svg>
);

export const IconlyWork: React.FC<IconProps> = ({
  size = 32,
  color = 'currentColor',
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`iconly-icon ${className}`}
  >
    {}
    <rect
      x="3"
      y="7"
      width="18"
      height="13"
      rx="3.5"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {}
    <path
      d="M8.5 7V5C8.5 3.9 9.4 3 10.5 3H13.5C14.6 3 15.5 3.9 15.5 5V7"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {}
    <path
      d="M3 12H21"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.4"
    />
    <rect
      x="10.5"
      y="10.5"
      width="3"
      height="3"
      rx="1"
      fill={color}
      fillOpacity="0.3"
      stroke={color}
      strokeWidth="1.2"
    />
  </svg>
);

export const IconlyAward: React.FC<IconProps> = ({
  size = 32,
  color = 'currentColor',
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`iconly-icon ${className}`}
  >
    {}
    <circle
      cx="12"
      cy="9"
      r="6"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {}
    <path
      d="M12 6.5L13.1 8.7L15.5 9.1L13.8 10.7L14.2 13.1L12 11.9L9.8 13.1L10.2 10.7L8.5 9.1L10.9 8.7L12 6.5Z"
      fill={color}
      fillOpacity="0.3"
      stroke={color}
      strokeWidth="1.2"
    />
    {}
    <path
      d="M8.2 13.8L6.5 21L12 18.2L17.5 21L15.8 13.8"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconlyFilter: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`iconly-icon ${className}`}
  >
    <path
      d="M3 5H21M6 12H18M10 19H14"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconlyTick: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`iconly-icon ${className}`}
  >
    <path
      d="M7 12.5L10.5 16L17.5 8"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconlySwap: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`iconly-icon ${className}`}
  >
    {/* Mũi tên trên: chỉ sang phải */}
    <path
      d="M4.5 8.5H19.5M15.5 4.5L19.5 8.5L15.5 12.5"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Mũi tên dưới: chỉ sang trái */}
    <path
      d="M19.5 15.5H4.5M8.5 19.5L4.5 15.5L8.5 11.5"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="10" cy="8.5" r="1.5" fill={color} fillOpacity="0.4" />
    <circle cx="14" cy="15.5" r="1.5" fill={color} fillOpacity="0.4" />
  </svg>
);

export const IconlyChat: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`iconly-icon ${className}`}
  >
    <path
      d="M17 3.5H7C4.5 3.5 3 5.3 3 7.8V13.8C3 16.3 4.5 18.1 7 18.1H8.5V20.5C8.5 21.3 9.4 21.8 10.1 21.3L13.8 18.1H17C19.5 18.1 21 16.3 21 13.8V7.8C21 5.3 19.5 3.5 17 3.5Z"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="8" cy="11" r="1.25" fill={color} fillOpacity="0.4" />
    <circle cx="12" cy="11" r="1.25" fill={color} fillOpacity="0.7" />
    <circle cx="16" cy="11" r="1.25" fill={color} />
  </svg>
);

export const IconlyWallet: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`iconly-icon ${className}`}
  >
    <path
      d="M18.5 5.5H5.5C3.8 5.5 2.5 6.8 2.5 8.5V17.5C2.5 19.2 3.8 20.5 5.5 20.5H18.5C20.2 20.5 21.5 19.2 21.5 17.5V8.5C21.5 6.8 20.2 5.5 18.5 5.5Z"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 5.5V4.5C5 3.4 5.9 2.5 7 2.5H17C18.1 2.5 19 3.4 19 4.5V5.5"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.5"
    />
    <path
      d="M17 13.5H21.5V16H17C16.2 16 15.5 15.3 15.5 14.5C15.5 13.7 16.2 13.5 17 13.5Z"
      stroke={color}
      strokeWidth="1.5"
      fill={color}
      fillOpacity="0.25"
    />
  </svg>
);

export const IconlyHeart: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`iconly-icon ${className}`}
  >
    <path
      d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.5 11.5L9.5 13.5L14 9"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.4"
    />
  </svg>
);
