import {inject, Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {UserManageService} from '../../shared/services/feature-specific/user/user-manage.service';
import {environment} from '../../../environments';
import {finalize, Observable, tap, throwError} from 'rxjs';
import {catchError, switchMap} from 'rxjs/operators';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  private userMs = inject(UserManageService);

  private get appId(): string {
    return String(environment.apiConfig?.appId ?? '');
  }

  private isPublic(req: HttpRequest<any>): boolean {
    const u = req.url;

    // endpoint sync auth (public)
    if (u.includes('/api/zma/auth/sync')) return true;
    if (u.includes('/api/zma/getphonenumber')) return true;

    // public GET theo routes bạn gửi
    if (req.method === 'GET' && u.includes('/api/news')) return true;
    if (req.method === 'GET' && u.includes('/api/questions/list')) return true;
    if (req.method === 'GET' && u.includes('/api/quiz-results')) return true;
    if (req.method === 'GET' && u.includes('/api/appointmentfield/list')) return true;
    if (req.method === 'GET' && u.includes('/api/timeslot/list')) return true;

    return false;
  }

  private needsAuth(req: HttpRequest<any>): boolean {
    if (this.isPublic(req)) return false;

    const u = req.url;

    // always protected
    if (u.includes('/api/zma/tickets')) return true;
    if (u.includes('/api/admin/')) return true;
    if (u.includes('/api/users')) return true;
    if (u.includes('/api/upload')) return true;
    if (u.includes('/api/ward')) return true;
    if (u.includes('/api/newscategories')) return true;
    if (u.includes('/api/zma/upload')) return true;
    if (u.includes('/api/zma/feedbacks')) return true;

    // mixed endpoints: GET public list/show but CRUD protected
    if (u.includes('/api/news')) return req.method !== 'GET';
    if (u.includes('/api/questions')) return req.method !== 'GET';
    if (u.includes('/api/timeslot')) return req.method !== 'GET';
    if (u.includes('/api/appointmentfield')) return req.method !== 'GET';

    return false;
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const started = Date.now();

    const attach = this.needsAuth(req);

    const token = attach ? this.userMs.getTokenIfValid() : null;
    const reqWithAuth = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(reqWithAuth).pipe(
      // refresh + retry 1 lần khi 401
      catchError((err) => {
        if (attach && err instanceof HttpErrorResponse && err.status === 401) {
          return this.userMs.refresh$(this.appId).pipe(
            switchMap((newToken) => {
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` },
              });
              return next.handle(retryReq);
            })
          );
        }
        return throwError(() => err);
      }),

      // giữ nguyên log lỗi an toàn
      tap({
        error: (err) => {
          if (err instanceof HttpErrorResponse) {
            const isBlob = err.error instanceof Blob;
            const safeHeaders = req.headers.keys().filter(k => k.toLowerCase() !== 'authorization');

            console.error('[API] HTTP ERROR', {
              method: req.method,
              url: err.url ?? req.urlWithParams,
              status: err.status,
              statusText: err.statusText,
              message: err.message,
              error: isBlob ? { blob: true, type: err.error.type, size: err.error.size } : err.error,
              requestHeaders: safeHeaders,
            });
          } else {
            console.error('[API] UNKNOWN ERROR', err);
          }
        }
      }),

      finalize(() => {
        const elapsed = Date.now() - started;
        // console.debug(`[API] ${req.method} ${req.urlWithParams} - ${elapsed}ms`);
      })
    );
  }
}
