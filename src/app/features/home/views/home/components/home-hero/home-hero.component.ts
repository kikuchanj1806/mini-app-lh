import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-home-hero',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-hero.component.html',
  styleUrls: ['./home-hero.component.scss'],
})
export class HomeHeroComponent {
  @Input() heroEyebrow = '';
  @Input() heroTitle = '';
  @Input() heroSubtitle = '';
  @Input() hotline = '';
  @Input() showWeather = false;
  @Input() weatherIconClass = 'wx-cloud';
  @Input() temperatureText = '25.6°C';
  @Input() weatherText = 'Mây rải rác';
  @Input() locationLabel = '';

  @Output() callHotline = new EventEmitter<void>();
  @Output() notificationTap = new EventEmitter<void>();
}
