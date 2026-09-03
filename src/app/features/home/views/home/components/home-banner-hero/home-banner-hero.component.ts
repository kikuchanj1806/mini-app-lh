import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {UniversalSlideComponent} from '../../../../../../shared/components/actions';
import {IResBannerT} from '../../../../../../shared/models/api';

@Component({
  selector: 'app-home-banner-hero',
  standalone: true,
  imports: [CommonModule, UniversalSlideComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-banner-hero.component.html',
  styleUrls: ['./home-banner-hero.component.scss'],
})
export class HomeBannerHeroComponent {
  @Input() slides: IResBannerT[] = [];
  @Output() openBanner = new EventEmitter<string | null | undefined>();
}
