import {Injectable, inject} from '@angular/core';
import {Observable} from 'rxjs';
import {ApiService, VisitorIdService} from '../../../../core/services';
import {IResPage, IResponseApi} from '../../../../core/models';

/** Khớp `BusinessConfig::toPublic()` phía BE. */
export interface IResBusinessConfig {
  business: { id: number; name: string; code?: string } | null;
  zaloAppId: string | null;
  zaloOaId: string | null;
  brand: Record<string, any>;
  featureFlags: Record<string, boolean>;
  /**
   * `site_settings` do admin xã nhập (hotline, tiêu đề trang chủ, địa điểm thời tiết…).
   * Chỉ gồm các key trong danh sách trắng `SiteSettingService::PUBLIC_KEYS` phía BE.
   */
  siteSettings?: Record<string, string | null>;
}

export interface IResNotificationItem {
  id: number;
  type: string;
  title: string;
  contentPreview: string;
  createdAt: number;
}

export interface IResNotificationDetail {
  id: number;
  type: string;
  title: string;
  content: string;
  linkUrl: string | null;
  createdAt: number;
}

@Injectable({providedIn: 'root'})
export class MiniappApiService extends ApiService {
  private visitorId = inject(VisitorIdService);

  /** Branding + OA id + feature flags của doanh nghiệp, resolve theo `appId`. */
  businessConfig(): Observable<IResponseApi<IResBusinessConfig>> {
    return this.postV1<IResponseApi<IResBusinessConfig>>('/business-config', {});
  }

  /**
   * Thống kê lượt mở mini app. Fire-and-forget, không chặn luồng khởi động.
   *
   * `visitorId` là BẮT BUỘC phía BE (MiniappVisitTrackFilter) — thiếu nó request bị chặn ở tầng
   * validate và không có lượt nào được ghi nhận.
   */
  trackVisit(): Observable<IResponseApi<unknown>> {
    return this.postV1<IResponseApi<unknown>>('/miniapp/visits/track', {
      visitorId: this.visitorId.get(),
    });
  }

  notifications(params?: {type?: string; page?: number; pageSize?: number}) {
    return this.postV1<IResponseApi<IResPage<IResNotificationItem>>>(
      '/notifications/public-list',
      params ?? {},
    );
  }

  notificationDetail(id: number) {
    return this.postV1<IResponseApi<IResNotificationDetail>>('/notifications/public-detail', {id});
  }
}
