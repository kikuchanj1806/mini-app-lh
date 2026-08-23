import {inject, Injectable} from '@angular/core';
import {BehaviorSubject, catchError, firstValueFrom, of, tap} from 'rxjs';
import {environment} from '../../../environments';
import {IResBusinessConfig, MiniappApiService} from '../../shared/services/api/miniapp/miniapp-api.service';

/**
 * Config public của doanh nghiệp, nạp một lần lúc app khởi động qua `appId`.
 *
 * Thay cho các hằng số vốn hardcode trong `environment` (OA id, tên đơn vị): cùng một bản build
 * mini app phục vụ nhiều xã/phường, nên những thứ này phải đến từ BE chứ không từ file build.
 */
@Injectable({providedIn: 'root'})
export class BusinessConfigService {
  private api = inject(MiniappApiService);

  private configSubject = new BehaviorSubject<IResBusinessConfig | null>(null);
  readonly config$ = this.configSubject.asObservable();

  get config(): IResBusinessConfig | null {
    return this.configSubject.value;
  }

  /** OA id để mời quan tâm — ưu tiên BE, `environment.OAId` chỉ là phương án dự phòng. */
  get zaloOaId(): string {
    return this.configSubject.value?.zaloOaId || String((environment as any).OAId ?? '');
  }

  get businessName(): string {
    return this.setting('business_name') || (this.configSubject.value?.business?.name ?? '');
  }

  /**
   * Giá trị `site_settings` do admin xã nhập. Chưa cấu hình / chưa tải xong thì trả chuỗi rỗng —
   * nơi dùng tự quyết định ẩn khối hay hiện giá trị dự phòng, thay vì hiện "null" ra màn hình.
   */
  setting(key: string, fallback = ''): string {
    const value = this.configSubject.value?.siteSettings?.[key];
    return (value ?? '').trim() || fallback;
  }

  get hotline(): string {
    return this.setting('hotline') || this.setting('phone');
  }

  /** Cờ tính năng do admin bật/tắt cho từng doanh nghiệp. Không có cờ = coi như bật. */
  isFeatureEnabled(key: string): boolean {
    const flags = this.configSubject.value?.featureFlags;
    if (!flags || !(key in flags)) return true;
    return !!flags[key];
  }

  /**
   * Dùng cho APP_INITIALIZER. KHÔNG bao giờ reject: mất mạng hay BE lỗi thì app vẫn phải mở được
   * với giá trị dự phòng, thay vì treo ở màn trắng.
   */
  load(): Promise<void> {
    return firstValueFrom(
      this.api.businessConfig().pipe(
        tap((res) => {
          if (res?.code === 1 && res.data) this.configSubject.next(res.data);
        }),
        catchError((err) => {
          console.warn('[BusinessConfig] load FAILED, dùng giá trị dự phòng', err);
          return of(null);
        }),
      ),
    ).then(() => void 0);
  }
}
