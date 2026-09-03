import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-home-follow-oa',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-follow-oa.component.html',
  styleUrls: ['./home-follow-oa.component.scss'],
})
export class HomeFollowOaComponent {
  @Input() hasFollowed = false;
  @Input() isFollowingOA = false;
  @Input() followOaIconUrl = '';
  @Input() oaDisplayName = 'Chính quyền số';

  @Output() follow = new EventEmitter<void>();
}
