import { Component, OnDestroy, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs/operators';
import {IResNewsItem, NewApiService} from '../../../../shared/services/api/news/new-api.service';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {NotifyService} from '../../../../core/services';
import {environment} from '../../../../../environments';

export type NewsListItemVM = {
  id: number;
  title: string;
  thumbnail: string | null;
  publishedMs: number | null;
  categoryName: string;
  liked: boolean;
  raw: IResNewsItem;
};

@Component({
  selector: 'app-news-latest',
  templateUrl: './news-latest.component.html',
  styleUrls: ['./news-latest.component.scss'],
  standalone: false
})
export class NewsLatestComponent extends AppCommonComponent implements OnInit, OnDestroy {
  items: NewsListItemVM[] = [];
  loading = false;

  constructor(
    private newsApi: NewApiService,
    private notify: NotifyService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Tin tức mới nhất' });
    this.load();
  }

  load() {
    const wardId = Number(environment.wardId);

    this.loading = true;
    this.newsApi.newsList({
      ward_id: wardId,
      page: 1,
      perPage: 10,
    })
      .pipe(
        takeUntil(this.destroyed),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (res) => {
          const arr = (res?.data ?? []) as IResNewsItem[];

          const sorted = [...arr].sort((a, b) => (b.published_at ?? 0) - (a.published_at ?? 0));

          this.items = sorted.map((x) => ({
            id: x.id,
            title: x.title,
            thumbnail: x.thumbnail ?? null,
            publishedMs: this.toMs(x.published_at),
            categoryName: x.category?.name ?? 'Tin tức',
            liked: false,
            raw: x,
          }));
        },
        error: () => this.notify.error('Không tải được danh sách tin tức.'),
      });
  }

  toggleLike(it: NewsListItemVM, ev: Event) {
    ev.stopPropagation();
    it.liked = !it.liked;
  }

  private toMs(ts: unknown): number | null {
    if (ts === null || ts === undefined) return null;
    const n = typeof ts === 'number' ? ts : Number(ts);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n * 1000;
  }

  imgSrc(it: NewsListItemVM): string {
    return it.thumbnail || '/assets/img/placeholder/news-thumb.png';
  }

  fallbackImg(ev: Event) {
    (ev.target as HTMLImageElement).src = '/assets/img/placeholder/news-thumb.png';
  }

  ngOnDestroy(): void {
    this.getDestroySubs();
  }
}
