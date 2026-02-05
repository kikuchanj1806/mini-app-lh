export interface IResBannerT {
  id: number;
  name: string;
  image: string;
  intro: string;
  description: string;
  typeVideo: boolean
}

export type BannerPositionKey =
  | 'HOME_TOP'
  | 'HOME_MIDDLE'
  | 'HOME_BOTTOM'
  | 'NEWS_TOP'
  | 'FEEDBACK_TOP';

export interface IResBanner {
  id: number;
  ward_id: number;
  position_key: BannerPositionKey;

  title: string | null;
  image: string | null;

  link_url: string | null;
  open_target: number;

  status: number;
  display_order: number;
  published_at: number | null;
  expired_at: number | null;

  // Resource thường trả thêm
  image_url?: string | null;
}
