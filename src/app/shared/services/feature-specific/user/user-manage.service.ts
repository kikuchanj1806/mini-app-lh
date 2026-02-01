import {inject, Injectable} from '@angular/core';
import {AllScope, IResPhoneNumber, IUserPhoneRequestParams, IZaloSyncUserPayload} from '../../../models/global';
import {catchError, finalize, from, Observable, of} from 'rxjs';
import {getAccessToken, getSetting, getUserInfo} from 'zmp-sdk/apis';
import {map, shareReplay, switchMap} from 'rxjs/operators';
import {GetSettingReturn} from 'zmp-sdk/';
import {ZmpService} from '../../../../core/services';
import {UserApiService} from '../../api/user/user-api.service';
import {IResponseApi} from '../../../../core/models';
import {ZmaTokenStorage} from './zma-token-storage.service';

@Injectable({providedIn: 'root'})
export class UserManageService {
  private zmaService = inject(ZmpService);
  private userApi = inject(UserApiService);
  private tokenStore = inject(ZmaTokenStorage);
  private refreshing?: Observable<string>;


  /** Đảm bảo có token hợp lệ, nếu không sẽ refresh */
  /** dùng cho interceptor: lấy token nếu còn hạn */
  getTokenIfValid(): string | null {
    if (!this.tokenStore.isValid()) return null;
    return this.tokenStore.get()?.token ?? null;
  }

  /** Đảm bảo có token hợp lệ */
  getValidToken$(appId: string): Observable<string> {
    const token = this.getTokenIfValid();
    if (token) return of(token);
    return this.refresh$(appId);
  }

  /** Refresh token: gọi /api/zma/auth/sync */
  refresh$(appId: string): Observable<string> {
    if (this.refreshing) return this.refreshing;

    this.refreshing = from(getAccessToken()).pipe(
      // nếu SDK trả object -> map cho chắc
      map((x: any) => (typeof x === 'string' ? x : (x?.accessToken ?? ''))),
      switchMap((zaloAccessToken: string) => {
        if (!zaloAccessToken) throw new Error('Cannot get zaloAccessToken');
        return this.userApi.syncAuth({ appId, zaloAccessToken });
      }),
      map((res: any) => {
        const token = res?.data?.token;
        const expiresAt = res?.data?.expiresAt;
        if (!token || !expiresAt) throw new Error('Invalid sync response');

        this.tokenStore.set({ token, expiresAt });
        return token as string;
      }),
      finalize(() => (this.refreshing = undefined)),
      shareReplay(1)
    );

    return this.refreshing;
  }

  /**
   * Xin các scope cần thiết và trả về map scope=>granted
   * Áp dụng Best Practices:
   * 1) Dùng getSetting() để kiểm tra trước
   * 2) Chỉ request các scope thiếu, giải thích rõ lý do
   * 3) Bắt lỗi code -201 khi user từ chối
   * @param scopes Mảng các scope thuộc AllScope
   */
  authorizeScopes$(scopes: AllScope[]): Observable<Record<AllScope, boolean>> {
    return from(getSetting({} as any)).pipe(
      switchMap((settings: GetSettingReturn) => {
        const authSetting = (settings?.authSetting ?? {}) as Partial<Record<AllScope, boolean>>;
        const toRequest = scopes.filter((s) => !authSetting[s]);

        if (!toRequest.length) {
          return of(authSetting as Record<AllScope, boolean>);
        }

        return this.zmaService.getAuthorize(toRequest as AllScope[]).pipe(
          map((result) => ({ ...authSetting, ...result } as Record<AllScope, boolean>)),

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
          return of({ perms, userInfo: null });
        }
        return from(getUserInfo()).pipe(
          map((res: any) => ({ perms, userInfo: res?.userInfo ?? null })),
          catchError((err) => {
            console.error('[authorizeAndFetchUser$] getUserInfo error:', err);
            return of({ perms, userInfo: null });
          })
        );
      })
    );
  }

