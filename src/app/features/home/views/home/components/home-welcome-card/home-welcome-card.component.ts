import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-home-welcome-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-welcome-card.component.html',
  styleUrls: ['./home-welcome-card.component.scss'],
})
export class HomeWelcomeCardComponent {
  @Input() welcomeTitle = 'Xin chào, bạn!';
  @Input() welcomeText = '';
}
