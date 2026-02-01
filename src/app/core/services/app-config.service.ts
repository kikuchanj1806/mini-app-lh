import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, filter, map, shareReplay, take, tap } from 'rxjs/operators';
import {AppUrlService} from './app-url.service';
export interface AppConfig {
  app?: {
    title?: string;
    textColor?: string;
    headerColor?: string;
    statusBar?: 'normal' | 'light' | 'dark';
    actionBarHidden?: boolean;
    hideAndroidBottomNavigationBar?: boolean;
    hideIOSSafeAreaBottom?: boolean;
    selfControlLoading?: boolean;
  };
  listCSS?: string[];
  listSyncJS?: string[];
  listAsyncJS?: string[];
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private http = inject(HttpClient);
  private urlSvc = inject(AppUrlService);

  private _config?: AppConfig;
  private _loaded$ = new BehaviorSubject<boolean>(false);

  /** Observable: emit true khi cấu hình đã được load */
  readonly loaded$ = this._loaded$.asObservable();

  get config(): AppConfig | undefined { return this._config; }

  private _load$?: Observable<void>;

  load$(): Observable<void> {
    if (this._load$) return this._load$;

    const url = this.urlSvc.buildAssetUrl('app-config.json');
    this._load$ = this.http.get<AppConfig>(url, { observe: 'response' }).pipe(
      take(1),
      tap(res => {
        const body = res.body;
        if (!body || typeof body !== 'object') {
          throw new Error('Invalid app-config.json');
        }
        this._config = body;
      }),
      catchError(err => {
        console.warn('[AppConfig] load FAILED, using defaults', { url, err });
        this._config = {
          app: {
            title: 'App',
            headerColor: '#0b2e69',
            textColor: '#000000',
            statusBar: 'normal',
            selfControlLoading: false
          },
          listCSS: [], listSyncJS: [], listAsyncJS: []
        };
        return of(this._config);
      }),
      tap(() => this.applyCssVars()),
      tap(() => this._loaded$.next(true)),
      map(() => void 0),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    return this._load$;
  }
  waitUntilLoaded$(): Observable<AppConfig> {
    return this.loaded$.pipe(
      filter(Boolean),
      take(1),
      map(() => this._config!)
    );
  }

  /** Set CSS variables từ config */
  private applyCssVars(): void {
    const app = this._config?.app ?? {};
    const primary = app.headerColor ?? '#0b2e69';
    const text    = app.textColor   ?? '#000000';
    const root = document.documentElement;
    root.style.setProperty('--brand-color', primary);
    root.style.setProperty('--brand-text',  text);
  }
}