  /**
   * authorize & getUserInfo
   * nếu có scope.userPhonenumber → mở getPhoneNumber, lấy code
   * lấy access_token, build payload ký HMAC
   * gọi BE để đổi ra phoneNumber, merge vào userInfo
   */
  grantPermissionAndFetchUser$(scopes: AllScope[]) {
    return this.authorizeAndFetchUser$(scopes).pipe(
      switchMap(({ perms, userInfo })  => {
        if (!userInfo) {
          return of({ perms, userInfo: null });
        }

        return this.zmaService.getPhoneNumber().pipe(
          switchMap(({ token }) =>
            from(getAccessToken()).pipe(
              switchMap((accessToken: string) =>
                this.userApi
                  .getPhoneNumber({ access_token: accessToken, code: token } as IUserPhoneRequestParams)
                  .pipe(
                    map((res: IResponseApi<IResPhoneNumber>) => {
                      if (!res?.code) return { perms, userInfo };
                      const phone = res?.data?.phone;
                      if (!phone) return { perms, userInfo };
                      const updatedUser = { ...userInfo, phoneNumber: phone };
                      return { perms, userInfo: updatedUser };
                    })
                  )
              )
            )
          ),
          catchError(() => of({ perms, userInfo }))
        );
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Dùng để dubug trên app production
   */

  // grantPermissionAndFetchUser$(scopes: AllScope[]) {
  //   console.log('[UserMS] grantPermissionAndFetchUser$ start', { scopes });
  //
  //   return this.authorizeAndFetchUser$(scopes).pipe(
  //     tap(({ perms, userInfo }) => {
  //       console.log('[UserMS] authorizeAndFetchUser$ ->', {
  //         perms,
  //         hasUserInfo: !!userInfo
  //       });
  //     }),
  //
  //     switchMap(({ perms, userInfo }) => {
  //       if (!userInfo) {
  //         console.warn('[UserMS] No userInfo after authorize; skip phone enrichment');
  //         return of({ perms, userInfo: null });
  //       }
  //
  //       // Lấy token phone từ ZMP
  //       return this.zmaService.getPhoneNumber().pipe(
  //         tap(({ token }) => {
  //           const head = token ? token.slice(0, 4) : '';
  //           console.log('[UserMS] getPhoneNumber() token received', {
  //             length: token?.length ?? 0,
  //             preview: token ? `${head}…` : '(empty)'
  //           });
  //         }),
  //
  //         switchMap(({ token }) =>
  //           // Có thể dùng: this.zmaService.getAccessToken$()
  //           from(getAccessToken()).pipe(
  //             tap((accessToken: string) =>
  //               console.log('[UserMS] getAccessToken() OK', {
  //                 length: accessToken?.length ?? 0
  //               })
  //             ),
  //
  //             switchMap((accessToken: string) =>
  //               this.userSpecificService
  //                 .getPhoneNumber({ access_token: accessToken, code: token } as IUserPhoneRequestParams)
  //                 .pipe(
  //                   tap((res) => {
  //                     console.log('[UserMS] server getPhoneNumber() response', res);
  //                   }),
  //
  //                   map((res: IResponseApi<IResPhoneNumber>) => {
  //                     if (!res?.code) {
  //                       console.warn('[UserMS] server getPhoneNumber() code != 1 (or falsy)', res);
  //                       // Giữ nguyên userInfo nếu BE trả về lỗi
  //                       return { perms, userInfo };
  //                     }
  //
  //                     const phone = res?.data?.phone;
  //                     if (!phone) {
  //                       console.warn('[UserMS] server getPhoneNumber() missing data.phone');
  //                       return { perms, userInfo };
  //                     }
  //
  //                     const updatedUser = { ...userInfo, phoneNumber: phone, name: phone };
  //                     console.log('[UserMS] user enriched with phone', { phonePreview: `${phone.slice(0,3)}****` });
  //                     return { perms, userInfo: updatedUser };
  //                   })
  //                 )
  //             )
  //           )
  //         ),
  //
  //         catchError((err) => {
  //           console.error('[UserMS] Phone enrichment error', err);
  //           // Không “văng” lỗi ra ngoài, trả về userInfo hiện có
  //           return of({ perms, userInfo });
  //         })
  //       );
  //     }),
  //
  //     tap((out) => {
  //       console.log('[UserMS] grantPermissionAndFetchUser$ output', out);
  //     }),
  //
  //     catchError((err) => {
  //       console.error('[UserMS] grantPermissionAndFetchUser$ fatal error', err);
  //       return of(null);
  //     }),
  //
  //     finalize(() => {
  //       console.log('[UserMS] grantPermissionAndFetchUser$ complete');
  //     })
  //   );
  // }
}
