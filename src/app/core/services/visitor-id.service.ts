import {Injectable} from '@angular/core';

/**
 * Mã truy cập ẩn danh, ổn định theo THIẾT BỊ (không theo tài khoản Zalo).
 *
 * BE dùng giá trị này để đếm `unique_visitors`: nó băm HMAC `appId|visitorId` rồi chốt duy nhất
 * theo (app_id, visit_date, visitor_hash) — nên chuỗi thô không bao giờ rời khỏi máy người dùng ở
 * dạng lưu trữ, và bản thân nó không mang thông tin định danh nào.
 *
 * Dùng thẳng `localStorage` (không qua ZmaNativeStorageService) để không bị xoá lây khi các luồng
 * cache khác gọi clear theo namespace — mất id đồng nghĩa với đếm trùng một người thành nhiều.
 */
@Injectable({providedIn: 'root'})
export class VisitorIdService {
  private static readonly KEY = 'hcc.visitorId';

  private cached: string | null = null;

  /** Trả id đã lưu, tự sinh và lưu lại ở lần gọi đầu tiên. */
  get(): string {
    if (this.cached) return this.cached;

    let id = this.read();
    if (!id) {
      id = this.generate();
      this.write(id);
    }

    this.cached = id;
    return id;
  }

  private read(): string | null {
    try {
      const v = localStorage.getItem(VisitorIdService.KEY);
      return v && v !== 'undefined' ? v : null;
    } catch {
      // Storage bị chặn (chế độ riêng tư / WebView hạn chế) — coi như chưa có id.
      return null;
    }
  }

  private write(id: string): void {
    try {
      localStorage.setItem(VisitorIdService.KEY, id);
    } catch {
      // Không ghi được thì id chỉ sống trong phiên này: thống kê lượt vẫn đúng,
      // chỉ riêng "khách duy nhất" có thể đếm dôi. Không đáng để chặn luồng.
    }
  }

  private generate(): string {
    const uuid = (globalThis as any)?.crypto?.randomUUID?.();
    if (typeof uuid === 'string') return uuid;

    return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}
