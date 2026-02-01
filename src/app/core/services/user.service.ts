import {inject, Injectable, signal} from '@angular/core';
import {BehaviorSubject, catchError, defer, from, Observable, of} from 'rxjs';
import {getSetting, getUserInfo, nativeStorage} from 'zmp-sdk/apis';
import { STORAGE_KEYS } from '../models/storage.model';
import { IResUserInfo } from '../models/zmp.model';
import {map, shareReplay, switchMap, tap} from 'rxjs/operators';
import {ZmpService} from './zmp-service/zmp.service';
import {ZmaNativeStorageService} from './storage.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private _userInfo$ = new BehaviorSubject<IResUserInfo | null>(null);
  readonly userInfo$: Observable<IResUserInfo | null> = this._userInfo$.asObservable();
  private zmaStorage = inject(ZmaNativeStorageService);

  private _grantedScopes: Set<string> = new Set();

  constructor(
  ) {
    this.checkAndLoadCache();
  }

  /**
   * Kiểm tra quyền người dùng + load dữ liệu cache (nếu còn hợp lệ)
   */
  private async checkAndLoadCache(): Promise<void> {
    try {
      const settings = await getSetting({});
      const authSetting = settings.authSetting as Record<string, boolean>;

      // Lấy scopes từ storage
      const scopesJson = await nativeStorage.getItem(STORAGE_KEYS.GRANTED_SCOPES);
      const storedScopes: string[] = scopesJson ? JSON.parse(scopesJson) : [];

      // Nếu scope nào bị thu hồi → xóa toàn bộ cache
      const revoked = storedScopes.filter(scope => !authSetting[scope]);
      if (revoked.length > 0) {
        this.clearCache();
        return;
      }

      // Gán lại scopes
      storedScopes.forEach(s => this._grantedScopes.add(s));

      // Load user info
      const userJson = await nativeStorage.getItem(STORAGE_KEYS.USER_INFO);
      if (userJson) {
        const info: IResUserInfo = JSON.parse(userJson);
        this._userInfo$.next(info);
      }
    } catch (e) {
      console.error('UserService.checkAndLoadCache failed', e);
      this.clearCache();
    }
  }

  /**
   * Lưu granted scopes và user info vào bộ nhớ thiết bị + BehaviorSubject
   */
  async saveGrantAndUser(
    granted: Record<string, boolean>,
    info: IResUserInfo
  ): Promise<void> {
    // 1️⃣ Lưu scopes được cấp quyền
    const scopes = Object.keys(granted).filter(s => granted[s]);
    try {
      await nativeStorage.setItem(STORAGE_KEYS.GRANTED_SCOPES, JSON.stringify(scopes));
      this._grantedScopes = new Set(scopes);
    } catch (e) {
      console.error('Failed to cache grantedScopes', e);
    }

    // 2️⃣ Lưu thông tin user
    try {
      await nativeStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(info));
      this._userInfo$.next(info);
    } catch (e) {
      console.error('Failed to cache userInfo', e);
    }
  }

  /**
   * Xóa cache khi người dùng logout hoặc thu hồi quyền
   */
  async clearCache(): Promise<void> {
    try {
      await nativeStorage.removeItem(STORAGE_KEYS.GRANTED_SCOPES);
    } catch {}
    try {
      await nativeStorage.removeItem(STORAGE_KEYS.USER_INFO);
    } catch {}
    this._grantedScopes.clear();
    this._userInfo$.next(null);
  }

  /**
   * Lấy danh sách scopes đã được cấp quyền
   */
  getGrantedScopes(): string[] {
    return Array.from(this._grantedScopes);
  }

  /** @deprecated
   * -> Chuyển qua dùng userInfoValue
   * Lấy data user lưu trong storage
   */
  getDataUser() {
    return nativeStorage.getItem(STORAGE_KEYS.USER_INFO);
  }

  get userInfoValue(): IResUserInfo | null {
    return this._userInfo$.value;
  }

  hydrateFromStorage$() {
    // Lấy user info mới nhất
    const latest$ = from(getUserInfo()).pipe(
      map((res: any) => (res?.userInfo ?? res) as Partial<IResUserInfo> | null),
      catchError(() => of(null))
    );

    // Check lại cache, nếu có thay đổi thì update lại
    return latest$.pipe(
      switchMap((latest) =>
        defer(() => {
          const raw = nativeStorage.getItem(STORAGE_KEYS.USER_INFO);
          let stored: IResUserInfo | null = null;
          try { stored = raw ? JSON.parse(raw) as IResUserInfo : null; } catch { stored = null; }

          const merged = this.mergeKeepingPhone(stored, latest);

          const changed = !this.shallowEqual(stored, merged);
          if (changed) {
            nativeStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(merged));
          }

          this._userInfo$.next(merged);
          return of(merged);
        })
      ),
      catchError(() => {
        this._userInfo$.next(null);
        return of(null);
      }),
      shareReplay(1)
    );
  }

  /** Gộp dữ liệu, không ghi đè phoneNumber từ storage */
  private mergeKeepingPhone(
    stored: IResUserInfo | null,
    latest: Partial<IResUserInfo> | null
  ): IResUserInfo | null {
    if (!stored && !latest) return null;
    const keepPhone = stored?.phoneNumber;

    const cleanedLatest = latest
      ? Object.fromEntries(Object.entries(latest).filter(([, v]) => v !== undefined))
      : {};

    const merged = { ...(stored ?? {}), ...(cleanedLatest as object) } as IResUserInfo;
    if (keepPhone != null) merged.phoneNumber = keepPhone;
    return merged;
  }

  private shallowEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    for (const k of ak) {
      if (a[k] !== b[k]) return false;
    }
    return true;
  }

  setUserInfo$(info: IResUserInfo | null) {
    return defer(() => {
      if (info) {
        nativeStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(info));
      } else {
        nativeStorage.removeItem(STORAGE_KEYS.USER_INFO);
      }
      this._userInfo$.next(info);
      return of(void 0);
    });
  }

  /**
   * Hàm dùng để update lại isHaveFollow
   */
  updateIsHaveFollow(flag: boolean): void {
    const cur = this._userInfo$.value;
    this.zmaStorage.set(STORAGE_KEYS.USER_INFO, { ...cur, isHaveFollow: flag });
  }
}
