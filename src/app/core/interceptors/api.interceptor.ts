import {inject, Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {environment} from '../../../environments';
import {finalize, Observable, tap} from 'rxjs';
import {ZmaTokenStorage} from '../../shared/services/feature-specific/user/zma-token-storage.service';
import {CUSTOMER_AUTH_PUBLIC_PATHS} from '../constants';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  private tokenStore = inject(ZmaTokenStorage);

  /**
   * Nhận diện endpoint theo ĐƯỜNG DẪN đã bỏ query, không phải `url.includes(...)`.
   *
   * Mọi request public đều mang `?appId=...`, mà so khớp bằng `includes` trên chuỗi có query rất dễ
   * trúng nhầm — vd `/api/v1/customer/auth/zalo?appId=x` vẫn "chứa" `/api/v1/customer/`.
   */
  private apiPath(req: HttpRequest<any>): string {
    const cleanUrl = req.url.split('?')[0];
    const apiIndex = cleanUrl.indexOf('/api/');
    return apiIndex >= 0 ? cleanUrl.slice(apiIndex) : cleanUrl;
  }

  private needsAuth(req: HttpRequest<any>): boolean {
    const path = this.apiPath(req);

    // Hai bước đăng nhập chính là nơi PHÁT RA token nên không thể tự yêu cầu token. Bỏ qua ở đây
    // cũng là thứ chặn đệ quy: request đăng nhập cũng đi qua interceptor này.
    if (CUSTOMER_AUTH_PUBLIC_PATHS.includes(path)) return false;

    if (path.startsWith('/api/v1/customer/')) {
      return environment.features?.authEnabled !== false;
    }

    // Phần còn lại của v1 là nhóm `tenant public` — chỉ cần appId, không token.
    if (path.startsWith('/api/v1/')) return false;

    return this.legacyNeedsAuth(req);
  }

  /** Backend đời trước (quiz, tthc-video) — gỡ hẳn khi hai cụm đó được chuyển sang v1. */
  private legacyNeedsAuth(req: HttpRequest<any>): boolean {
    const u = req.url;

    if (u.includes('/api/zma/auth/sync')) return false;
    if (u.includes('/api/zma/getphonenumber')) return false;
    if (req.method === 'GET' && u.includes('/api/questions/list')) return false;
    if (req.method === 'GET' && u.includes('/api/quiz-results')) return false;

    if (u.includes('/api/admin/')) return true;
    if (u.includes('/api/users')) return true;
    if (u.includes('/api/upload')) return true;
    if (u.includes('/api/zma/upload')) return true;
    if (u.includes('/api/zma/quiz-results-zma')) return true;
    if (u.includes('/api/questions')) return req.method !== 'GET';

    return false;
  }

  /**
   * CHỈ GẮN token sẵn có, KHÔNG tự đăng nhập.
   *
   * Đăng nhập của mini app bao gồm `authorize()` và `getPhoneNumber()` — cả hai cần ngữ cảnh thao
   * tác thật của người dùng, không chạy được từ một request nền. Để interceptor tự đăng nhập sẽ
   * khiến hộp thoại xin quyền bung ra ở màn bất kỳ, và chính request đăng nhập cũng đi qua đây nên
   * sẽ đệ quy.
   *
   * Không có token thì cứ để request đi và nhận 401; màn hình tự hiện bước "Xác thực số điện
   * thoại" để người dân chủ động đăng nhập (xem `UserManageService.login$()`).
   */
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const started = Date.now();

    const attach = this.needsAuth(req);
    const token = attach ? this.tokenStore.get()?.token ?? null : null;
    const outgoing = token
      ? req.clone({setHeaders: {Authorization: `Bearer ${token}`}})
      : req;

    return next.handle(outgoing).pipe(
      tap({
        error: (err) => {
          if (err instanceof HttpErrorResponse) {
            // Token còn hạn theo đồng hồ client nhưng server đã thu hồi (đăng xuất nơi khác, BE
            // xoá token). Xoá luôn để `isLoggedIn()` phản ánh đúng và màn hình mời đăng nhập lại,
            // thay vì lặp lại 401 cho tới lúc `expiresAt` trôi qua.
            if (token && err.status === 401) {
              this.tokenStore.clear();
            }

            const isBlob = err.error instanceof Blob;
            const safeHeaders = req.headers.keys().filter(k => k.toLowerCase() !== 'authorization');

            console.error('[API] HTTP ERROR', {
              method: req.method,
              url: err.url ?? req.urlWithParams,
              status: err.status,
              statusText: err.statusText,
              message: err.message,
              error: isBlob ? {blob: true, type: err.error.type, size: err.error.size} : err.error,
              requestHeaders: safeHeaders,
            });
          } else {
            console.error('[API] UNKNOWN ERROR', err);
          }
        }
      }),

      finalize(() => {
        const elapsed = Date.now() - started;
      })
    );
  }
}
