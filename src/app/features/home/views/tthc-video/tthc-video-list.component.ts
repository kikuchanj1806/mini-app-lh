import { Component, OnDestroy, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { takeUntil } from 'rxjs';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {
  IResTthcVideoItem,
  TthcVideoListItemVM,
  UserApiService
} from '../../../../shared/services/api/user/user-api.service';
import {NotifyService} from '../../../../core/services';
import {environment} from '../../../../../environments';
import {Router} from '@angular/router';
import {TthcVideoApiService} from '../../../../shared/services/api/tthc-video/tthc-video-api.service';

@Component({
  selector: 'app-tthc-video-list',
  templateUrl: './tthc-video-list.component.html',
  styleUrls: ['./tthc-video-list.component.scss'],
  standalone: false,
})
export class TthcVideoListComponent extends AppCommonComponent implements OnInit, OnDestroy {
  items: TthcVideoListItemVM[] = [];
  loading = false;

  constructor(
    private api: TthcVideoApiService,
    private notify: NotifyService,
    private router: Router
  ) {
    super();
  }

  ngOnInit(): void {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Video hướng dẫn TTHC' });
    this.load();
  }

  load(): void {
    const wardId = Number(environment.wardId || 0);
    if (!wardId) return;

    this.loading = true;

    const params: any = {
      ward_id: wardId,
      page: 1,
      perPage: 20,
    };

    this.api.listPublic(params)
      .pipe(
        takeUntil(this.destroyed),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (res: any) => {
          const arr = (res?.data ?? []) as IResTthcVideoItem[];

          const sorted = [...arr].sort((a, b) => {
            const ta = Number(a.published_at ?? a.created_at ?? 0);
            const tb = Number(b.published_at ?? b.created_at ?? 0);
            return tb - ta;
          });

          this.items = sorted.map((x) => ({
            id: x.id,
            title: x.title ?? '',
            subtitle: (x.excerpt ?? '').trim() || 'Video hướng dẫn chi tiết các bước thực hiện.',
            thumbnail: x.thumbnail ?? null,
            publishedMs: this.toMs(x.published_at ?? x.created_at),
            raw: x,
          }));
        },
        error: () => this.notify.error('Không tải được danh sách video hướng dẫn.'),
      });
  }

  onOpen(it: TthcVideoListItemVM): void {
    const url = it.raw?.video_url ? String(it.raw.video_url) : '';
    if (!url) {
      this.notify.warning('Video chưa có đường dẫn.');
      return;
    }

    // mở inline bằng màn player
    this.router.navigate(['/tthc/videos/player'], {
      queryParams: {
        title: it.title,
        url,
      }
    });
  }

  imgSrc(it: TthcVideoListItemVM): string {
    return it.thumbnail || '/assets/img/placeholder/video-thumb.png';
  }

  fallbackImg(ev: Event): void {
    (ev.target as HTMLImageElement).src = '/assets/img/placeholder/video-thumb.png';
  }

  trackById = (_: number, it: TthcVideoListItemVM) => it.id;

  private toMs(ts: unknown): number | null {
    if (ts === null || ts === undefined) return null;
    const n = typeof ts === 'number' ? ts : Number(ts);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n * 1000;
  }

  ngOnDestroy(): void {
    this.getDestroySubs();
  }
}
