import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {shareReplay, tap} from 'rxjs/operators';

interface ICacheEntry {
  expiresAt: number;
  value$: Observable<unknown>;
}

export interface IApiCacheOptions<T> {
  /** Thời gian sống của bản ghi. Hết hạn thì lần gọi sau đi mạng lại. */
  ttlMs?: number;
  /**
   * Chỉ giữ lại kết quả thoả điều kiện. Mặc định giữ mọi thứ.
   *
   * Với response API nên truyền `res => res?.code === 1`: một lần lỗi mạng thoáng qua mà bị cache
   * thì màn hình sẽ kẹt ở dữ liệu hỏng suốt cả TTL.
   */
  cacheIf?: (value: T) => boolean;
}

/**
 * Cache response API theo khoá + thời hạn, dùng chung cho các endpoint công khai ít thay đổi
 * (banner, tiện ích, tin tức). Mục đích: chuyển qua lại giữa các tab không gọi lại mạng cho dữ
 * liệu vốn không đổi, màn hình hiện ra tức thì thay vì phải chờ hoặc quay spinner.
 *
 * Chỉ sống trong bộ nhớ của phiên app. Cố ý không ghi xuống storage: dữ liệu như tin tức mà giữ
 * qua nhiều ngày sẽ cũ mà người dân không có cách nào làm mới.
 */
@Injectable({providedIn: 'root'})
export class ApiCacheService {
  /** 5 phút — đủ để việc chuyển tab qua lại không gọi lại, vẫn đủ mới trong một phiên dùng. */
  static readonly DEFAULT_TTL_MS = 5 * 60_000;

  private readonly entries = new Map<string, ICacheEntry>();

  /**
   * @param key    Khoá định danh, PHẢI gồm cả tham số request — hai `positionCode` khác nhau là
   *               hai bản ghi khác nhau.
   * @param factory Hàm tạo request. Nhận hàm chứ không nhận thẳng Observable để khi trúng cache
   *                thì không dựng request thừa.
   */
  wrap<T>(key: string, factory: () => Observable<T>, options: IApiCacheOptions<T> = {}): Observable<T> {
    const now = Date.now();
    const hit = this.entries.get(key);

    if (hit && hit.expiresAt > now) {
      return hit.value$ as Observable<T>;
    }

    const ttlMs = options.ttlMs ?? ApiCacheService.DEFAULT_TTL_MS;
    const cacheIf = options.cacheIf ?? (() => true);

    const value$ = factory().pipe(
      tap({
        // Người đang chờ vẫn nhận được kết quả; chỉ gỡ bản ghi để LẦN SAU gọi lại.
        next: (value) => {
          if (!cacheIf(value)) {
            this.entries.delete(key);
          }
        },
        error: () => this.entries.delete(key),
      }),
      shareReplay({bufferSize: 1, refCount: false}),
    );

    this.entries.set(key, {expiresAt: now + ttlMs, value$});

    return value$;
  }

  /** Xoá cache. Không truyền gì thì xoá sạch; truyền tiền tố thì xoá theo nhóm (vd `'banners.'`). */
  invalidate(keyPrefix?: string): void {
    if (!keyPrefix) {
      this.entries.clear();

      return;
    }

    for (const key of Array.from(this.entries.keys())) {
      if (key.startsWith(keyPrefix)) {
        this.entries.delete(key);
      }
    }
  }
}
