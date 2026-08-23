import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {CUSTOMER_API_ENDPOINTS} from '../../../../core/constants';
import {IResponseApi} from '../../../../core/models';
import {ApiService} from '../../../../core/services';

/** Khớp `Customer::toProfile()` phía BE. */
export interface ICustomerProfile {
  id: number | string;
  code: string | null;
  fullName: string | null;
  phone: string | null;
  phoneVerified: boolean;
  email: string | null;
  emailVerified: boolean;
  gender: string | null;
  dob: string | null;
  avatarFileId: number | string | null;
  primarySource: string | null;
  hasWeb: boolean;
  hasZalo: boolean;
}

/** Response của `customer/auth/zalo` — `{token, expiresAt, customer}`. */
export interface ICustomerAuthResult {
  token: string;
  expiresAt: string;
  customer: ICustomerProfile;
}

/**
 * Response của `customer/auth/zalo/phone` — hồ sơ PHẲNG ở gốc kèm `token`/`expiresAt`.
 * BE cố ý giữ dạng này để tương thích ngược với bản mini app cũ, xem chú thích ở
 * `Customer\AuthController::zaloPhone()`.
 */
export interface ICustomerLoginResult extends ICustomerProfile {
  token: string;
  expiresAt: string;
}

@Injectable({providedIn: 'root'})
export class CustomerAuthApiService {
  private readonly api = inject(ApiService);

  /**
   * BƯỚC 1 — chỉ verify `accessToken` Zalo, CHƯA dùng token nội bộ nó trả về.
   *
   * Tồn tại để chặn sớm: accessToken hỏng thì biết ngay ở đây, không tiêu phí `phoneToken` vốn chỉ
   * sống 2 phút và dùng được đúng một lần.
   */
  verifyZalo(accessToken: string): Observable<IResponseApi<ICustomerAuthResult>> {
    return this.api.postGuestRequest<IResponseApi<ICustomerAuthResult>>(
      CUSTOMER_API_ENDPOINTS.AUTH_ZALO,
      {accessToken},
    );
  }

  /**
   * BƯỚC 2 — ĐĂNG NHẬP THẬT: server đổi `phoneToken` ra số điện thoại rồi mới cấp token nội bộ.
   *
   * Route public (chính nó phát ra token nên không thể yêu cầu token), tenant resolve từ `appId`.
   */
  loginWithPhone(accessToken: string, phoneToken: string): Observable<IResponseApi<ICustomerLoginResult>> {
    return this.api.postGuestRequest<IResponseApi<ICustomerLoginResult>>(
      CUSTOMER_API_ENDPOINTS.AUTH_ZALO_PHONE,
      {accessToken, phoneToken},
    );
  }

  /** Hồ sơ customer của token hiện tại — dùng khi token còn hạn nhưng app vừa mở lại (cache RAM rỗng). */
  me(): Observable<IResponseApi<ICustomerProfile>> {
    return this.api.post<IResponseApi<ICustomerProfile>>(
      CUSTOMER_API_ENDPOINTS.AUTH_ME,
      {},
      {includeAppId: false},
    );
  }

  logout(): Observable<IResponseApi<null>> {
    return this.api.post<IResponseApi<null>>(
      CUSTOMER_API_ENDPOINTS.AUTH_LOGOUT,
      {},
      {includeAppId: false},
    );
  }

  /** Báo trạng thái quan tâm OA (Zalo chưa có webhook OA, mini app tự báo). */
  reportOaFollow(followedOA: boolean, idByOA?: string | null): Observable<IResponseApi<unknown>> {
    return this.api.post<IResponseApi<unknown>>(
      CUSTOMER_API_ENDPOINTS.ZALO_OA_FOLLOW,
      {followedOA, idByOA: idByOA ?? null},
      {includeAppId: false},
    );
  }
}
