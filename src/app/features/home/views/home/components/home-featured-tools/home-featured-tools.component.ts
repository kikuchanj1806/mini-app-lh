import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HomeFeature} from '../../models/home.types';

@Component({
  selector: 'app-home-featured-tools',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-featured-tools.component.html',
  styleUrls: ['./home-featured-tools.component.scss'],
})
export class HomeFeaturedToolsComponent {
  @Input() items: HomeFeature[] = [];
  @Input() loading = false;
  @Output() itemClick = new EventEmitter<HomeFeature>();

  readonly skeletonSlots = [1, 2, 3, 4, 5, 6, 7, 8];
}
