import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {AllScope} from '../../../models/global';
import {BehaviorSubject, catchError, from, Observable, of} from 'rxjs';
import {getSetting, getUserInfo} from 'zmp-sdk/apis';
import {map, shareReplay, switchMap} from 'rxjs/operators';
import {GetSettingReturn} from 'zmp-sdk/';
import {ApiService, NotifyService, UserService, ZmaNativeStorageService, ZmpService} from '../../../../core/services';
import {CUSTOMER_API_ENDPOINTS} from '../../../../core/constants';
import {STORAGE_KEYS} from '../../../../core/models/storage.model';
import {ZmaTokenStorage} from './zma-token-storage.service';
import {CustomerAuthApiService, ICustomerProfile} from '../../api/user/customer-auth-api.service';
import {ResidentCacheService} from './resident-cache.service';

@Injectable({providedIn: 'root'})
export class UserManageService {
  /** Hai quyền tối thiểu của một phiên: tên/ảnh để hiển thị, SĐT để định danh. */
  private static readonly LOGIN_SCOPES: AllScope[] = ['scope.userInfo', 'scope.userPhonenumber'];

  /** BE errorCode -> thông báo hiển thị cho người dân. Xem `App\Services\CustomerZaloService`. */
  private static readonly PHONE_ERROR_MESSAGES: Record<string, string> = {
    INVALID_ZALO_TOKEN: 'Không lấy được số điện thoại từ Zalo, vui lòng thử lại.',
    ZALO_ACCESS_TOKEN_INVALID: 'Phiên Zalo đã hết hạn, vui lòng mở lại mini app.',
    ZALO_NOT_CONFIGURED: 'Hệ thống chưa cấu hình xong, vui lòng báo cán bộ phụ trách.',
    ZALO_API_ERROR: 'Không kết nối được tới Zalo, vui lòng thử lại sau ít phút.',
    ZALO_INVALID_RESPONSE: 'Zalo trả về dữ liệu không hợp lệ, vui lòng thử lại.',
    TENANT_NOT_RESOLVED: 'Chưa xác định được đơn vị của mini app, vui lòng báo cán bộ phụ trách.',
    TOO_MANY_REQUESTS: 'Bạn thao tác quá nhanh, vui lòng chờ một lát rồi thử lại.',
  };

  /** Sau một lần đăng nhập hỏng, khoá luồng TỰ ĐỘNG lại bấy nhiêu mili giây. */
  private static readonly AUTO_LOGIN_COOLDOWN_MS = 30_000;

  private zmaService = inject(ZmpService);
  private customerAuthApi = inject(CustomerAuthApiService);
  private tokenStore = inject(ZmaTokenStorage);
  private notify = inject(NotifyService);
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private zmaStorage = inject(ZmaNativeStorageService);
  private userService = inject(UserService);
  private residentCache = inject(ResidentCacheService);

  private profileSubject = new BehaviorSubject<ICustomerProfile | null>(null);
  readonly profile$ = this.profileSubject.asObservable();

  /** Mốc lần đăng nhập hỏng gần nhất — chặn luồng tự động gọi lại liên tục (xem `autoLogin$`). */
  private lastLoginFailedAt = 0;

  /** Cache 1 lần/phiên — zaloUserId không đổi trong lúc app đang chạy. */
  private zaloUserIdCache$?: Observable<string>;

  constructor() {
    // Token do backend đời trước phát ra không phải Sanctum token của hcc-admin-api.
    this.tokenStore.purgeLegacy();
  }

  /** Lấy token nếu còn hạn VÀ đúng tài khoản Zalo hiện tại. */
  getTokenIfValid(currentZaloUserId: string | null): string | null {
    if (!this.tokenStore.isValid(currentZaloUserId)) return null;
    return this.tokenStore.get()?.token ?? null;
  }

  /** Best-effort cho UI (vd hiện lời mời đăng nhập) — không phải điểm gác cổng bảo mật. */
  isLoggedIn(): boolean {
    return this.tokenStore.isValid(null);
  }

