import {Component, OnDestroy, OnInit, inject} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {finalize, takeUntil} from 'rxjs/operators';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {uriFeConst} from '../../../../shared/constants';
import {
  BroadcastApiService,
  IPublicBroadcastChannel,
  IPublicBroadcastItem
} from '../../../../shared/services/api';

interface IBroadcastViewItem {
  id: number;
  slug?: string | null;
  title: string;
  summary: string;
  category: string;
  channel: string;
  channelSlug?: string | null;
  audioUrl?: string | null;
  date: string;
  duration: string;
  isUrgent: boolean;
}

@Component({
  selector: 'app-broadcast-list',
  templateUrl: './broadcast-list.component.html',
  styleUrls: ['./broadcast-list.component.scss'],
  standalone: false,
})
export class BroadcastListComponent extends AppCommonComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly broadcastApi = inject(BroadcastApiService);

  channels: IPublicBroadcastChannel[] = [];
  selectedChannelSlug: string | null = null;
  items: IBroadcastViewItem[] = [];
  isLoading = false;

  get selectedChannelName(): string {
    return this.channels.find(c => c.slug === this.selectedChannelSlug)?.name || 'Tất cả kênh';
  }

  ngOnInit() {
    this.setHeader({variant: 'title', title: 'Truyền thanh thông minh', back: true});
    this.setFooter({variant: 'tabs'});

    this.selectedChannelSlug = this.route.snapshot.queryParamMap.get('channel');
    this.loadChannels();
    this.loadItems();
  }

  ngOnDestroy() {
    this.getDestroySubs();
  }

  selectChannel(channelSlug: string | null) {
    if (this.selectedChannelSlug === channelSlug) return;

    this.selectedChannelSlug = channelSlug;
    this.loadItems();
  }

  openDetail(item: IBroadcastViewItem) {
    this.navService.redirectByUrl(uriFeConst.broadcasts.detail(encodeURIComponent(item.slug || String(item.id))));
  }

  private loadChannels() {
    this.broadcastApi.channels()
      .pipe(takeUntil(this.destroyed))
      .subscribe({
        next: res => {
          if (res.code === 1 && Array.isArray(res.data)) {
            this.channels = res.data;
          }
        },
      });
  }

  private loadItems() {
    this.isLoading = true;

    this.broadcastApi.list({
      page: 1,
      pageSize: 20,
      ...(this.selectedChannelSlug ? {channelSlug: this.selectedChannelSlug} : {}),
    })
      .pipe(
        finalize(() => (this.isLoading = false)),
        takeUntil(this.destroyed)
      )
      .subscribe({
        next: res => {
          if (res.code !== 1) {
            this.items = [];
            this.notifyService.warning(this.getResponseMessage(res.messages, 'Không tải được bản tin truyền thanh'));
            return;
          }

          this.items = (res.data?.result ?? []).map(item => this.mapItem(item));
        },
        error: err => {
          this.items = [];
          this.notifyService.error(this.getHttpErrorMessage(err, 'Không kết nối được máy chủ truyền thanh'));
        },
      });
  }

  private mapItem(item: IPublicBroadcastItem): IBroadcastViewItem {
    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      summary: item.summary || '',
      category: item.category || 'Bản tin',
      channel: item.channel?.name || 'Truyền thanh',
      channelSlug: item.channel?.slug,
      audioUrl: item.audioUrl || undefined,
      date: this.formatDateTime(item.publishedAt || item.scheduledAt || item.createdAt),
      duration: this.formatDuration(item.durationSeconds),
      isUrgent: !!item.isUrgent,
    };
  }

  private formatDateTime(value?: string | number | null): string {
    if (!value) return '';

    const date = new Date(typeof value === 'number' ? value : String(value));
    if (Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private formatDuration(seconds?: number | null): string {
    if (!seconds) return '';

    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes}:${String(rest).padStart(2, '0')}`;
  }

  private getResponseMessage(messages: unknown, fallback: string): string {
    if (Array.isArray(messages)) return messages.join(', ') || fallback;
    if (typeof messages === 'string') return messages || fallback;
    return fallback;
  }

  private getHttpErrorMessage(error: unknown, fallback: string): string {
    const apiError = error as {error?: {messages?: unknown}};
    return this.getResponseMessage(apiError.error?.messages, fallback);
  }
}
