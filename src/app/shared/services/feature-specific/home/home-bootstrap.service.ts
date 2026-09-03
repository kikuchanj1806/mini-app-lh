import {Injectable} from '@angular/core';
import {defer, Observable, of} from 'rxjs';
import {catchError, map, shareReplay} from 'rxjs/operators';
import {HomeApiService} from '../../api/home/home-api.service';
import {IResHomeAbove, IResHomeBelow} from '../../../models/api';
import {measureLoad} from '../../../../core/utils/app-load-timer.util';

/**
 * Cache 2 tầng dữ liệu trang chủ (above/below) theo vòng đời app — cùng cơ chế với
 * NewsCacheService/MenuItemCacheService: trang chủ bị huỷ/dựng lại mỗi lần người dùng chuyển tab
 * (dự án không có `RouteReuseStrategy`), nên `refCount: false` là bắt buộc để cache sống sót qua
 * lúc mọi subscriber huỷ đăng ký lúc rời tab — `refCount: true` sẽ xả cache ngay khi đó.
 *
 * `measureLoad(...)` ghi mốc "start" NGAY khi `.pipe()` build xong — không đợi tới lúc subscribe
 * (đây là cách `measureLoad` được viết ở `app-load-timer.util.ts`, dùng đúng như vậy ở mọi nơi
 * khác trong trang chủ). Vì `above$()`/`below$()` chỉ được GỌI 1 lần để lấy reference (trong
 * constructor của HomeComponent) rồi mới subscribe SAU đó (khối `@defer (on viewport)` mới thật
 * sự subscribe), toàn bộ `.pipe(...)` — kể cả `measureLoad` — phải nằm TRONG factory của
 * `rxjs.defer(...)` để việc build pipe (và mốc "start") chỉ xảy ra lúc subscribe thật, không phải
 * lúc gọi hàm để lấy reference. `shareReplay` bọc ngoài `defer` đảm bảo dù nhiều khối `@defer`
 * cùng subscribe, factory (và do đó `measureLoad`) chỉ chạy đúng 1 lần cho request thật đầu tiên.
 */
@Injectable({providedIn: 'root'})
export class HomeBootstrapService {
  private aboveCache$?: Observable<IResHomeAbove | null>;
  private belowCache$?: Observable<IResHomeBelow | null>;

  constructor(private api: HomeApiService) {}

  above$(forceRefresh = false): Observable<IResHomeAbove | null> {
    if (forceRefresh) this.aboveCache$ = undefined;

    if (!this.aboveCache$) {
      this.aboveCache$ = defer(() => this.api.above().pipe(
        map((res) => res?.data ?? null),
        catchError(() => {
          this.aboveCache$ = undefined;
          return of(null);
        }),
        measureLoad('above'),
      )).pipe(
        shareReplay({bufferSize: 1, refCount: false}),
      );
    }

    return this.aboveCache$;
  }

  below$(forceRefresh = false): Observable<IResHomeBelow | null> {
    if (forceRefresh) this.belowCache$ = undefined;

    if (!this.belowCache$) {
      this.belowCache$ = defer(() => this.api.below().pipe(
        map((res) => res?.data ?? null),
        catchError(() => {
          this.belowCache$ = undefined;
          return of(null);
        }),
        measureLoad('below'),
      )).pipe(
        shareReplay({bufferSize: 1, refCount: false}),
      );
    }

    return this.belowCache$;
  }

  /** Dùng khi cần nạp lại (vd sau khi admin cập nhật banner/menu/nội dung trang chủ). */
  clear(): void {
    this.aboveCache$ = undefined;
    this.belowCache$ = undefined;
  }
}
