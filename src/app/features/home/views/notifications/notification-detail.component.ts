import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { finalize, takeUntil } from 'rxjs/operators';
import { openWebview } from 'zmp-sdk/apis';
import { AppCommonComponent } from '../../../../shared/components/app-common.service';
import { NotifyService } from '../../../../core/services';
import {
  IResNotificationDetail,
  MiniappApiService,
} from '../../../../shared/services/api/miniapp/miniapp-api.service';
import { NOTIFICATION_TYPE_META } from '../../../../shared/utils';

@Component({
  selector: 'app-notification-detail',
  templateUrl: './notification-detail.component.html',
  styleUrls: ['./notification-detail.component.scss'],
  standalone: false,
})
export class NotificationDetailComponent extends AppCommonComponent implements OnInit, OnDestroy {
  loading = false;
  item: IResNotificationDetail | null = null;
  safeContent: SafeHtml | null = null;

  constructor(
    private miniappApi: MiniappApiService,
    private notify: NotifyService,
    private sanitizer: DomSanitizer,
  ) {
    super();
  }

  ngOnInit(): void {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Chi tiết thông báo' });

    const id = Number(this.navService.getParam('id') ?? 0);
    if (!id) {
      this.notify.error('Thông báo không hợp lệ.');
      return;
    }

    this.loading = true;
    this.miniappApi.notificationDetail(id)
      .pipe(
        takeUntil(this.destroyed),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: (res) => {
          const data = res?.data ?? null;
          if (!data) {
            this.notify.error('Không tìm thấy thông báo.');
            return;
          }

          this.item = data;
          const html = (data.content ?? '').trim();
          this.safeContent = html ? this.sanitizer.bypassSecurityTrustHtml(html) : null;
        },
        // BE trả 404 kèm NOTIFICATION_NOT_ACTIVE khi thông báo vừa bị gỡ hiển thị — người dân mở
        // từ danh sách cũ vẫn có thể gặp, nên báo đúng nguyên nhân thay vì lỗi chung chung.
        error: (err) => {
          if (err?.errorCode === 'NOTIFICATION_NOT_ACTIVE') {
            this.notify.warning('Thông báo này đã ngưng hiển thị.');
            return;
          }
          this.notify.error('Không tải được chi tiết thông báo.');
        },
      });
  }

  ngOnDestroy(): void {
    this.getDestroySubs();
  }

  get typeLabel(): string {
    const type = this.item?.type ?? 'system';
    return NOTIFICATION_TYPE_META[type]?.label ?? NOTIFICATION_TYPE_META['system'].label;
  }

  get typeClass(): string {
    const type = this.item?.type ?? 'system';
    return NOTIFICATION_TYPE_META[type]?.cls ?? NOTIFICATION_TYPE_META['system'].cls;
  }

  get typeIcon(): string {
    const type = this.item?.type ?? 'system';
    return NOTIFICATION_TYPE_META[type]?.icon ?? NOTIFICATION_TYPE_META['system'].icon;
  }

  async openLink(url: string): Promise<void> {
    const isBrowser = typeof (window as any).ZaloMiniAppSDK === 'undefined';
    if (isBrowser) {
      window.open(url, '_blank');
      return;
    }

    try {
      await openWebview({ url, config: { style: 'normal' } });
    } catch {
      window.open(url, '_blank');
    }
  }
}
