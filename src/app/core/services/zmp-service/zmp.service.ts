import { Injectable } from '@angular/core';
import { defer, from, Observable, of, tap, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import {
  getAppInfo,
  getUserInfo,
  authorize,
  getSetting,
  openPermissionSetting,
  Payment,
  getSystemInfo,
  nativeStorage,
  getPhoneNumber,
  getLocation,
  getAccessToken,
  createShortcut,
  saveImageToGallery,
  openShareSheet,
  getUserID,
  followOA,
  EventName,
  events,
  CheckoutSDK,
} from 'zmp-sdk/apis';
import { GetSettingReturn } from 'zmp-sdk';
import {NotifyService} from '../notify.service';
import {AllScope, IZmaGetPhoneNumberReturns} from '../../../shared/models/global';
import {ShareZaloMiniAppParams} from '../../models/zmp.model';


export interface PaymentChannel {
  method: string;
  subMethod?: string;
  subInfo?: string;
}

export interface SelectPaymentConfig {
  channels?: PaymentChannel[];
  selectedMethod?: { method: string; subMethod?: string };
}

export type SelectPaymentMethodResult = {
  method: string;
  subMethod?: string;
  subInfo?: string;
} & Record<string, any>;

export interface SystemInfo {
  version: string;
  apiVersion: string;
  zaloVersion: string;
  platform: 'android' | 'iOS' | 'wp' | 'unknown' | '';
  language: string;
  zaloLanguage: string;
  zaloTheme: string;
}

export type TxnResult = { resultCode: number; msg?: string; [k: string]: any };

@Injectable({ providedIn: 'root' })
export class ZmpService {
  private STORAGE_SYSTEM_INFOR_KEY = 'SystemInfo';
  private SECRET_KEY = 'RN6XLYsREC7Fw8ycovoF';
  constructor(
    private notify: NotifyService
  ) {}

  getUserId$(): Observable<any> {
    return from(getUserID({}));
  }

  getAppInfo$(): Observable<any> {
    return from(getAppInfo({}));
  }

  getUserInfo$(): Observable<any> {
    return from(getUserInfo());
  }

  getSystemInfo$(): Observable<SystemInfo> {
    return from(Promise.resolve(getSystemInfo()));
  }

  getPermissionSettings$(): Observable<GetSettingReturn> {
    return from(getSetting({}));
  }

  openPermissionSetting$(): Observable<any> {
    return from(openPermissionSetting({} as any));
  }

  getPhoneNumber(): Observable<IZmaGetPhoneNumberReturns> {
    return from(getPhoneNumber({} as any)).pipe(
      map((res: { token?: string } | null | undefined) => {
        const token = res?.token;
        if (typeof token !== 'string' || !token) {
          throw new Error('getPhoneNumber() không trả về token hợp lệ');
        }
        return { token };
      })
    );
  }

  getAccessToken$(): Observable<any> {
    return from(getAccessToken({}));
  }

  getLocationToken$(): Observable<string> {
    return from(getLocation({})).pipe(
      map((res) => res?.token ?? '')
    );
  }

  getAuthorize(scopes?: AllScope[]): Observable<Partial<Record<AllScope, boolean>>> {
    const args = scopes && scopes.length ? { scopes } : ({} as any);
    return from(authorize(args));
  }

  onFollowOA(oaId: string): Observable<void> {
    return from(followOA({ id: oaId }));
  }

  private fetchSystemInfo$(): Observable<SystemInfo> {
    try {
      const info = getSystemInfo();
      if (info instanceof Promise) {
        return from(info);
      }
      return of(info as SystemInfo);
    } catch (error) {
      console.error('Failed to get system info:', error);
      return of({} as SystemInfo);
    }
  }

  private saveSystemInfo$(info: SystemInfo) {
    return defer(() => {
      nativeStorage.setItem(this.STORAGE_SYSTEM_INFOR_KEY, JSON.stringify(info));
      return of(true);
    });
  }

  getStoredSystemInfo$(): Observable<SystemInfo | null> {
    return defer(() => {
      try {
        const value = nativeStorage.getItem(this.STORAGE_SYSTEM_INFOR_KEY);
        if (value) {
          const parsed = JSON.parse(value) as SystemInfo;
          return of(parsed);
        }
        return of(null);
      } catch (error) {
        console.warn('Failed to get system info from storage:', error);
        return of(null);
      }
    });
  }

  updateSystemInfoIfChanged$(): Observable<SystemInfo | null> {
    return this.fetchSystemInfo$().pipe(
      switchMap(newInfo =>
        this.getStoredSystemInfo$().pipe(
          switchMap(oldInfo => {
            if (!oldInfo || JSON.stringify(oldInfo) !== JSON.stringify(newInfo)) {
              return this.saveSystemInfo$(newInfo).pipe(switchMap(() => of(newInfo)));
            }
            return of(oldInfo);
          })
        )
      )
    );
  }

  /** Khởi tạo để gọi ra AppComponent khi chạy app */
  initSystemInfo$(): Observable<SystemInfo | null> {
    return this.getStoredSystemInfo$().pipe(
      switchMap(info => {
        if (!info) {
          return this.fetchSystemInfo$().pipe(
            switchMap(newInfo =>
              this.saveSystemInfo$(newInfo).pipe(switchMap(() => of(newInfo)))
            )
          );
        } else {
          return this.updateSystemInfoIfChanged$();
        }
      }),
      tap(info => console.log('System info here:', info))
    );
  }


  /** Kiểm tra getSetting() trước, chỉ request scope còn thiếu; bắt lỗi code -201 khi user từ chối. */
  authorizeScopes$(
    scopes: AllScope[]
  ): Observable<Record<AllScope, boolean>> {
    return from(getSetting({})).pipe(
      switchMap((settings: GetSettingReturn) => {
        const authSetting = settings.authSetting as Partial<Record<AllScope, boolean>>;
        const toRequest = scopes.filter(scope => !authSetting[scope]);
        if (!toRequest.length) {
          return of(authSetting as Record<AllScope, boolean>);
        }
        return from(authorize({ scopes: toRequest as AllScope[] })).pipe(
          map((result) => ({ ...authSetting, ...result } as Record<AllScope, boolean>)),
          catchError((error: any) => {
            const code = error.code;
            if (code === -201) {
              console.warn('Người dùng đã từ chối cấp quyền cho', toRequest);
            } else {
              console.error('Lỗi khi yêu cầu cấp quyền', error);
            }
            return of(authSetting as Record<AllScope, boolean>);
          })
        );
      })
    );
  }

  authorizeAndFetchUser$(
    scopes: AllScope[]
  ): Observable<{
    perms: Record<AllScope, boolean>;
    userInfo: any | null;
  }> {
    return this.authorizeScopes$(scopes).pipe(
      switchMap(perms => {
        const allGranted = scopes.every(s => perms[s]);
        if (!allGranted) {
          return of({ perms, userInfo: null });
        }
        return from(getUserInfo()).pipe(
          map(res => ({
            perms,
            userInfo: res.userInfo
          })),
          catchError(err => {
            console.error('Lỗi getUserInfo()', err);
            return of({ perms, userInfo: null });
          })
        );
      })
    );
  }

  selectMethod$(config?: SelectPaymentConfig): Observable<SelectPaymentMethodResult> {
    const args = this.normalizeConfig(config);
    return from(Payment.selectPaymentMethod(args as any)).pipe(
      catchError(err => throwError(() => err))
    );
  }

  private normalizeConfig(config?: SelectPaymentConfig) {
    if (!config) return {};
    const args: any = {};
    if (config.channels?.length) {
      args.channels = config.channels.map(c => ({
        method: String(c.method),
        ...(c.subMethod ? { subMethod: String(c.subMethod) } : {}),
        ...(c.subInfo   ? { subInfo:   String(c.subInfo)   } : {}),
      }));
    }
    if (config.selectedMethod) {
      args.selectedMethod = {
        method: String(config.selectedMethod.method),
        ...(config.selectedMethod.subMethod ? { subMethod: String(config.selectedMethod.subMethod) } : {}),
      };
    }
    return args;
  }

  createShortcut$(params?: Record<string, string>) {
    return from(createShortcut()).pipe(
      tap(() => this.notify.success('Shortcut đã được tạo thành công!')),
      catchError(err => {
        this.notify.error('Đã xảy ra lỗi khi tạo shortcut. Vui lòng thử lại.');
        return throwError(() => err);
      })
    );
  }

  downloadImageToGallery$(imageUrl: string) {
    return from(
      saveImageToGallery({
        imageUrl,
      })
    ).pipe(
      tap(() => {
        this.notify.success("Tải ảnh thành công");
      }),
      catchError((error) => {
        this.notify.error("Lỗi tải về. Vui lòng thử lại.");
        return throwError(() => error);
      })
    );
  }

  shareZaloMiniApp$(params: ShareZaloMiniAppParams) {
    return from(
      openShareSheet({
        type: 'zmp',
        data: {
          title: params.title,
          description: params.description ?? '',
          thumbnail: params.thumbnail ?? '',
        },
      })
    ).pipe(
      tap(() => {
        this.notify.success('Chia sẻ Mini App thành công!');
      }),
      catchError((error) => {
        this.notify.error('Không thể chia sẻ. Vui lòng thử lại.');
        return throwError(() => error);
      })
    );
  }

  purchaseAndCheck$(params: {
    desc: string;
    amount: number;
    method: string;
  }): Observable<TxnResult> {
    return new Observable<TxnResult>((observer) => {

      try {
        CheckoutSDK.purchase({
          desc: params.desc,
          amount: params.amount,
          method: params.method,
          success: (data: any) => {

            CheckoutSDK.checkTransaction({ data })
              .then((result: TxnResult) => {
                observer.next(result);
                observer.complete();
              })
              .catch((err: any) => {
                observer.error(err);
              });
          },
          fail: (err: any) => {
            observer.next({
              resultCode: -1,
              msg: 'Thanh toán thất bại hoặc bị hủy',
            } as TxnResult);
            observer.complete();
          },
        });
      } catch (e) {
        observer.next({
          resultCode: -1,
          msg: 'Không thể mở màn hình thanh toán',
        } as TxnResult);
        observer.complete();
      }

      return () => {
        console.log('[purchaseAndCheck$] unsubscribe / teardown');
      };
    });
  }
}
