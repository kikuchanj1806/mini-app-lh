import { Injectable } from '@angular/core';
import {
  HttpClient, HttpErrorResponse, HttpEvent, HttpHeaders, HttpParams,
} from '@angular/common/http';
import {Observable, tap, throwError} from 'rxjs';
import { catchError } from 'rxjs/operators';
import {IResponseApi} from '../models';
import {parseParams} from '../utils/app.utils';
import {environment} from '../../../environments';

interface ApiOptions {
  includeAppId?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = (environment.apiUrl ?? '').replace(/\/+$/, '');
  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  private readonly appId = String(environment.apiConfig?.appId ?? '');

  constructor(private http: HttpClient) {}

  /** GET chung */
  get<T>(
    endpoint: string,
    params?: Record<string, unknown>,
    { includeAppId = true }: ApiOptions = {}
  ): Observable<T> {
    const url = this.buildUrl(endpoint, includeAppId);
    return this.http.get<T>(url, { params: this.toHttpParams(params), headers: this.buildHeaders() })
      .pipe(catchError(this.handleError));
  }

  /** POST chung (body = JSON) */
  post<T>(
    endpoint: string,
    body?: unknown,
    { includeAppId = true }: ApiOptions = {}
  ): Observable<T> {
    const url = this.buildUrl(endpoint, includeAppId);
    return this.http.post<T>(url, body, { headers: this.buildHeaders() })
      .pipe(catchError(this.handleError));
  }
  // private buildHeaders(): HttpHeaders {
  //   const token = 'jvGdxcvKxY4HUvS4tGZGm1DlCCNTGfCPm3NdvxRxFM78tXpStwS0JqwEkHgaBqkIfmQY0VFChGFD45gZEnADhuY92JXhwcWTFqsSdaZjNDmIr1ZOONDrB4FhSsM74XjR'
  //   const headerConfig: Record<string,string> = {
  //     'Content-Type': 'application/json',
  //   };
  //   // if (token) {
  //   //   headerConfig['Authorization'] = token;
  //   // }
  //   return new HttpHeaders(headerConfig);
  // }

  private buildHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  /**
   * Dùng cho các API POST dành cho GUEST có thể xem được
   * */
  postGuestRequest<T = IResponseApi>(endpoint: string, params = {}, resType = 'json'): Observable<T> {
    params = parseParams(params);
    const options = {
      responseType: resType
    }

    return this.http.post<T>(this.getBaseUrlApi(endpoint, true), params, { headers: this.headers }).pipe(
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
    // return this.handleTapDebug();
    return tap({
      next: (res: IResponseApi) => {
        if (res.errorCode == 'ERR_PAGE_401') {
          // Something code handle
        }
      },
      error: err => {
        // console.error('handleTapRes', err)
      }
    });
  }

  private handleTapDebug(): any {
    return tap({
      next: (resp: any) => {
        console.log('Content-Type:', resp.headers.get('content-type'));
        console.log('Raw body >>>', resp.body);          // xem thực sự BE trả gì
        try {
          const json = JSON.parse(resp.body);
          // TODO: dùng json
        } catch {
          console.warn('Không phải JSON, xử lý khác hoặc báo lỗi BE');
        }
      },
      error: err => console.error('HTTP error', err)
      // error: err => {
      //    console.error('handleTapRes', err)
      // }
    });
  }

  /** Nếu cần lấy URL đầy đủ */
  getBaseUrlApi(endpoint: string, withAppId: boolean = false): string {
    return this.buildUrl(endpoint, withAppId);
  }

  /** Ghép base + endpoint và (tuỳ chọn) gắn appId vào query */
  private buildUrl(endpoint: string, withAppId: boolean): string {
    const path = (endpoint ?? '').startsWith('/') ? endpoint : `/${endpoint ?? ''}`;
    let url = `${this.baseUrl}${path}`;
    if (withAppId) url = this.appendAppId(url);
    return url;
  }

  private appendAppId(url: string): string {
    if (!this.appId || /[?&]appId=/.test(url)) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}appId=${encodeURIComponent(this.appId)}`;
  }

  /** Chuyển object -> HttpParams */
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

  /** Lỗi chung */
  private handleError(error: HttpErrorResponse) {
    const message = error?.error?.message || error?.message || 'Có lỗi từ máy chủ, vui lòng thử lại sau.';
    return throwError(() => new Error(message));
  }
}
