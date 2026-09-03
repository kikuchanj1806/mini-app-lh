import {IResMenuItemActive} from '../../../../../shared/services/api/menu-items/menu-item-api.service';

/**
 * Ô tiện ích trang chủ — LUÔN đến từ `menu-items/active`, không còn danh sách mặc định viết cứng
 * trong code. Đích đến đã được BE resolve sẵn thành `linkType` + `link`.
 */
export type HomeAction = {
  key: string;
  label: string;
  sub: string;
  iconClass: string;
  iconUrl?: string | null;
  linkType: IResMenuItemActive['linkType'];
  link?: string | null;
  ref?: IResMenuItemActive['ref'];
};

export type HomeFeature = HomeAction & {
  colorClass: string;
};
