import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError, map, shareReplay} from 'rxjs/operators';
import {IResMenuItemActive, MenuItemApiService} from '../../api/menu-items/menu-item-api.service';

/**
 * Cache danh mục menu trang chủ theo vòng đời app — mỗi `groupKey` chỉ gọi API MỘT LẦN.
 *
 * Vì sao cần: trang chủ bị huỷ/dựng lại mỗi lần người dân rời đi rồi quay lại. Nếu gọi API mỗi
 * lần dựng thì giữa lúc chờ phản hồi, lưới tiện ích rỗng rồi mới đầy trở lại — nhìn như giật.
 * Có cache thì lần quay lại thứ hai trở đi dữ liệu có ngay lập tức, không còn khoảng trống.
 *
 * `refCount: false` là điểm mấu chốt: cache phải SỐNG SÓT qua việc mọi subscriber huỷ đăng ký
 * (đúng lúc rời trang chủ). Dùng `refCount: true` như BannerCacheService thì luồng bị dọn khi
 * subscriber cuối rời đi, lần vào sau lại gọi API — tức là không cache được gì cho đúng tình
 * huống đang cần xử lý.
 */
@Injectable({providedIn: 'root'})
export class MenuItemCacheService {
  private cache = new Map<string, Observable<IResMenuItemActive[]>>();

  constructor(private api: MenuItemApiService) {}

  activeOnce$(groupKey: string): Observable<IResMenuItemActive[]> {
    const cached = this.cache.get(groupKey);
    if (cached) return cached;

    const req$ = this.api.active(groupKey).pipe(
      map((res) => res?.data ?? []),
      catchError(() => {
        // Lỗi mạng thì KHÔNG giữ lại kết quả rỗng: xoá khỏi cache để lần vào sau thử lại.
        // Danh sách rỗng do admin chưa cấu hình thì vẫn cache bình thường — đó là dữ liệu thật.
        this.cache.delete(groupKey);
        return of([] as IResMenuItemActive[]);
      }),
      shareReplay({bufferSize: 1, refCount: false}),
    );

    this.cache.set(groupKey, req$);
    return req$;
  }

  /** Dùng khi đổi doanh nghiệp / cần nạp lại cấu hình menu. */
  clear(): void {
    this.cache.clear();
  }
}
