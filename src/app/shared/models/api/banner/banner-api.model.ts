export interface IResBannerT {
  id: number;
  name: string;
  image: string;
  intro: string;
  description: string;
  typeVideo: boolean;
  linkUrl?: string | null;
}

export type BannerPositionCode =
  | 'miniapp_home_hero'
  | 'miniapp_home_mid'
  | 'miniapp_propaganda'
  | 'miniapp_home_events'
  | 'miniapp_home_partners';

export interface IResBannerActive {
  id: number;
  title: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  position: { id: number; code: string; name: string; platform: string } | null;
  sortOrder: number;
  isActive: boolean;
  startAt: number | null;
  endAt: number | null;
  createdAt: number;
}

export type IResBanner = IResBannerActive;
