import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError, map, shareReplay} from 'rxjs/operators';
import {NewApiService} from '../../api/news/new-api.service';
import {IPostCategoryMenuItem, IResHomeContent, IResPostListItem} from '../../../models/api';
import {IResPage} from '../../../../core/models';

export interface NewsListQuery {
  keyword?: string;
  categoryId?: number;
  categorySlug?: string;
  includeChildren?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Cache nội dung trang chủ + tin tức theo vòng đời app — cùng lý do và cùng cơ chế với
 * MenuItemCacheService: tab "Trang chủ"/"Tin tức" bị huỷ/dựng lại mỗi lần người dùng chuyển
 * tab (không có RouteReuseStrategy), nên `refCount: false` là bắt buộc để cache sống sót qua
 * lúc mọi subscriber huỷ đăng ký lúc rời tab — `refCount: true` sẽ xả cache ngay khi đó.
 */
@Injectable({providedIn: 'root'})
export class NewsCacheService {
  private homeContent$?: Observable<IResHomeContent | null>;
  private categoryMenu$?: Observable<IPostCategoryMenuItem[]>;
  private listCache = new Map<string, Observable<IResPage<IResPostListItem> | null>>();

  constructor(private api: NewApiService) {}

  homeContentOnce$(forceRefresh = false): Observable<IResHomeContent | null> {
    if (forceRefresh) this.homeContent$ = undefined;

    if (!this.homeContent$) {
      this.homeContent$ = this.api.homeContent().pipe(
        map((res) => res?.data ?? null),
        catchError(() => {
          this.homeContent$ = undefined;
          return of(null);
        }),
        shareReplay({bufferSize: 1, refCount: false}),
      );
    }

    return this.homeContent$;
  }

  categoryMenuOnce$(forceRefresh = false): Observable<IPostCategoryMenuItem[]> {
    if (forceRefresh) this.categoryMenu$ = undefined;

    if (!this.categoryMenu$) {
      this.categoryMenu$ = this.api.categoryMenu().pipe(
        map((res) => res?.data ?? []),
        catchError(() => {
          this.categoryMenu$ = undefined;
          return of([] as IPostCategoryMenuItem[]);
        }),
        shareReplay({bufferSize: 1, refCount: false}),
      );
    }

    return this.categoryMenu$;
  }

  publicListOnce$(query: NewsListQuery, forceRefresh = false): Observable<IResPage<IResPostListItem> | null> {
    const key = this.makeListKey(query);

    if (forceRefresh) this.listCache.delete(key);

    const cached = this.listCache.get(key);
    if (cached) return cached;

    const req$ = this.api.publicList(query).pipe(
      map((res) => res?.data ?? null),
      catchError(() => {
        this.listCache.delete(key);
        return of(null);
      }),
      shareReplay({bufferSize: 1, refCount: false}),
    );

    this.listCache.set(key, req$);
    return req$;
  }

  /** Dùng khi cần nạp lại (vd sau khi admin cập nhật tin/danh mục). */
  clear(): void {
    this.homeContent$ = undefined;
    this.categoryMenu$ = undefined;
    this.listCache.clear();
  }

  private makeListKey(q: NewsListQuery): string {
    return [
      q.keyword ?? '',
      q.categoryId ?? '',
      q.categorySlug ?? '',
      q.includeChildren ?? '',
      q.page ?? 1,
      q.pageSize ?? 20,
    ].join(':');
  }
}
