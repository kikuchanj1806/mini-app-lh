import { Component, OnDestroy, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs/operators';
import { AppCommonComponent } from '../../../../shared/components/app-common.service';
import { NotifyService } from '../../../../core/services';
import {
  IResNotificationItem,
  MiniappApiService,
} from '../../../../shared/services/api/miniapp/miniapp-api.service';
import { NOTIFICATION_TYPE_META } from '../../../../shared/utils';

@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.scss'],
  standalone: false,
})
export class NotificationListComponent extends AppCommonComponent implements OnInit, OnDestroy {
  items: IResNotificationItem[] = [];
  loading = false;

  /** Phân trang kiểu "tải thêm" — hợp với thao tác cuộn trên điện thoại hơn là số trang. */
  page = 1;
  readonly pageSize = 20;
  totalItems = 0;
  loadingMore = false;

  constructor(
    private miniappApi: MiniappApiService,
    private notify: NotifyService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Thông báo' });
    this.load();
  }

  ngOnDestroy(): void {
    this.getDestroySubs();
  }

  load(): void {
    this.loading = true;
    this.page = 1;

    this.miniappApi.notifications({ page: this.page, pageSize: this.pageSize })
      .pipe(
        takeUntil(this.destroyed),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: (res) => {
          this.items = res?.data?.result ?? [];
          this.totalItems = res?.data?.totalItems ?? this.items.length;
        },
        error: () => this.notify.error('Không tải được danh sách thông báo.'),
      });
  }

  loadMore(): void {
    if (this.loadingMore || !this.hasMore) return;

    this.loadingMore = true;
    const nextPage = this.page + 1;

    this.miniappApi.notifications({ page: nextPage, pageSize: this.pageSize })
      .pipe(
        takeUntil(this.destroyed),
        finalize(() => (this.loadingMore = false)),
      )
      .subscribe({
        next: (res) => {
          this.items = [...this.items, ...(res?.data?.result ?? [])];
          this.totalItems = res?.data?.totalItems ?? this.totalItems;
          this.page = nextPage;
        },
        error: () => this.notify.error('Không tải thêm được thông báo.'),
      });
  }

  get hasMore(): boolean {
    return this.items.length < this.totalItems;
  }

  typeIcon(type: string): string {
    return NOTIFICATION_TYPE_META[type]?.icon ?? NOTIFICATION_TYPE_META['system'].icon;
  }

  typeClass(type: string): string {
    return NOTIFICATION_TYPE_META[type]?.cls ?? NOTIFICATION_TYPE_META['system'].cls;
  }

  typeLabel(type: string): string {
    return NOTIFICATION_TYPE_META[type]?.label ?? NOTIFICATION_TYPE_META['system'].label;
  }
}
