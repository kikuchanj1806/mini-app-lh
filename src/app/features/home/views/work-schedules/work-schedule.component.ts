import { Component, OnDestroy, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs/operators';
import { AppCommonComponent } from '../../../../shared/components/app-common.service';
import { NotifyService } from '../../../../core/services';
import { WorkScheduleApiService } from '../../../../shared/services/api/work-schedules/work-schedule-api.service';
import { IResWorkScheduleGroup, WorkScheduleSession } from '../../../../shared/models/api';

const SESSION_LABEL: Record<WorkScheduleSession, string> = {
  morning: 'Sáng',
  afternoon: 'Chiều',
  full_day: 'Cả ngày',
};

@Component({
  selector: 'app-work-schedule',
  templateUrl: './work-schedule.component.html',
  styleUrls: ['./work-schedule.component.scss'],
  standalone: false,
})
export class WorkScheduleComponent extends AppCommonComponent implements OnInit, OnDestroy {
  groups: IResWorkScheduleGroup[] = [];
  loading = false;

  /** Thứ Hai của tuần đang xem — mốc duy nhất để suy ra khoảng ngày gửi lên BE. */
  private weekStart: Date = this.startOfWeek(new Date());

  constructor(
    private scheduleApi: WorkScheduleApiService,
    private notify: NotifyService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Lịch công tác' });
    this.load();
  }

  ngOnDestroy(): void {
    this.getDestroySubs();
  }

  load(): void {
    this.loading = true;

    this.scheduleApi.publicList({
      fromDate: this.ymd(this.weekStart),
      toDate: this.ymd(this.weekEnd),
    })
      .pipe(
        takeUntil(this.destroyed),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: (res) => (this.groups = res?.data ?? []),
        error: () => this.notify.error('Không tải được lịch công tác.'),
      });
  }

  shiftWeek(offset: number): void {
    const next = new Date(this.weekStart);
    next.setDate(next.getDate() + offset * 7);
    this.weekStart = next;
    this.load();
  }

  goToThisWeek(): void {
    this.weekStart = this.startOfWeek(new Date());
    this.load();
  }

  get weekEnd(): Date {
    const end = new Date(this.weekStart);
    end.setDate(end.getDate() + 6);
    return end;
  }

  get weekRangeLabel(): string {
    const fmt = (d: Date) => `${this.pad(d.getDate())}/${this.pad(d.getMonth() + 1)}`;
    return `${fmt(this.weekStart)} - ${fmt(this.weekEnd)}/${this.weekEnd.getFullYear()}`;
  }

  get isCurrentWeek(): boolean {
    return this.ymd(this.weekStart) === this.ymd(this.startOfWeek(new Date()));
  }

  sessionLabel(session: WorkScheduleSession): string {
    return SESSION_LABEL[session] ?? SESSION_LABEL.morning;
  }

  sessionClass(session: WorkScheduleSession): string {
    return `ws-session--${session.replace('_', '-')}`;
  }

  timeLabel(startTime: string | null, endTime: string | null): string {
    if (startTime && endTime) return `${this.hhmm(startTime)} - ${this.hhmm(endTime)}`;
    if (startTime) return this.hhmm(startTime);
    return '';
  }

  weekdayLabel(date: string): string {
    const parsed = this.parseYmd(date);
    if (!parsed) return '';
    return new Intl.DateTimeFormat('vi-VN', { weekday: 'long' }).format(parsed);
  }

  dayLabel(date: string): string {
    const parsed = this.parseYmd(date);
    if (!parsed) return date;
    return `${this.pad(parsed.getDate())}/${this.pad(parsed.getMonth() + 1)}`;
  }

  isToday(date: string): boolean {
    return date === this.ymd(new Date());
  }

  /**
   * Thứ Hai đầu tuần. `getDay()` trả 0 cho Chủ nhật — phải quy về 7 để Chủ nhật thuộc tuần
   * đang chạy chứ không nhảy sang tuần sau.
   */
  private startOfWeek(d: Date): Date {
    const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const isoDay = date.getDay() === 0 ? 7 : date.getDay();
    date.setDate(date.getDate() - (isoDay - 1));
    return date;
  }

  private parseYmd(value: string): Date | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  private ymd(d: Date): string {
    return `${d.getFullYear()}-${this.pad(d.getMonth() + 1)}-${this.pad(d.getDate())}`;
  }

  private hhmm(value: string): string {
    return String(value).slice(0, 5);
  }

  private pad(n: number): string {
    return String(n).padStart(2, '0');
  }
}
