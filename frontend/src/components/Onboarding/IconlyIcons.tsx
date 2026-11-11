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

export const IconlyHeart: React.FC<IconProps & { filled?: boolean }> = ({
  size = 24,
  color = 'currentColor',
  filled = false,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? color : 'none'}
    xmlns="http://www.w3.org/2000/svg"
    className={`iconly-icon ${className}`}
  >
    <path
      d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={filled ? color : 'none'}
    />
  </svg>
);

export const IconlyShield: React.FC<IconProps> = ({
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
    <path
      d="M12 21.8C12 21.8 19.5 17.65 19.5 11.45V5.55C19.5 4.9 19.05 4.33 18.42 4.18L12.42 2.24C12.15 2.15 11.85 2.15 11.58 2.24L5.58 4.18C4.95 4.33 4.5 4.9 4.5 5.55V11.45C4.5 17.65 12 21.8 12 21.8Z"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.5 11.8L11.2 13.5L14.8 9.9"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.45"
    />
  </svg>
);

export const IconlyTimeCircle: React.FC<IconProps> = ({
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
      cx="12"
      cy="12"
      r="9.5"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 7.5V12.2L15.3 14.2"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconlyFolder: React.FC<IconProps> = ({
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
    <path
      d="M21 17.5C21 19.43 19.43 21 17.5 21H6.5C4.57 21 3 19.43 3 17.5V6.5C3 4.57 4.57 3 6.5 3H9.2C10.22 3 11.18 3.47 11.8 4.28L12.7 5.46C13.12 6.01 13.76 6.32 14.44 6.32H17.5C19.43 6.32 21 7.89 21 9.82V17.5Z"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.5 14H16.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.45"
    />
  </svg>
);

export const IconlyDevice: React.FC<IconProps> = ({
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
    <rect
      x="3"
      y="4"
      width="18"
      height="12"
      rx="2.5"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 20H17"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 16V20"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.45"
    />
  </svg>
);

export const IconlyStar: React.FC<IconProps> = ({
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
    <path
      d="M11.238 2.50299C11.547 1.83199 12.453 1.83199 12.762 2.50299L15.039 7.44799C15.165 7.72099 15.423 7.91099 15.72 7.94099L21.036 8.48399C21.758 8.55799 22.049 9.47299 21.503 9.95499L17.513 13.483C17.288 13.682 17.189 13.993 17.251 14.288L18.371 19.516C18.523 20.226 17.76 20.792 17.135 20.422L12.533 17.697C12.274 17.544 11.726 17.544 11.467 17.697L6.865 20.422C6.24 20.792 5.477 20.226 5.629 19.516L6.749 14.288C6.811 13.993 6.712 13.682 6.487 13.483L2.497 9.95499C1.951 9.47299 2.242 8.55799 2.964 8.48399L8.28 7.94099C8.577 7.91099 8.835 7.72099 8.961 7.44799L11.238 2.50299Z"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconlyUserGroup: React.FC<IconProps> = ({
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
    <path
      d="M17.5 19V17.5C17.5 15.29 15.71 13.5 13.5 13.5H7.5C5.29 13.5 3.5 15.29 3.5 17.5V19"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="10.5"
      cy="7.5"
      r="4"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20.5 18.5V17.5C20.5 15.79 19.34 14.34 17.75 13.84"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.45"
    />
    <path
      d="M15.5 4.14C16.69 4.67 17.5 5.86 17.5 7.25C17.5 8.64 16.69 9.83 15.5 10.36"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.45"
    />
  </svg>
);

export const IconlyPlay: React.FC<IconProps> = ({
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
    <path
      d="M18.89 10.35L7.99 4.05C6.67 3.29 5 4.24 5 5.76V18.24C5 19.76 6.67 20.71 7.99 19.95L18.89 13.65C20.21 12.89 20.21 11.11 18.89 10.35Z"
      fill={color}
      fillOpacity="0.18"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconlyBuy: React.FC<IconProps> = ({
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
    <path
      d="M21.71 8.21C21.43 7.82 20.97 7.58 20.48 7.58H5.97L5.61 5.37C5.47 4.54 4.75 3.92 3.91 3.92H2.75C2.34 3.92 2 4.26 2 4.67C2 5.08 2.34 5.42 2.75 5.42H3.91C4.08 5.42 4.23 5.55 4.25 5.72L5.97 16.3C6.11 17.13 6.83 17.75 7.67 17.75H18.77C19.59 17.75 20.3 17.16 20.46 16.36L21.96 9.86C22.06 9.29 21.98 8.61 21.71 8.21Z"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="7.75"
      cy="20.5"
      r="1.25"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="18.25"
      cy="20.5"
      r="1.25"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconlyDelete: React.FC<IconProps> = ({
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
    <path
      d="M19.3248 9.46826C19.3248 9.46826 18.7818 16.2033 18.4668 19.0403C18.3168 20.3953 17.4798 21.1893 16.1088 21.2143C13.4998 21.2613 10.8878 21.2643 8.27979 21.2093C6.96079 21.1823 6.13779 20.3783 5.99079 19.0473C5.67379 16.1853 5.13379 9.46826 5.13379 9.46826"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20.708 6.2397H3.75"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17.4406 6.2397C16.6556 6.2397 15.9796 5.6847 15.8256 4.9157L15.5826 3.6997C15.4326 3.1387 14.9246 2.7507 14.3456 2.7507H10.1126C9.53358 2.7507 9.02558 3.1387 8.87558 3.6997L8.63258 4.9157C8.47858 5.6847 7.80258 6.2397 7.01758 6.2397"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconlyCategory: React.FC<IconProps> = ({
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
    <rect
      x="3"
      y="3"
      width="7.5"
      height="7.5"
      rx="2.5"
      stroke={color}
      strokeWidth="1.75"
    />
    <rect
      x="13.5"
      y="3"
      width="7.5"
      height="7.5"
      rx="2.5"
      stroke={color}
      strokeWidth="1.75"
    />
    <rect
      x="3"
      y="13.5"
      width="7.5"
      height="7.5"
      rx="2.5"
      stroke={color}
      strokeWidth="1.75"
    />
    <rect
      x="13.5"
      y="13.5"
      width="7.5"
      height="7.5"
      rx="2.5"
      stroke={color}
      strokeWidth="1.75"
    />
  </svg>
);

export const IconlyDiscount: React.FC<IconProps> = ({
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
    <path
      d="M9.011 20.5H14.99C18.49 20.5 20.5 18.49 20.5 14.99V9.01C20.5 5.51 18.49 3.5 14.99 3.5H9.011C5.511 3.5 3.5 5.51 3.5 9.01V14.99C3.5 18.49 5.511 20.5 9.011 20.5Z"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.009 15L15 8.999"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="9.5" cy="9.5" r="1.25" fill={color} />
    <circle cx="14.5" cy="14.5" r="1.25" fill={color} />
  </svg>
);

export const IconlySetting: React.FC<IconProps> = ({
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
    <circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth="1.75" />
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1 2.83-2.83l.06-.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconlyEdit: React.FC<IconProps> = ({
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
    <path
      d="M13.26 3.59997L5.05 12.29C4.74 12.62 4.44 13.27 4.38 13.72L4.01 16.96C3.88 18.13 4.72 18.93 5.88 18.73L9.1 18.18C9.55 18.1 10.18 17.77 10.49 17.43L18.7 8.73997C20.12 7.23997 20.76 5.52997 18.55 3.43997C16.35 1.36997 14.68 2.09997 13.26 3.59997Z"
      stroke={color}
      strokeWidth="1.75"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.89 5.05005C12.32 7.81005 14.56 9.92005 17.34 10.2"
      stroke={color}
      strokeWidth="1.75"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 22H21"
      stroke={color}
      strokeWidth="1.75"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconlyPlus: React.FC<IconProps> = ({
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
    <path
      d="M12 5V19M5 12H19"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconlyClose: React.FC<IconProps> = ({
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
    <path
      d="M18 6L6 18M6 6L18 18"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconlyLogout: React.FC<IconProps> = ({
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
    <path
      d="M8.9 7.56C9.21 3.96 11.06 2.49 15.11 2.49H15.24C19.71 2.49 21.5 4.28 21.5 8.75V15.27C21.5 19.74 19.71 21.53 15.24 21.53H15.11C11.09 21.53 9.24 20.08 8.91 16.54"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15 12H3.62"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.85 8.65L2.5 12L5.85 15.35"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconlyHome: React.FC<IconProps> = ({
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
    <path
      d="M9.02 2.84016L3.63 7.04016C2.73 7.74016 2 9.23016 2 10.3602V17.7702C2 20.0902 3.89 21.9902 6.21 21.9902H17.79C20.11 21.9902 22 20.0902 22 17.7802V10.5002C22 9.29016 21.19 7.74016 20.2 7.05016L14.02 2.72016C12.62 1.74016 10.37 1.79016 9.02 2.84016Z"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 17.99V14.99"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconlyImage: React.FC<IconProps> = ({
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
    <path
      d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 10C10.1046 10 11 9.10457 11 8C11 6.89543 10.1046 6 9 6C7.89543 6 7 6.89543 7 8C7 9.10457 7.89543 10 9 10Z"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.67 18.9501L7.6 15.6401C8.39 15.1101 9.53 15.1701 10.24 15.7801L10.57 16.0701C11.35 16.7401 12.61 16.7401 13.39 16.0701L17.55 12.5001C18.33 11.8301 19.59 11.8301 20.37 12.5001L22 13.9001"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconlyArrowUp: React.FC<IconProps> = ({
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
    <path
      d="M12 19V5M5 12L12 5L19 12"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconlyArrowDown: React.FC<IconProps> = ({
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
    <path
      d="M12 5V19M5 12L12 19L19 12"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconlyArrowLeft: React.FC<IconProps> = ({
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
    <path
      d="M19 12H5M12 19L5 12L12 5"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconlyLock: React.FC<IconProps> = ({
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
    <path
      d="M16.423 9.4478V7.3008C16.423 4.7878 14.385 2.7498 11.872 2.7498C9.35902 2.7388 7.31302 4.7668 7.30202 7.2808V7.3008V9.4478"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15.683 21.2496H8.042C5.948 21.2496 4.25 19.5526 4.25 17.4576V13.1686C4.25 11.0736 5.948 9.37659 8.042 9.37659H15.683C17.777 9.37659 19.475 11.0736 19.475 13.1686V17.4576C19.475 19.5526 17.777 21.2496 15.683 21.2496Z"
      fill={color}
      fillOpacity="0.14"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.8628 14.2026V16.4236"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconlyShow: React.FC<IconProps> = ({
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
    <path
      d="M15.1615 12.0531C15.1615 13.7991 13.7455 15.2141 11.9995 15.2141C10.2535 15.2141 8.8385 13.7991 8.8385 12.0531C8.8385 10.3061 10.2535 8.89111 11.9995 8.89111C13.7455 8.89111 15.1615 10.3061 15.1615 12.0531Z"
      fill={color}
      fillOpacity="0.18"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.998 19.3549C15.806 19.3549 19.289 16.6169 21.25 12.0529C19.289 7.48888 15.806 4.75088 11.998 4.75088H12.002C8.194 4.75088 4.711 7.48888 2.75 12.0529C4.711 16.6169 8.194 19.3549 12.002 19.3549H11.998Z"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconlyDanger: React.FC<IconProps> = ({
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
    <path
      d="M4.81409 20.4368H19.1971C20.7791 20.4368 21.7721 18.7268 20.9861 17.3528L13.8001 4.78782C13.0091 3.40482 11.0151 3.40382 10.2231 4.78682L3.02609 17.3518C2.23909 18.7258 3.23109 20.4368 4.81409 20.4368Z"
      fill={color}
      fillOpacity="0.14"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.0024 13.4148V10.3148"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="16.4" r="0.95" fill={color} />
  </svg>
);

export const IconlyBookmark: React.FC<IconProps> = ({
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
    <path
      d="M19.739 6.1536C19.739 3.4026 17.858 2.3006 15.15 2.3006H8.791C6.167 2.3006 4.2 3.3276 4.2 5.9706V20.6936C4.2 21.4196 4.981 21.8766 5.613 21.5226L11.995 17.9426L18.322 21.5166C18.955 21.8736 19.739 21.4156 19.739 20.6886V6.1536Z"
      fill={color}
      fillOpacity="0.14"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.27148 9.02811H15.5895"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.7"
    />
  </svg>
);
