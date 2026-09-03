import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IResBanner} from '../../../../../../shared/models/api';

@Component({
  selector: 'app-home-banner-mid',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-banner-mid.component.html',
  styleUrls: ['./home-banner-mid.component.scss'],
})
export class HomeBannerMidComponent {
  @Input() banner: IResBanner | null = null;
  @Output() openBanner = new EventEmitter<string | null | undefined>();

  get imgUrl(): string {
    return (this.banner?.imageUrl || '').trim();
  }
}
