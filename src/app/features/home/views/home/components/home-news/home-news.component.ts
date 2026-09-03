import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IResPostListItem} from '../../../../../../shared/models/api';

@Component({
  selector: 'app-home-news',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-news.component.html',
  styleUrls: ['./home-news.component.scss'],
})
export class HomeNewsComponent {
  @Input() sectionTitle = 'Tin tức nổi bật';
  @Input() items: IResPostListItem[] = [];
  @Input() loading = false;

  @Output() viewAll = new EventEmitter<void>();
  @Output() itemClick = new EventEmitter<IResPostListItem>();

  /** Số hàng skeleton khi chờ API — giữ đúng chiều cao khối tin để trang không nhảy chỗ. */
  readonly newsSkeletonRows = [1, 2, 3];

  /** Tin đầu tiên hiển thị dạng thẻ lớn (ảnh trên), các tin còn lại dạng hàng ngang. */
  get newsFeatured(): IResPostListItem | null {
    return this.items[0] ?? null;
  }

  get newsRest(): IResPostListItem[] {
    return this.items.slice(1);
  }

  trackByNewsId = (_: number, it: IResPostListItem) => it.id;

  newsThumb(it: IResPostListItem): string {
    return it.thumbnailUrl || '/assets/img/tin_tuc_img_default.jpg';
  }

  onNewsImgError(ev: Event): void {
    (ev.target as HTMLImageElement).src = '/assets/img/tin_tuc_img_default.jpg';
  }
}
