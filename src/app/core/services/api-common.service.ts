import { Injectable } from '@angular/core';
import {
  HttpClient, HttpErrorResponse, HttpEvent, HttpHeaders, HttpParams,
} from '@angular/common/http';
import {Observable, tap, throwError} from 'rxjs';
import { catchError } from 'rxjs/operators';
import {IResponseApi} from '../models';
import {environment} from '../../../environments';

interface ApiOptions {
  includeAppId?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = (environment.apiUrl ?? '').replace(/\/+$/, '');
  private readonly apiPrefix = (environment.apiPrefix ?? '/api/v1').replace(/^\/?/, '/').replace(/\/+$/, '');
  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  private readonly appId = String(environment.apiConfig?.appId ?? '');

  constructor(private http: HttpClient) {}

  get<T>(
    endpoint: string,
    params?: Record<string, unknown>,
    { includeAppId = true }: ApiOptions = {}
  ): Observable<T> {
    const url = this.buildUrl(endpoint, includeAppId);
    return this.http.get<T>(url, { params: this.toHttpParams(params), headers: this.buildHeaders() })
      .pipe(catchError(this.handleError));
  }

  post<T>(
    endpoint: string,
    body?: unknown,
    { includeAppId = true }: ApiOptions = {}
  ): Observable<T> {
    const url = this.buildUrl(endpoint, includeAppId);
    return this.http.post<T>(url, body, { headers: this.buildHeaders() })
      .pipe(catchError(this.handleError));
  }

  postV1<T>(endpoint: string, body?: object | null): Observable<T> {
    const payload = this.withAppId(body);
    return this.http.post<T>(this.buildV1Url(endpoint), payload, { headers: this.buildHeaders() })
      .pipe(catchError(this.handleError));
  }

  uploadV1<T>(endpoint: string, formData: FormData): Observable<T> {
    if (this.appId && !formData.has('appId')) {
      formData.append('appId', this.appId);
    }

    return this.http.post<T>(this.buildV1Url(endpoint), formData)
      .pipe(catchError(this.handleError));
  }
  private buildHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  /**
   * Dùng cho các API POST dành cho GUEST có thể xem được (nhóm `tenant public` của BE).
   *
   * `appId` được gắn vào CẢ body lẫn query: `TenantResolver` phía BE đọc `input()` trước rồi mới
   * tới `query()`, nhưng BE là POST-only nên body mới là chỗ đúng quy ước — query giữ lại cho
   * tương thích với các bản mini app cũ đang chạy.
   */
  postGuestRequest<T = IResponseApi>(
    endpoint: string,
    params: Record<string, unknown> = {},
    resType: 'json' = 'json',
  ): Observable<T> {
    const body = this.appId && params['appId'] == null
      ? { ...params, appId: this.appId }
      : params;

    return this.http.post<T>(this.getBaseUrlApi(endpoint, true), body, {
      headers: this.headers,
      responseType: resType,
    }).pipe(
      this.handleTapRes(),
    )
  }

  postFormDataRequestProgress<T>(
    endpoint: string,
    formData: FormData,
    withAppId = true,
  ): Observable<HttpEvent<T>> {

    const options = {
      reportProgress: true,
      observe: 'events' as const,
    };

    const url = this.buildUrl(endpoint, withAppId);

    return this.http.post<T>(url, formData, options);
  }

  private handleTapRes(): any {
    return tap({
      next: (res: IResponseApi) => {
        if (res.errorCode == 'ERR_PAGE_401') {
        }
      },
      error: err => {
      }
    });
  }

  private handleTapDebug(): any {
    return tap({
      next: (resp: any) => {
        console.log('Content-Type:', resp.headers.get('content-type'));
        console.log('Raw body >>>', resp.body);
        try {
          const json = JSON.parse(resp.body);
        } catch {
          console.warn('Không phải JSON, xử lý khác hoặc báo lỗi BE');
        }
      },
      error: err => console.error('HTTP error', err)
    });
  }

  getBaseUrlApi(endpoint: string, withAppId: boolean = false): string {
    return this.buildUrl(endpoint, withAppId);
  }

  private buildUrl(endpoint: string, withAppId: boolean): string {
    const path = (endpoint ?? '').startsWith('/') ? endpoint : `/${endpoint ?? ''}`;
    let url = `${this.baseUrl}${path}`;
    if (withAppId) url = this.appendAppId(url);
    return url;
  }

  private buildV1Url(endpoint: string): string {
    const raw = endpoint ?? '';
    const normalized = raw.startsWith('/') ? raw : `/${raw}`;
    const path = normalized.startsWith(this.apiPrefix)
      ? normalized
      : `${this.apiPrefix}${normalized}`;
    return `${this.baseUrl}${path}`;
  }

  private withAppId(body?: object | null): Record<string, unknown> {
    const payload: Record<string, unknown> = { ...(body ?? {}) };
    if (this.appId && payload['appId'] == null && payload['zaloAppId'] == null && payload['zalo_app_id'] == null) {
      payload['appId'] = this.appId;
    }
    return payload;
  }

  private appendAppId(url: string): string {
    if (!this.appId || /[?&]appId=/.test(url)) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}appId=${encodeURIComponent(this.appId)}`;
  }

  private toHttpParams(params?: Record<string, unknown>): HttpParams {
    if (!params) return new HttpParams();
    let hp = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      if (v == null) continue;
      if (Array.isArray(v)) v.forEach(x => x != null && (hp = hp.append(k, String(x))));
      else hp = hp.set(k, String(v));
    }
    return hp;
  }

  /**
   * Lỗi chung — CHUẨN HOÁ thành 1 Error thường (không phải HttpErrorResponse) vì code gọi
   * get()/post() ở khắp nơi trong app chỉ xử lý `.message`. Giữ lại `status`/`errorCode`/
   * `messages` từ body lỗi backend (envelope `{code:0, errorCode, messages, data:null}`) làm
   * property phụ trên Error, để những chỗ cần phân biệt lỗi nghiệp vụ 409 (vd: lấy số thứ tự)
   * có thể đọc được thay vì luôn nhận về 1 message chung chung.
   */
  private handleError(error: HttpErrorResponse) {
    const body: any = error?.error;
    const messages: string[] | undefined = Array.isArray(body?.messages) ? body.messages : undefined;
    const message = messages?.[0] || body?.message || error?.message || 'Có lỗi từ máy chủ, vui lòng thử lại sau.';

    const normalized: any = new Error(message);
    normalized.status = error?.status;
    normalized.errorCode = body?.errorCode;
    normalized.messages = messages;

    return throwError(() => normalized);
  }
}
