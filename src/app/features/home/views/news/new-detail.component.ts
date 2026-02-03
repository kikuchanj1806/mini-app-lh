import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize, takeUntil } from 'rxjs/operators';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {NotifyService} from '../../../../core/services';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {IResNewsItem, NewApiService} from '../../../../shared/services/api/news/new-api.service';

@Component({
  selector: 'app-new-detail',
  templateUrl: './new-detail.component.html',
  styleUrls: ['./new-detail.component.scss'],
  standalone: false
})
export class NewDetailComponent extends AppCommonComponent implements OnInit, OnDestroy {
  loading = false;
  item: IResNewsItem | null = null;
  safeContent: SafeHtml | null = null;

  constructor(
    private notify: NotifyService,
    private newsApi: NewApiService,
    private sanitizer: DomSanitizer
  ) {
    super();
  }

  ngOnInit() {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Tin tức' });
    const id = Number(this.navService.getParam('id') ?? 0);
    if (!id) {
      this.notify.error('Tin tức không hợp lệ.');
      return;
    }

    this.loadDetail(id);
  }

  ngOnDestroy() {
    document.body.classList.remove('page-book-appointment');
    this.getDestroySubs();
  }

  private loadDetail(id: number) {
    this.loading = true;
    this.item = null;
    this.safeContent = null;

    this.newsApi.newsDetail(id)
      .pipe(
        takeUntil(this.destroyed),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (res) => {
          const d = res?.data ?? null;
          if (!d) {
            this.notify.error('Không tìm thấy tin tức.');
            return;
          }

          const pub = Number(d.published_at ?? 0);
          this.item = { ...d, published_at: pub };

          const html = (d.content ?? '').trim();
          this.safeContent = html ? this.sanitizer.bypassSecurityTrustHtml(html) : null;
        },
        error: () => this.notify.error('Không tải được chi tiết tin tức.'),
      });
  }

  /** unix seconds -> ms (để dùng với date pipe) */
  toMs(ts: number | string | null | undefined): number | null {
    if (ts == null) return null;
    const n = typeof ts === 'number' ? ts : Number(ts);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n * 1000;
  }

  fallbackImg(ev: Event) {
    const img = ev.target as HTMLImageElement;
    img.src = '/assets/img/placeholder/news-thumb.png';
  }
}
