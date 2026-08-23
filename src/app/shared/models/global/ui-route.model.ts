// Header
export type HeaderVariant = 'greeting' | 'title' | 'search';

export interface IHeaderBaseConfig {
  /** Ẩn/hiện header (mặc định: true) */
  show?: boolean;
  /** CSS class/skin */
  className?: string;
  /** Có hiển thị nút back không */
  back?: boolean;
}

export interface IHeaderGreetingConfig extends IHeaderBaseConfig {
  variant: 'greeting';
  /** Link ảnh fallback nếu không có avatar */
  avatarFallbackUrl?: string;               // default: 'assets/img/avatar-placeholder.jpg'
  showGreetingText?: boolean;               // default: true
}

export interface IHeaderTitleConfig extends IHeaderBaseConfig {
  variant: 'title';
  title: string;
}

/** Search (back + ô tìm kiếm) */
export interface IHeaderSearchConfig extends IHeaderBaseConfig {
  variant: 'search';
  placeholder?: string;                     // default: 'Tìm sản phẩm...'
  initialQuery?: string;
  debounceMs?: number;                      // default: 300
  autofocus?: boolean;                      // default: false
  showMic?: boolean;
  showScan?: boolean;
}

export type IHeaderConfig =
  | IHeaderGreetingConfig
  | IHeaderTitleConfig
  | IHeaderSearchConfig;

export const DEFAULT_HEADER: IHeaderConfig = {
  variant: 'greeting',
  show: true,
  className: 'header-color',
  back: false,
};

export const isHeaderGreeting = (c: IHeaderConfig): c is IHeaderGreetingConfig =>
  c.variant === 'greeting';
export const isHeaderTitle = (c: IHeaderConfig): c is IHeaderTitleConfig =>
  c.variant === 'title';
export const isHeaderSearch = (c: IHeaderConfig): c is IHeaderSearchConfig =>
  c.variant === 'search';


// Footer

export type FooterVariant = 'tabs' | 'cart';

export interface IFooterBaseConfig {
  show?: boolean;       // default: true
  className?: string;   // ví dụ: 'footer'
}

export interface IFooterItem {
  path: string;
  label: string;
  iconClass?: string;
  iconTypeImg?: string;
  queryParams?: Record<string, any>;
  exact?: boolean;
  badge?: number | 'dot';
}

export interface IFooterTabsConfig extends IFooterBaseConfig {
  variant: 'tabs';
  items?: IFooterItem[];
}

/** Footer dạng Cart (thanh hành động ở trang chi tiết) */
export interface IFooterCartConfig extends IFooterBaseConfig {
  variant: 'cart';
  showChat?: boolean;    // default: true
  addLabel?: string;     // default: 'Thêm vào giỏ'
  buyLabel?: string;     // default: 'Mua ngay'
}

export type IFooterConfig = IFooterTabsConfig | IFooterCartConfig;

export const DEFAULT_FOOTER: IFooterConfig = {
  variant: 'tabs',
  show: true,
  className: 'footer',
};

export const isFooterTabs = (c: IFooterConfig): c is IFooterTabsConfig =>
  c.variant === 'tabs';
export const isFooterCart = (c: IFooterConfig): c is IFooterCartConfig =>
  c.variant === 'cart';
