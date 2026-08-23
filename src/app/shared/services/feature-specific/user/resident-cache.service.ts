import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError, map, shareReplay} from 'rxjs/operators';
import {ResidentApiService} from '../../api/resident/resident-api.service';
import {IResMyResident} from '../../../models/api';

/**
 * Cache hồ sơ cư trú của phiên hiện tại — cùng cơ chế với MenuItemCacheService/NewsCacheService:
 * màn "Cá nhân" bị huỷ/dựng lại mỗi lần chuyển tab, `refCount: false` để cache sống sót qua lúc
 * đó thay vì gọi lại `residents/my-profile` mỗi lần.
 *
 * Khác các cache "ít đổi" khác ở chỗ có ĐƯỜNG GHI (`residence.component.ts` gọi declare/
 * requestChange): bắt buộc gọi `invalidate()` sau khi ghi thành công, nếu không màn Cá nhân sẽ
 * hiện lại dữ liệu cũ (vd vẫn "Chưa khai báo" dù vừa khai báo xong).
 */
@Injectable({providedIn: 'root'})
export class ResidentCacheService {
  private myProfile$?: Observable<IResMyResident | null>;

  constructor(private api: ResidentApiService) {}

  myProfileOnce$(forceRefresh = false): Observable<IResMyResident | null> {
    if (forceRefresh) this.myProfile$ = undefined;

    if (!this.myProfile$) {
      this.myProfile$ = this.api.myProfile().pipe(
        map((res) => res?.data ?? null),
        catchError(() => {
          this.myProfile$ = undefined;
          return of(null);
        }),
        shareReplay({bufferSize: 1, refCount: false}),
      );
    }

    return this.myProfile$;
  }

  /** Gọi sau khi declare/requestChange thành công, hoặc lúc đăng xuất/đổi tài khoản. */
  invalidate(): void {
    this.myProfile$ = undefined;
  }
}
