export type ConfigGroup = 'FINANCE' | 'UI' | 'SYSTEM';

export interface SystemConfig {
  _id: string;
  keyName: string;
  valueText: string;
  group: ConfigGroup;
  description?: string;
  updatedAt: string;
}

export interface Banner {
  _id: string;
  imageUrl: string;
  title?: string;
  linkUrl?: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemConfigMap {
  [key: string]: string;
}

// Well-known config keys
export const CONFIG_KEYS = {
  COMMISSION_RATE_PERCENT: 'COMMISSION_RATE_PERCENT',
  MIN_WITHDRAWAL_AMOUNT: 'MIN_WITHDRAWAL_AMOUNT',
  HOME_HERO_TITLE: 'HOME_HERO_TITLE',
  HOME_HERO_SUBTITLE: 'HOME_HERO_SUBTITLE',
  FOOTER_EMAIL: 'FOOTER_EMAIL',
  FOOTER_PHONE: 'FOOTER_PHONE',
  FOOTER_ADDRESS: 'FOOTER_ADDRESS',
  FOOTER_FACEBOOK: 'FOOTER_FACEBOOK',
  FOOTER_YOUTUBE: 'FOOTER_YOUTUBE',
  FOOTER_ZALO: 'FOOTER_ZALO',
  PLATFORM_NAME: 'PLATFORM_NAME',
} as const;
