import {Injectable} from '@angular/core';

export type ZmaInternalAuth = { token: string; expiresAt: string };

/**
 * Token nội bộ (Sanctum) của mini app.
 *
 * `localStorage` tồn tại theo THIẾT BỊ, không theo tài khoản Zalo — nên token phải ràng buộc với
 * `zaloUserId` đã tạo ra nó (K3), tránh trường hợp người dùng B đăng nhập Zalo trên cùng máy sau
 * người dùng A rồi đọc được dữ liệu của A qua token cũ còn hạn.
 *
 * Khoá đã đổi tên khỏi bộ `zma.*` cũ: token do backend đời trước phát ra không phải Sanctum token,
 * gửi lên `hcc-admin-api` chỉ tạo 401 vô nghĩa. Đổi khoá là cách vô hiệu chúng trên máy người dùng
 * mà không cần bước dọn dẹp riêng.
 */
@Injectable({ providedIn: 'root' })
export class ZmaTokenStorage {
  private K1 = 'hcc.customer.token';
  private K2 = 'hcc.customer.expiresAt';
  private K3 = 'hcc.customer.zaloUserId';

  /** Khoá của bản cũ — chỉ còn dùng để xoá cho sạch, không bao giờ đọc làm token. */
  private LEGACY_KEYS = ['zma.token', 'zma.expiresAt', 'zma.zaloUserId'];

  get(): ZmaInternalAuth | null {
    const token = localStorage.getItem(this.K1);
    const expiresAt = localStorage.getItem(this.K2);
    if (!token || !expiresAt) return null;
    return { token, expiresAt };
  }

  /** zaloUserId của phiên đã tạo ra token đang lưu (nếu có). */
  getZaloUserId(): string | null {
    return localStorage.getItem(this.K3);
  }

  set(v: ZmaInternalAuth, zaloUserId: string | null) {
    localStorage.setItem(this.K1, v.token);
    localStorage.setItem(this.K2, v.expiresAt);
    if (zaloUserId) localStorage.setItem(this.K3, zaloUserId);
  }

  clear() {
    localStorage.removeItem(this.K1);
    localStorage.removeItem(this.K2);
    localStorage.removeItem(this.K3);
  }

  /** Dọn token của backend đời trước. Gọi một lần lúc app khởi động. */
  purgeLegacy(): void {
    for (const key of this.LEGACY_KEYS) {
      localStorage.removeItem(key);
    }
  }

  /**
   * @param currentZaloUserId zaloUserId của phiên Zalo hiện tại (từ `ZmpService.getUserId$()`).
   *   Truyền `null` để bỏ qua đối chiếu tài khoản — dùng cho chỗ chỉ cần biết "còn hạn hay không"
   *   ở mức UI, không phải điểm gác cổng bảo mật (vd `isLoggedIn()`).
   */
  isValid(currentZaloUserId: string | null, bufferMs = 60_000): boolean {
    const v = this.get();
    if (!v) return false;
    if (Date.now() >= new Date(v.expiresAt).getTime() - bufferMs) return false;

    if (currentZaloUserId !== null) {
      const storedZaloUserId = this.getZaloUserId();
      if (storedZaloUserId !== null && storedZaloUserId !== currentZaloUserId) return false;
    }

    return true;
  }
}