  /**
   * ĐĂNG NHẬP — luồng duy nhất của mini app.
   *
   * Nguyên tắc: **đăng nhập thành công ⟺ server đổi được `phoneToken` ra số điện thoại.** Không có
   * SĐT thì không có phiên, nên không tồn tại trạng thái "đã đăng nhập nhưng chưa có SĐT".
   *
   * CHỈ được gọi từ thao tác thật của người dùng (bấm nút Xác thực): `authorize()` cần ngữ cảnh
   * tương tác, không chạy được từ request nền. Interceptor tuyệt đối không gọi hàm này.
   *
   * Trả `null` khi người dùng không cấp quyền hoặc BE báo lỗi nghiệp vụ (đã hiện toast) —
   * KHÔNG ném lỗi ra ngoài, vì từ chối là lựa chọn hợp lệ.
   */
  login$(): Observable<ICustomerProfile | null> {
    return this.currentZaloUserId$().pipe(
      switchMap((zaloUserId) => {
        const stale = this.tokenStore.get();
        if (stale && this.tokenStore.getZaloUserId() !== zaloUserId) {
          // Token cũ không khớp tài khoản Zalo hiện tại (đổi tài khoản trên cùng thiết bị) — xoá
          // sạch trước khi đăng nhập lại, tránh mọi khả năng dùng nhầm dữ liệu người trước.
          this.tokenStore.clear();
          this.revokeStaleToken(stale.token);
        }

        // Xin CẢ HAI scope một lượt. All-or-nothing: thiếu một cái là coi như chưa đăng nhập. Nếu
        // cấp lẻ, người dân sẽ có token mà không có tên -> màn Cá nhân chặn vĩnh viễn trong khi
        // Zalo đã nhớ lựa chọn từ chối, không có đường ra.
        return this.authorizeAndFetchUser$(UserManageService.LOGIN_SCOPES).pipe(
          switchMap(({perms, userInfo}) => {
            const allGranted = UserManageService.LOGIN_SCOPES.every((scope) => !!perms[scope]);
            if (!allGranted || !userInfo?.name) {
              return of(null);
            }

            // Ghi tên/ảnh + danh sách scope đã cấp vào storage: vừa là dữ liệu cho header greeting,
            // vừa là mốc để phát hiện người dân gỡ quyền ở lần vào sau.
            this.userService.saveGrantAndUser(perms, userInfo);

            const token = this.getTokenIfValid(zaloUserId);
            if (token) {
              return of(this.profileSubject.value);
            }

            return this.exchangePhoneForToken$(zaloUserId);
          })
        );
      }),
      catchError((error: any) => {
        this.lastLoginFailedAt = Date.now();
        console.error('[login$] Đăng nhập thất bại', error);
        this.notify.error(this.phoneErrorMessage(error));

        return of(null);
      })
    );
  }

  /**
   * Bản TỰ ĐỘNG của `login$()` — dành cho luồng chạy khi vào màn, không phải người dân bấm nút.
   *
   * Ra/vào tab tạo lại component nên luồng này chạy lại mỗi lượt; mà một lượt đăng nhập tốn 2
   * request lên BE (hạn mức `customer-zalo` là 20/phút). Nếu lần trước vừa hỏng thì im lặng bỏ qua
   * trong `AUTO_LOGIN_COOLDOWN_MS`: vừa không đốt thêm hạn mức, vừa không dội toast lỗi vào mặt
   * người dân mỗi lần chạm tab. Nút "Xác thực" vẫn gọi thẳng `login$()` nên luôn thử lại được ngay.
   */
  autoLogin$(): Observable<ICustomerProfile | null> {
    if (Date.now() - this.lastLoginFailedAt < UserManageService.AUTO_LOGIN_COOLDOWN_MS) {
      return of(null);
    }

    return this.login$();
  }

  /**
   * Hai pha: verify `accessToken` trước để chặn sớm, rồi mới lấy `phoneToken` và đổi lấy token nội bộ.
   *
   * `getPhoneNumber()` phải nằm SÁT lời gọi đăng nhập — mã đó sống 2 phút và dùng đúng một lần,
   * lấy sẵn từ trước rồi mới gửi lên sẽ hỏng với người thao tác chậm.
   */
  private exchangePhoneForToken$(zaloUserId: string): Observable<ICustomerProfile | null> {
    return this.zmaService.getAccessToken$().pipe(
      map((res: any) => (typeof res === 'string' ? res : (res?.accessToken ?? ''))),
      switchMap((accessToken: string) => {
        if (!accessToken) {
          throw new Error('Không lấy được access token Zalo');
        }

        return this.customerAuthApi.verifyZalo(accessToken).pipe(
          switchMap((verifyRes) => {
            if (verifyRes.code !== 1) {
              throw {errorCode: verifyRes.errorCode};
            }

            return this.zmaService.getPhoneNumber();
          }),
          switchMap(({token: phoneToken}) => this.customerAuthApi.loginWithPhone(accessToken, phoneToken)),
          map((res) => {
            if (res.code !== 1 || !res.data?.token || !res.data?.expiresAt) {
              throw {errorCode: res.errorCode};
            }

            this.tokenStore.set({token: res.data.token, expiresAt: res.data.expiresAt}, zaloUserId);
            this.profileSubject.next(res.data);
            this.lastLoginFailedAt = 0;

            return res.data as ICustomerProfile;
          })
        );
      })
    );
  }

