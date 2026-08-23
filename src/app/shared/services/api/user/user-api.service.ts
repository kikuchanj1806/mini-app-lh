import {Injectable} from '@angular/core';
import {ApiService} from '../../../../core/services';

export interface IResTthcVideoItem {
  id: number;
  title: string;
  excerpt?: string | null;      // mô tả ngắn
  thumbnail?: string | null;    // ảnh đại diện
  video_url?: string | null;    // link video (youtube/mp4)
  published_at?: number | null; // unix seconds (nếu có)
  created_at?: number | null;   // unix seconds (nếu có)
}

export type TthcVideoListItemVM = {
  id: number;
  title: string;
  subtitle: string;
  thumbnail: string | null;
  publishedMs: number | null;
  raw: IResTthcVideoItem;
};

/**
 * Chỉ còn là nơi giữ kiểu dữ liệu cho cụm tthc-video (vẫn chạy trên backend đời trước).
 *
 * Toàn bộ phần xác thực/hồ sơ khách đã chuyển sang `CustomerAuthApiService` theo chuẩn
 * `hcc-admin-api`: `getPhoneNumber`, `syncZaloUser`, `syncAuth`, `sendFeedback`, `sendMessageZma`,
 * `getWardDetail` và `list()` (vốn trỏ endpoint rỗng) đã được gỡ vì không còn nơi gọi —
 * `getWardDetail` được thay bằng khối `stats` trong `miniapp/home-content`.
 */
@Injectable({providedIn: 'root'})
export class UserApiService extends ApiService {
}
