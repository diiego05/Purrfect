import React from 'react';

// Cặp ngôi sao 4 cánh lấp lánh (Corner sparkles: 1 lớn, 1 nhỏ)
export const SparkleCorner: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <svg
    className={`sparkle-corner-svg ${className}`}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Ngôi sao lớn chính diện */}
    <path
      d="M18 2 C18.8 9.5 24.5 15.2 32 16 C24.5 16.8 18.8 22.5 18 30 C17.2 22.5 11.5 16.8 4 16 C11.5 15.2 17.2 9.5 18 2 Z"
      fill="#FFFFFF"
    />
    {/* Ngôi sao phụ nhỏ hơn ở góc */}
    <path
      d="M29 2 C29.4 4.8 31.2 6.6 34 7 C31.2 7.4 29.4 9.2 29 12 C28.6 9.2 26.8 7.4 24 7 C26.8 6.6 28.6 4.8 29 2 Z"
      fill="#FFFFFF"
      opacity="0.95"
    />
  </svg>
);

// Mùa xuân: Hoa anh đào 🌸 (Cherry Blossom)
export const SpringFlowerIcon: React.FC<{ size?: number }> = ({
  size = 56,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="seasonal-icon flower-icon"
  >
    {/* 5 cánh hoa anh đào hồng đào mềm mại */}
    <g transform="translate(32, 32)">
      {/* Cánh 1: Trên đỉnh */}
      <path
        d="M0 -28 C-8 -28 -12 -16 0 -7 C12 -16 8 -28 0 -28 Z"
        fill="#F472B6"
      />
      <circle cx="0" cy="-21" r="2.2" fill="#BE185D" />

      {/* Cánh 2: Góc phải trên */}
      <g transform="rotate(72)">
        <path
          d="M0 -28 C-8 -28 -12 -16 0 -7 C12 -16 8 -28 0 -28 Z"
          fill="#F472B6"
        />
        <circle cx="0" cy="-21" r="2.2" fill="#BE185D" />
      </g>

      {/* Cánh 3: Góc phải dưới */}
      <g transform="rotate(144)">
        <path
          d="M0 -28 C-8 -28 -12 -16 0 -7 C12 -16 8 -28 0 -28 Z"
          fill="#F472B6"
        />
        <circle cx="0" cy="-21" r="2.2" fill="#BE185D" />
      </g>

      {/* Cánh 4: Góc trái dưới */}
      <g transform="rotate(216)">
        <path
          d="M0 -28 C-8 -28 -12 -16 0 -7 C12 -16 8 -28 0 -28 Z"
          fill="#F472B6"
        />
        <circle cx="0" cy="-21" r="2.2" fill="#BE185D" />
      </g>

      {/* Cánh 5: Góc trái trên */}
      <g transform="rotate(288)">
        <path
          d="M0 -28 C-8 -28 -12 -16 0 -7 C12 -16 8 -28 0 -28 Z"
          fill="#F472B6"
        />
        <circle cx="0" cy="-21" r="2.2" fill="#BE185D" />
      </g>

      {/* Vòng trắng cánh hoa phía trong */}
      <circle cx="0" cy="0" r="10" fill="#FFFFFF" opacity="0.9" />
      {/* Nhụy hoa vàng ở giữa */}
      <circle cx="0" cy="0" r="6" fill="#FBBF24" />
      <circle cx="0" cy="0" r="2.5" fill="#F59E0B" />
    </g>
  </svg>
);

// Mùa hạ: Mặt trời ☀️ (Sun) với các hạt tia tròn
export const SummerSunIcon: React.FC<{ size?: number }> = ({ size = 56 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="seasonal-icon sun-icon"
  >
    {/* Vòng tròn mặt trời trung tâm màu vàng cam */}
    <circle cx="32" cy="32" r="14" fill="#F59E0B" />
    <circle cx="32" cy="32" r="11" fill="#FBBF24" />

    {/* 8 hạt tia nắng tròn đối xứng quanh mặt trời */}
    <g transform="translate(32, 32)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <circle
          key={deg}
          cx="0"
          cy="-22"
          r="3"
          fill="#FBBF24"
          transform={`rotate(${deg})`}
        />
      ))}
    </g>
  </svg>
);

// Mùa thu: Lá phong đỏ 🍁 (Autumn Maple Leaf)
export const AutumnLeafIcon: React.FC<{ size?: number }> = ({ size = 56 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="seasonal-icon leaf-icon"
  >
    {/* Lá phong đỏ tươi sáng theo đúng phong cách ảnh mẫu */}
    <path
      d="M32 8L34.5 17.5L42 14L38.5 22.5L50 24L43.5 31L51 37.5L41.5 39.5L43.5 45L35 42L33.5 54H30.5L29 42L20.5 45L22.5 39.5L13 37.5L20.5 31L14 24L25.5 22.5L22 14L29.5 17.5L32 8Z"
      fill="#FF453A"
    />
    <path
      d="M32 11L34 18.5L40 15.5L37.5 23L47 24.5L41.5 30.5L48 36L40 38L41.5 43L34.5 40.5L33.5 52H30.5L29.5 40.5L22.5 43L24 38L16 36L22.5 30.5L17 24.5L26.5 23L24 15.5L30 18.5L32 11Z"
      fill="#FF6961"
    />
    <rect x="30.5" y="52" width="3" height="6" rx="1.5" fill="#D70015" />
  </svg>
);

// Mùa đông: Bông tuyết ❄️ (Winter Snowflake)
export const WinterSnowflakeIcon: React.FC<{ size?: number }> = ({
  size = 56,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="seasonal-icon snowflake-icon"
  >
    <g transform="translate(32, 32)">
      {/* 6 nhánh đối xứng */}
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <g key={deg} transform={`rotate(${deg})`}>
          {/* Nhánh chính */}
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="-24"
            stroke="#93C5FD"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Nhánh rẽ 1 */}
          <line
            x1="0"
            y1="-14"
            x2="-7"
            y2="-19"
            stroke="#93C5FD"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <line
            x1="0"
            y1="-14"
            x2="7"
            y2="-19"
            stroke="#93C5FD"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          {/* Nhánh rẽ 2 ở đỉnh */}
          <line
            x1="0"
            y1="-20"
            x2="-5"
            y2="-24"
            stroke="#93C5FD"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="0"
            y1="-20"
            x2="5"
            y2="-24"
            stroke="#93C5FD"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      ))}
      {/* Tâm bông tuyết hình tròn nhỏ */}
      <circle cx="0" cy="0" r="3.5" fill="#BFDBFE" />
      <circle cx="0" cy="0" r="1.8" fill="#FFFFFF" />
    </g>
  </svg>
);