  /**
   * Hồ sơ customer của phiên hiện tại. Sau khi mở lại app, token còn hạn nhưng cache RAM rỗng —
   * lúc đó phải hỏi lại BE thay vì bắt người dân đăng nhập lại.
   */
  profileOrFetch$(): Observable<ICustomerProfile | null> {
    const cached = this.profileSubject.value;
    if (cached) return of(cached);
    if (!this.isLoggedIn()) return of(null);

    return this.customerAuthApi.me().pipe(
      map((res) => (res.code === 1 ? res.data ?? null : null)),
      map((profile) => {
        if (profile) this.profileSubject.next(profile);
        return profile;
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Người dân có thể vào Cài đặt Zalo GỠ quyền đã cấp, hoàn toàn ngoài phiên app. Khi đó phiên
   * đăng nhập hiện tại không còn cơ sở để tồn tại: xoá token nội bộ + hồ sơ trong RAM, để lần vào
   * sau phải đăng nhập lại từ đầu.
   *
   * Phải gọi ở điểm vào màn hình chứ không chỉ lúc app khởi động: thao tác gỡ quyền diễn ra ở ứng
   * dụng Zalo, người dân quay lại webview vẫn đang chạy nên constructor không chạy lại.
   *
   * @return true nếu vừa phát hiện có scope bị thu hồi (đã xoá phiên).
   */
  clearSessionIfScopeRevoked$(): Observable<boolean> {
    return this.zmaService.getPermissionSettings$().pipe(
      map((settings: GetSettingReturn) => {
        const authSetting = (settings?.authSetting ?? {}) as Record<string, boolean>;
        const revoked = this.grantedScopes().filter((scope) => !authSetting[scope]);

        if (!revoked.length) {
          return false;
        }

        console.warn('[clearSessionIfScopeRevoked$] Quyền bị thu hồi, xoá phiên đăng nhập:', revoked);
        this.clearSession();
        this.zmaStorage.remove(STORAGE_KEYS.GRANTED_SCOPES);

        return true;
      }),
      catchError(() => of(false))
    );
  }

  /** Xoá sạch phiên đăng nhập nội bộ: token, hồ sơ trong RAM, cache zaloUserId. */
  clearSession(): void {
    this.tokenStore.clear();
    this.profileSubject.next(null);
    this.zaloUserIdCache$ = undefined;
    // Không xoá thì đổi tài khoản Zalo trên cùng thiết bị sẽ thấy tạm thời hồ sơ cư trú của
    // người đăng nhập trước, tới khi cache tự nạp lại.
    this.residentCache.invalidate();
  }

  /**
   * ĐĂNG XUẤT — người dân chủ động bấm nút. Báo BE thu hồi token hiện tại trước (best-effort, lỗi
   * mạng không chặn đăng xuất phía client), rồi xoá sạch phiên nội bộ.
   */
  logout$(): Observable<void> {
    return this.customerAuthApi.logout().pipe(
      catchError(() => of(null)),
      map(() => {
        this.clearSession();
      }),
    );
  }

  /** Scope đã cấp, lưu bền để so sánh phát hiện thu hồi (dùng chung key với UserService). */
  private grantedScopes(): string[] {
    const stored = this.zmaStorage.get<string[]>(STORAGE_KEYS.GRANTED_SCOPES, []);

    return Array.isArray(stored) ? stored : [];
  }

  /**
   * Gọi endpoint logout với TOKEN CŨ (không phải token hiện tại) để BE thu hồi luôn phía server,
   * không chỉ xoá client. Bắt buộc gọi trực tiếp qua HttpClient thay vì
   * `CustomerAuthApiService.logout()` — nếu dùng service đó, request sẽ đi qua `ApiInterceptor`,
   * và interceptor sẽ gắn token HIỆN TẠI; tại thời điểm này token cũ vừa bị xoá và phiên mới đang
   * được tạo cho tài khoản Zalo khác, nên sẽ tự đăng xuất chính người vừa đăng nhập.
   * Không chặn luồng đăng nhập hiện tại nếu lỗi.
   */
  private revokeStaleToken(staleToken: string): void {
    const url = this.api.getBaseUrlApi(CUSTOMER_API_ENDPOINTS.AUTH_LOGOUT, false);
    this.http.post(url, {}, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staleToken}`,
      }),
    }).pipe(catchError(() => of(null))).subscribe();
  }

  /** Cache trong phiên: 1 lần getUserID() cho cả phiên app đang chạy. */
  private currentZaloUserId$(): Observable<string> {
    if (!this.zaloUserIdCache$) {
      this.zaloUserIdCache$ = this.zmaService.getUserId$().pipe(
        map((res: any) => (typeof res === 'string' ? res : (res?.userId ?? res?.id ?? ''))),
        shareReplay(1),
      );
    }
    return this.zaloUserIdCache$;
  }

  private phoneErrorMessage(error: any): string {
    const errorCode: string | undefined = error?.errorCode ?? undefined;

    // Vượt hạn mức: thông báo của BE có kèm số giây phải chờ, dùng nguyên văn để người dân biết
    // chờ bao lâu thay vì chỉ thấy "thử lại sau".
    if (errorCode === 'TOO_MANY_REQUESTS' || error?.status === 429) {
      return error?.message || UserManageService.PHONE_ERROR_MESSAGES['TOO_MANY_REQUESTS'];
    }

    if (errorCode && UserManageService.PHONE_ERROR_MESSAGES[errorCode]) {
      return UserManageService.PHONE_ERROR_MESSAGES[errorCode];
    }

    return 'Không lấy được số điện thoại từ Zalo, vui lòng thử lại.';
  }

  // Tiện ích ZMP SDK dùng chung

  /** Kiểm tra getSetting() trước, chỉ request scope còn thiếu; bắt lỗi code -201 khi user từ chối. */
  authorizeScopes$(scopes: AllScope[]): Observable<Record<AllScope, boolean>> {
    return from(getSetting({} as any)).pipe(
      switchMap((settings: GetSettingReturn) => {
        const authSetting = (settings?.authSetting ?? {}) as Partial<Record<AllScope, boolean>>;
        const toRequest = scopes.filter((s) => !authSetting[s]);

        if (!toRequest.length) {
          return of(authSetting as Record<AllScope, boolean>);
        }

        return this.zmaService.getAuthorize(toRequest as AllScope[]).pipe(
          map((result) => ({...authSetting, ...result} as Record<AllScope, boolean>)),

          switchMap(() => from(getSetting({} as any))),
          map((re) => (re?.authSetting ?? {}) as Record<AllScope, boolean>),

          catchError((error: any) => {
            const code = error?.code;
            if (code === -201) {
              console.warn('[authorizeScopes$] User từ chối cấp quyền cho:', toRequest);
            } else {
              console.error('[authorizeScopes$] Lỗi authorize()', error);
            }
            return of(authSetting as Record<AllScope, boolean>);
          })
        );
      })
    );
  }

  authorizeAndFetchUser$(scopes: AllScope[]): Observable<{
    perms: Record<AllScope, boolean>;
    userInfo: any | null;
  }> {
    return this.authorizeScopes$(scopes).pipe(
      switchMap((perms) => {
        const allGranted = scopes.every((s) => !!perms[s]);
        if (!allGranted) {
          return of({perms, userInfo: null});
        }
        // `autoRequestPermission: true` là BẮT BUỘC — thiếu nó SDK không tự bung form xin quyền
        // tên/ảnh đại diện, `userInfo` sẽ luôn rỗng.
        return from(getUserInfo({autoRequestPermission: true} as any)).pipe(
          map((res: any) => ({perms, userInfo: res?.userInfo ?? null})),
          catchError((err) => {
            console.error('[authorizeAndFetchUser$] getUserInfo error:', err);
            return of({perms, userInfo: null});
          })
        );
      })
    );
  }
}
