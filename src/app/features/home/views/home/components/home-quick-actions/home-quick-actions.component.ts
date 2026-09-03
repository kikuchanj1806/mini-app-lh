import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HomeAction} from '../../models/home.types';

@Component({
  selector: 'app-home-quick-actions',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-quick-actions.component.html',
  styleUrls: ['./home-quick-actions.component.scss'],
})
export class HomeQuickActionsComponent {
  @Input() items: HomeAction[] = [];
  @Input() loading = false;
  @Output() itemClick = new EventEmitter<HomeAction>();
}
