import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import {BannerPositionKey, IResBanner} from '../../api';
import {BannerApiService} from '../../../services/api/banners/banner-api.service';

export interface BannerQuery {
  ward_id: number;
  position_key: BannerPositionKey;
  limit?: number;         // default 10
  forceRefresh?: boolean; // default false
}

@Injectable({ providedIn: 'root' })
export class BannerCacheService {
  private cache = new Map<string, Observable<IResBanner[]>>();

  constructor(private api: BannerApiService) {}

  private makeKey(q: BannerQuery): string {
    const limit = q.limit ?? 10;
    return `${q.ward_id}:${q.position_key}:${limit}`;
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
      ward_id: q.ward_id,
      position_key: q.position_key,
    }).pipe(
      map(res => res?.data ?? []),
      catchError(() => of([])),
      // cache request + replay cho subscriber sau
      shareReplay({ bufferSize: 1, refCount: true }),
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

  clearByWard(wardId: number): void {
    const prefix = `${wardId}:`;
    for (const k of this.cache.keys()) {
      if (k.startsWith(prefix)) this.cache.delete(k);
    }
  }
}
