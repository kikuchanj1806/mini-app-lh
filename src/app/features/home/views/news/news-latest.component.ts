import { Component, OnDestroy, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs/operators';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {NotifyService} from '../../../../core/services';
import {IPostCategoryMenuItem, IResPostListItem} from '../../../../shared/models/api';
import {NewsCacheService} from '../../../../shared/services/feature-specific/home/news-cache.service';

export type NewsListItemVM = {
  id: number;
  title: string;
  thumbnail: string | null;
  publishedMs: number | null;
  categoryName: string;
  liked: boolean;
  raw: IResPostListItem;
};

@Component({
  selector: 'app-news-latest',
  templateUrl: './news-latest.component.html',
  styleUrls: ['./news-latest.component.scss'],
  standalone: false
})
export class NewsLatestComponent extends AppCommonComponent implements OnInit, OnDestroy {
  items: NewsListItemVM[] = [];
  categories: IPostCategoryMenuItem[] = [];
  selectedCategoryId: number | null = null;
  loading = false;

  constructor(
    private newsCache: NewsCacheService,
    private notify: NotifyService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Tin tức mới nhất' });
    this.selectedCategoryId = this.readCategoryId();
    this.loadCategories();
    this.load();
  }

  load() {
    this.loading = true;

    this.newsCache.publicListOnce$({
      categoryId: this.selectedCategoryId ?? undefined,
      includeChildren: true,
      page: 1,
      pageSize: 20,
    })
      .pipe(
        takeUntil(this.destroyed),
        finalize(() => (this.loading = false))
      )
      .subscribe((res) => {
        if (!res) {
          this.notify.error('Không tải được danh sách tin tức.');
          this.items = [];
          return;
        }

        const arr = res.result ?? [];
        this.items = arr.map((x) => ({
          id: x.id,
          title: x.title,
          thumbnail: x.thumbnailUrl ?? null,
          publishedMs: this.toMs(x.publishedAt),
          categoryName: x.category?.name ?? 'Tin tức',
          liked: false,
          raw: x,
        }));
      });
  }

  onCategoryTap(categoryId: number | null): void {
    this.selectedCategoryId = categoryId;
    this.load();
  }

  toggleLike(it: NewsListItemVM, ev: Event) {
    ev.stopPropagation();
    it.liked = !it.liked;
  }

  private toMs(ts: unknown): number | null {
    if (ts === null || ts === undefined) return null;
    const n = typeof ts === 'number' ? ts : Number(ts);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
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

  private loadCategories(): void {
    this.newsCache.categoryMenuOnce$()
      .pipe(takeUntil(this.destroyed))
      .subscribe((categories) => this.categories = categories);
  }

  private readCategoryId(): number | null {
    const raw = this.navService.getParam('categoryId');
    const n = raw == null ? NaN : Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
}
