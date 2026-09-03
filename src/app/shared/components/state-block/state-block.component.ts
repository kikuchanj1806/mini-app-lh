import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';

export type AppStateKind = 'loading' | 'error' | 'empty';

@Component({
  selector: 'app-state-block',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="state" [class.state--error]="state === 'error'">
      <span class="state__icon"><i [class]="iconClass"></i></span>
      <div class="state__text">{{ text }}</div>
      @if (desc) {
        <p class="state__desc">{{ desc }}</p>
      }
      @if (actionLabel) {
        <button type="button" class="state__action" [disabled]="actionDisabled" (click)="action.emit()">
          {{ actionLabel }}
        </button>
      }
    </div>
  `,
  styleUrls: ['./state-block.component.scss'],
})
export class StateBlockComponent {
  @Input() state: AppStateKind = 'loading';
  @Input() text = '';
  @Input() desc = '';
  @Input() icon = '';
  @Input() actionLabel = '';
  @Input() actionDisabled = false;
  @Output() action = new EventEmitter<void>();

  get iconClass(): string {
    if (this.icon) return this.icon;
    if (this.state === 'error') return 'fal fa-triangle-exclamation';
    if (this.state === 'empty') return 'fal fa-inbox';
    return 'fal fa-spinner fa-spin';
  }
}
