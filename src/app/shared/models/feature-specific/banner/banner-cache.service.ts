import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import {BannerPositionCode, IResBanner} from '../../api';
import {BannerApiService} from '../../../services/api/banners/banner-api.service';

export interface BannerQuery {
  positionCode: BannerPositionCode;
  platform?: 'miniapp';
  limit?: number;         // default 10
  forceRefresh?: boolean; // default false
}

@Injectable({ providedIn: 'root' })
export class BannerCacheService {
  private cache = new Map<string, Observable<IResBanner[]>>();

  constructor(private api: BannerApiService) {}

  private makeKey(q: BannerQuery): string {
    const limit = q.limit ?? 10;
    return `${q.platform ?? 'miniapp'}:${q.positionCode}:${limit}`;
  }

  getBannersOnce(q: BannerQuery): Observable<IResBanner[]> {
    const key = this.makeKey(q);

    if (q.forceRefresh) {
      this.cache.delete(key);
    }

    const cached = this.cache.get(key);
    if (cached) return cached;

    const limit = q.limit ?? 10;

    const req$ = this.api.getBanners({
      positionCode: q.positionCode,
      platform: q.platform ?? 'miniapp',
    }).pipe(
      map(res => (res?.data ?? []).slice(0, limit)),
      catchError(() => {
        // Lỗi mạng thì không giữ lại cache rỗng, lần vào sau thử lại.
        this.cache.delete(key);
        return of([]);
      }),
      // refCount: false — trang chủ bị huỷ/dựng lại mỗi lần chuyển tab (không có
      // RouteReuseStrategy); refCount: true sẽ xả cache ngay khi subscriber cuối (component bị
      // huỷ) huỷ đăng ký, khiến lần quay lại sau lại gọi API. Xem thêm MenuItemCacheService.
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.cache.set(key, req$);
    return req$;
  }

  getFirstBannerOnce(q: Omit<BannerQuery, 'limit'> & { forceRefresh?: boolean }): Observable<IResBanner | null> {
    return this.getBannersOnce({ ...q, limit: 1 }).pipe(
      map(items => items[0] ?? null)
    );
  }

  clear(): void {
    this.cache.clear();
  }

  clearByPosition(positionCode: BannerPositionCode): void {
    const suffix = `:${positionCode}:`;
    for (const k of this.cache.keys()) {
      if (k.includes(suffix)) this.cache.delete(k);
    }
  }
}
