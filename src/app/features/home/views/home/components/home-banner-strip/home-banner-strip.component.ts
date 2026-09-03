import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {UniversalSlideComponent} from '../../../../../../shared/components/actions';
import {IResBannerT} from '../../../../../../shared/models/api';

/** Dùng chung cho 2 khối "Sự kiện & thông báo" và "Đối tác & dịch vụ" — chỉ khác tiêu đề. */
@Component({
  selector: 'app-home-banner-strip',
  standalone: true,
  imports: [CommonModule, UniversalSlideComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-banner-strip.component.html',
  styleUrls: ['./home-banner-strip.component.scss'],
})
export class HomeBannerStripComponent {
  @Input() title = '';
  @Input() banners: IResBannerT[] = [];
  @Output() openBanner = new EventEmitter<string | null | undefined>();
}
