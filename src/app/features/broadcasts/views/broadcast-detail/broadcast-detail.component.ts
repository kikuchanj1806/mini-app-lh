import {Component, OnDestroy, OnInit, inject} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {finalize, takeUntil} from 'rxjs/operators';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {BroadcastApiService, IPublicBroadcastDetail} from '../../../../shared/services/api';

interface IBroadcastDetailView {
  id: number;
  title: string;
  summary: string;
  content?: string | null;
  category: string;
  channel: string;
  audioUrl?: string | null;
  date: string;
  duration: string;
  isUrgent: boolean;
}

@Component({
  selector: 'app-broadcast-detail',
  templateUrl: './broadcast-detail.component.html',
  styleUrls: ['./broadcast-detail.component.scss'],
  standalone: false,
})
export class BroadcastDetailComponent extends AppCommonComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly broadcastApi = inject(BroadcastApiService);

  item?: IBroadcastDetailView;
  isLoading = false;

  ngOnInit() {
    this.setHeader({variant: 'title', title: 'Chi tiết bản tin', back: true, className: 'header-light'});
    this.setFooter({variant: 'tabs', show: false});

    const idOrSlug = this.route.snapshot.paramMap.get('id');
    if (!idOrSlug) {
      this.notifyService.warning('Không tìm thấy bản tin');
      return;
    }

    this.loadDetail(decodeURIComponent(idOrSlug));
  }

  ngOnDestroy() {
    this.getDestroySubs();
  }

  private loadDetail(idOrSlug: string) {
    this.isLoading = true;

    this.broadcastApi.detail(idOrSlug)
      .pipe(
        finalize(() => (this.isLoading = false)),
        takeUntil(this.destroyed)
      )
      .subscribe({
        next: res => {
          if (res.code !== 1 || !res.data) {
            this.item = undefined;
            this.notifyService.warning(this.getResponseMessage(res.messages, 'Không tìm thấy bản tin'));
            return;
          }

          this.item = this.mapItem(res.data);
        },
        error: err => {
          this.item = undefined;
          this.notifyService.error(this.getHttpErrorMessage(err, 'Không kết nối được máy chủ truyền thanh'));
        },
      });
  }

  private mapItem(item: IPublicBroadcastDetail): IBroadcastDetailView {
    return {
      id: item.id,
      title: item.title,
      summary: item.summary || '',
      content: item.content,
      category: item.category || 'Bản tin',
      channel: item.channel?.name || 'Truyền thanh',
      audioUrl: item.audioUrl,
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
