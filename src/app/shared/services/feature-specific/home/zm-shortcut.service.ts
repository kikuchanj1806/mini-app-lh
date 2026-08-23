import { Injectable } from '@angular/core';
import { createShortcut, getSystemInfo } from 'zmp-sdk/apis';

export type ShortcutParams = Record<string, string>;

export interface CreateShortcutSafeOptions {
  params?: ShortcutParams;
  devBypass?: boolean;

  appId: string;
  appName: string;
  appIcon: string;
  iosShortcutBaseUrl?: string;
}

export interface ShortcutResult {
  ok: boolean;
  message?: string;
  bypass?: boolean;

  url?: string;

  platform?: 'android' | 'ios' | 'unknown';
  error?: any;
}

@Injectable({ providedIn: 'root' })
export class ZmaShortcutService {
  private readonly IOS_BASE = 'https://miniapp.zaloplatforms.com/shortcut.html';

  private async detectPlatform(): Promise<'android' | 'ios' | 'unknown'> {
    try {
      const sys: any = await getSystemInfo();
      const p = String(sys?.platform || '').toLowerCase();
      if (p.includes('android')) return 'android';
      if (p.includes('ios')) return 'ios';
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private buildIosShortcutUrl(opts: CreateShortcutSafeOptions): string {
    const base = opts.iosShortcutBaseUrl || this.IOS_BASE;
    const url = new URL(base);

    url.searchParams.set('utm_source', 'shortcut');
    url.searchParams.set('utm_source', 'zalo-shortcut');
    url.searchParams.set('utm_medium', 'default');
    url.searchParams.set('utm_campaign', 'default');

    url.searchParams.set('appId', opts.appId);
    url.searchParams.set('appName', opts.appName);
    url.searchParams.set('appIcon', opts.appIcon);

    const params = opts.params || {};
    Object.keys(params).forEach((k) => {
      url.searchParams.set(k, params[k]);
    });

    return url.toString();
  }

  /**
   * Android: gọi createShortcut
   * iOS: trả về url để mở ra browser (shortcut.html)
   */
  async createShortcutSafe(opts: CreateShortcutSafeOptions): Promise<ShortcutResult> {
    if (opts.devBypass) {
      return { ok: true, bypass: true, message: 'DEV bypass', platform: 'unknown' };
    }

    const platform = await this.detectPlatform();

    // if (platform === 'ios') {
      const url = this.buildIosShortcutUrl(opts);
      return {
        ok: true,
        platform,
        url,
        message: 'iOS: mở link shortcut trên trình duyệt để tạo phím tắt.',
      };
    // }

    // if (platform === 'android') {
    //   try {
    //     await createShortcut({ params: opts.params || {} });
    //     return { ok: true, platform };
    //   } catch (e: any) {
    //     const code = e?.code;
    //     const msg = e?.message || 'Không thể tạo phím tắt.';
    //     return { ok: false, platform, message: `[${code ?? 'ERR'}] ${msg}`, error: e };
    //   }
    // }
    //
    // const url = this.buildIosShortcutUrl(opts);
    // return {
    //   ok: true,
    //   platform: 'unknown',
    //   url,
    //   message: 'Không xác định platform: fallback mở link shortcut.',
    // };
  }
}
