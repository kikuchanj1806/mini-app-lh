import {IResBannerActive} from '../banner/banner-api.model';
import {IResHomeContent} from '../news/news-api.model';
import {IResMenuItemActive} from '../../../services/api/menu-items/menu-item-api.service';

/** `/miniapp/home/above` — mọi thứ cần cho màn hình đầu tiên. */
export interface IResHomeAbove {
  heroBanners: IResBannerActive[];
  quickActions: IResMenuItemActive[];
}

/** `/miniapp/home/below` — phần còn lại của trang chủ. */
export interface IResHomeBelow {
  midBanner: IResBannerActive | null;
  eventBanners: IResBannerActive[];
  partnerBanners: IResBannerActive[];
  featuredTools: IResMenuItemActive[];
  content: IResHomeContent;
}
