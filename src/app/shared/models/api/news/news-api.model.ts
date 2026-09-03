export interface IPostCategoryMenuItem {
  id: number;
  name: string;
  slug: string;
  children?: IPostCategoryMenuItem[];
}

export interface IResPostListItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnailUrl: string | null;
  category: { id: number; name: string; slug: string } | null;
  isPublished: boolean;
  publishedAt: number | null;
  author: { id: number; fullName?: string } | null;
  createdAt: number;
}

export interface IResPostDetail extends IResPostListItem {
  content: string | null;
  updatedAt: number;
}

export interface IHomeContentSection {
  code: string;
  title: string;
  sourceMode: string;
  displayLimit: number;
  viewAllCategory: { id: number; name: string; slug: string } | null;
  items: IResPostListItem[];
}

export interface IHomeContentStats {
  title: string;
  updatedMonth: string | null;
  isActive: boolean;
  items: { code: string; label: string; tag: string | null; value: string; iconClass: string | null; tone: string | null }[];
}

export interface IHomeBroadcastChannel {
  id: number; name: string; slug: string; description?: string | null; iconUrl?: string | null; streamUrl?: string | null;
}

export interface IHomeBroadcastFeatureCard {
  title: string | null; description: string | null; badge: string | null; tone: 'blue' | 'red';
  channel: IHomeBroadcastChannel | null; iconUrl?: string | null;
}

export interface IHomeBroadcast {
  title: string; showChannels: boolean; channels: IHomeBroadcastChannel[]; featureCards: IHomeBroadcastFeatureCard[];
}

export interface IResHomeContent {
  sections: IHomeContentSection[];
  stats: IHomeContentStats | null;
  broadcast?: IHomeBroadcast | null;
}
