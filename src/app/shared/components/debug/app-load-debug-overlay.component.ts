import {ChangeDetectionStrategy, Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {appLoadMarks$, disablePerfDebug, LoadMark, perfDebugEnabled} from '../../../core/utils/app-load-timer.util';

/**
 * Overlay đo thời gian load app, hiện trực tiếp trên màn hình — dùng khi test trên môi trường
 * Zalo thật (không gắn được devtools). Chỉ hiện khi `perfDebugEnabled` (xem
 * `app-load-timer.util.ts` — bật qua `?perfdebug=1` trên URL mở mini app).
 */
@Component({
  selector: 'app-load-debug-overlay',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="perf-overlay" *ngIf="enabled">
      <ng-container *ngIf="(marks$ | async) as marks">
        <button type="button" class="perf-toggle" *ngIf="marks.length" (click)="expanded = !expanded">
          ⏱ {{ totalMs(marks) }}ms
        </button>
        <div class="perf-panel" *ngIf="expanded">
          <div class="perf-header">
            <span>App load timeline</span>
            <button type="button" class="perf-off" (click)="turnOff()">Tắt</button>
          </div>
          <div class="perf-row" *ngFor="let m of marks; let i = index">
            <span class="perf-name">{{ m.name }}</span>
            <span class="perf-delta">+{{ delta(marks, i) }}</span>
            <span class="perf-total">{{ m.t | number: '1.0-0' }}</span>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .perf-overlay {
      position: fixed;
      right: 8px;
      bottom: 96px;
      z-index: 999997;
      font-family: ui-monospace, Menlo, monospace;
    }
    .perf-toggle {
      border: 0;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 12px;
      background: rgba(17, 24, 39, .85);
      color: #22d3ee;
      box-shadow: 0 4px 14px rgba(0, 0, 0, .25);
    }
    .perf-panel {
      margin-top: 6px;
      max-height: 50vh;
      overflow-y: auto;
      width: 78vw;
      max-width: 340px;
      background: rgba(17, 24, 39, .92);
      color: #e5e7eb;
      border-radius: 10px;
      padding: 8px 10px;
      font-size: 11px;
      line-height: 1.6;
    }
    .perf-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #9ca3af;
      margin-bottom: 4px;
      border-bottom: 1px solid rgba(255, 255, 255, .12);
      padding-bottom: 4px;
    }
    .perf-off {
      border: 0;
      background: transparent;
      color: #f87171;
      font-size: 11px;
      padding: 0;
    }
    .perf-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      white-space: nowrap;
    }
    .perf-name {
      overflow: hidden;
      text-overflow: ellipsis;
      color: #93c5fd;
    }
    .perf-delta {
      color: #fbbf24;
    }
    .perf-total {
      color: #6b7280;
    }
  `],
})
export class AppLoadDebugOverlayComponent {
  readonly enabled = perfDebugEnabled;
  readonly marks$ = appLoadMarks$;
  expanded = false;

  totalMs(marks: LoadMark[]): number {
    return marks.length ? Math.round(marks[marks.length - 1].t) : 0;
  }

  delta(marks: LoadMark[], i: number): number {
    return Math.round(i === 0 ? marks[0].t : marks[i].t - marks[i - 1].t);
  }

  turnOff(): void {
    disablePerfDebug();
    this.expanded = false;
  }
}
