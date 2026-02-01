import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {catchError, map, switchMap} from 'rxjs/operators';
import {ActivatedRoute, Router} from '@angular/router';
import {ZmaTicketApiService} from '../../../../shared/services/api/ticket/ticket-api.service';
import {UserManageService} from '../../../../shared/services/feature-specific/user/user-manage.service';
import {NotifyService} from '../../../../core/services';
import {environment} from '../../../../../environments';
import {finalize, of, takeUntil, tap} from 'rxjs';

@Component({
  selector: 'app-ticket-detail',
  templateUrl: 'ticket-detail.component.html',
  styleUrls: ['ticket-detail.component.scss'],
  standalone: false
})

export class TicketDetailComponent extends AppCommonComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ZmaTicketApiService);
  private userMs = inject(UserManageService);
  private notify = inject(NotifyService);

  loading = false;

  ticketNo = '---';
  fieldIndex = 0;
  fieldName = '';

  timeRange = '--:-- - --:--';
  statusText = '';
  createdAt = '';

  qrImageUrl = 'assets/img/qr-demo.png';

  ngOnInit() {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'QR Code số thứ tự' });
    document.body.classList.add('page-book-appointment');

    const id = Number(this.route.snapshot.paramMap.get('id') ?? 0);
    if (!id) {
      this.notify.error('Ticket không hợp lệ.');
      this.router.navigate(['/bookappointment']);
      return;
    }

    const appId = String(environment.apiConfig?.appId ?? '');

    this.loading = true;

    this.userMs.getValidToken$(appId).pipe(
      switchMap(() => this.api.showTicket(id)),
      map(res => res?.data ?? null),
      tap(data => this.applyDetail(data)),
      catchError((err) => {
        const status = err?.status;

        if (status === 401) {
          this.notify.warning('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          this.router.navigate(['/bookappointment']);
          return of(null);
        }

        if (status === 403) {
          this.notify.error('Bạn không có quyền xem ticket này.');
          this.router.navigate(['/bookappointment']);
          return of(null);
        }

        if (status === 404) {
          this.notify.warning('Không tìm thấy ticket.');
          this.router.navigate(['/bookappointment']);
          return of(null);
        }

        this.notify.error('Không thể tải chi tiết ticket.');
        return of(null);
      }),
      finalize(() => (this.loading = false)),
      takeUntil(this.destroyed)
    ).subscribe();
  }

  ngOnDestroy() {
    document.body.classList.remove('page-book-appointment');
    this.getDestroySubs();
  }

  private applyDetail(raw: any | null) {
    if (!raw) return;

    const order = Number(raw?.orderNumber ?? raw?.order_number ?? 0);
    this.ticketNo = order ? String(order).padStart(3, '0') : '---';

    const sf = raw?.serviceField ?? raw?.service_field ?? null;
    this.fieldIndex = Number(sf?.id ?? 0);
    this.fieldName = String(sf?.name ?? sf?.title ?? '');

    const ts = raw?.timeSlot ?? raw?.time_slot ?? null;
    const start = String(ts?.startTime ?? ts?.start_time ?? '').slice(0, 5);
    const end   = String(ts?.endTime ?? ts?.end_time ?? '').slice(0, 5);
    this.timeRange = (start && end) ? `${start} - ${end}` : '--:-- - --:--';

    const apptDate = String(raw?.appointmentDate ?? raw?.appointment_date ?? '').slice(0, 10);

    this.statusText = this.mapScheduleStatus(apptDate, start, end);

    const createdUnix = Number(raw?.createdAt ?? raw?.created_at ?? 0);
    this.createdAt = createdUnix ? this.formatUnix(createdUnix) : '';
  }

  private mapScheduleStatus(
    appointmentDate: string | null | undefined,
    startHHmm: string | null | undefined,
    endHHmm: string | null | undefined
  ): string {
    const start = (startHHmm ?? '').toString().slice(0, 5);
    const end   = (endHHmm ?? '').toString().slice(0, 5);

    if (!end) return 'Chưa tới giờ hẹn';

    const today = this.formatYmd(new Date());
    const date = (appointmentDate ?? today).toString().slice(0, 10);

    if (date !== today) {
      return date < today ? 'Đã quá giờ hẹn' : 'Chưa tới giờ hẹn';
    }

    const now = new Date();
    const endAt = this.buildDateTime(today, end);

    return now.getTime() >= endAt.getTime()
      ? 'Đã quá giờ hẹn'
      : 'Chưa tới giờ hẹn';
  }

  private formatYmd(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  private buildDateTime(ymd: string, hhmm: string): Date {
    const [y, m, d] = ymd.split('-').map(Number);
    const [hh, mm] = hhmm.split(':').map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
  }

  private formatUnix(unixSeconds: number): string {
    const d = new Date(unixSeconds * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
