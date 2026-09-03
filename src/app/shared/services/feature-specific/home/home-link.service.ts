import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {openPhone, openWebview} from 'zmp-sdk/apis';
import {NotifyService} from '../../../../core/services';
import {IResMenuItemActive} from '../../api/menu-items/menu-item-api.service';

export interface LinkTarget {
  linkType: IResMenuItemActive['linkType'];
  link?: string | null;
}

@Injectable({providedIn: 'root'})
export class HomeLinkService {
  constructor(
    private router: Router,
    private notify: NotifyService,
  ) {}

  /**
   * Điều hướng theo `linkType` mà BE đã resolve sẵn (`menu-items/active`).
   *
   * FE không tự suy diễn lại từ `actionType`: `post_category`/`post_detail` đã được BE đổi thành
   * route `/news?categoryId=N` và `/news/N` — nhân bản logic đó ở đây là mời lệch về sau.
   */
  async openByLinkType(it: LinkTarget): Promise<void> {
    switch (it.linkType) {
      case 'route':
        if (it.link) this.router.navigateByUrl(it.link);
        return;
      case 'url':
        if (it.link) window.open(it.link, '_blank');
        return;
      case 'webview':
        if (it.link) await this.openExternalUrl(it.link);
        return;
      case 'phone':
        if (it.link) this.callNow(it.link);
        return;
      default:
        this.notify.info('Tính năng đang được cập nhật.');
        return;
    }
  }

  async openExternalUrl(url: string): Promise<void> {
    const isBrowser = typeof (window as any).ZaloMiniAppSDK === 'undefined';
    if (isBrowser) {
      window.open(url, '_blank');
      return;
    }

    try {
      await openWebview({
        url,
        config: {
          style: 'normal',
        },
      });
    } catch (e) {
      window.open(url, '_blank');
    }
  }

  callNow(phone: string): void {
    const phoneNumber = phone.replace(/\./g, '').trim();
    openPhone({phoneNumber}).catch(() => {
    });
  }
}
