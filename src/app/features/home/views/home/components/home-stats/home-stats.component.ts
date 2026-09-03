import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IHomeContentStats} from '../../../../../../shared/models/api';

@Component({
  selector: 'app-home-stats',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-stats.component.html',
  styleUrls: ['./home-stats.component.scss'],
})
export class HomeStatsComponent {
  @Input() stats: IHomeContentStats | null = null;
}
