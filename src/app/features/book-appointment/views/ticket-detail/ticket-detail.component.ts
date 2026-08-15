import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {catchError, map, switchMap} from 'rxjs/operators';
import {ActivatedRoute, Router} from '@angular/router';
import {ZmaTicketApiService} from '../../../../shared/services/api/ticket/ticket-api.service';
import {UserManageService} from '../../../../shared/services/feature-specific/user/user-manage.service';
import {NotifyService} from '../../../../core/services';
import {environment} from '../../../../../environments';
import {finalize, of, takeUntil, tap} from 'rxjs';
import {formatTicketNumber, normalizeTicketDateYmd} from '../../../../shared/utils';

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
    this.setHeader({variant: 'title', show: true, back: true, title: 'QR Code số thứ tự'});
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
    const appointmentDate = normalizeTicketDateYmd(
      raw?.appointmentDate ?? raw?.appointment_date ?? raw?.createdAt ?? raw?.created_at
    );
    this.ticketNo = formatTicketNumber(order, appointmentDate ?? raw?.createdAt ?? raw?.created_at);

    const sf = raw?.serviceField ?? raw?.service_field ?? null;
    this.fieldIndex = Number(sf?.id ?? 0);
    this.fieldName = String(sf?.name ?? sf?.title ?? '');

    const ts = raw?.timeSlot ?? raw?.time_slot ?? null;
    const start = String(ts?.startTime ?? ts?.start_time ?? '').slice(0, 5);
    const end = String(ts?.endTime ?? ts?.end_time ?? '').slice(0, 5);
    this.timeRange = (start && end) ? `${start} - ${end}` : '--:-- - --:--';

    const apptDate = appointmentDate ?? '';

    this.statusText = this.mapScheduleStatus(apptDate, start, end);

    const createdUnix = Number(raw?.createdAt ?? raw?.created_at ?? 0);
    this.createdAt = createdUnix ? this.formatUnix(createdUnix) : '';
  }

  private mapScheduleStatus(
    appointmentDate: string | null | undefined,
    startHHmm: string | null | undefined,
    endHHmm: string | null | undefined
  ): string {
    const today = this.formatYmd(new Date());
    const dateStr = (appointmentDate ?? today).toString().slice(0, 10);

    const start = (startHHmm ?? '').toString().slice(0, 5); // "HH:mm"
    const end = (endHHmm ?? '').toString().slice(0, 5);

    // Nếu không có ngày -> coi như hôm nay
    const isValidYmd = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    const ymd = isValidYmd ? dateStr : today;

    // Nếu ngày khác hôm nay: chỉ phân loại theo quá khứ/tương lai
    if (ymd !== today) {
      const d = this.buildDateTime(ymd, '00:00');
      const t = this.buildDateTime(today, '00:00');
      return d.getTime() < t.getTime() ? 'Đã quá giờ hẹn' : 'Chưa tới giờ hẹn';
    }

    // Ngày = hôm nay
    if (!start && !end) return 'Chưa tới giờ hẹn';

    const now = new Date();

    if (start && end) {
      const startAt = this.buildDateTime(today, start);
      const endAt = this.buildDateTime(today, end);

      // phòng trường hợp data lỗi: end < start (qua ngày) -> tạm coi end cùng ngày nhưng nếu bé hơn start thì coi như end = start
      const safeEndAt = endAt.getTime() < startAt.getTime() ? startAt : endAt;

      if (now.getTime() < startAt.getTime()) return 'Chưa tới giờ hẹn';
      if (now.getTime() >= safeEndAt.getTime()) return 'Đã quá giờ hẹn';
      return 'Đã tới giờ hẹn';
    }

    // Chỉ có start
    if (start) {
      const startAt = this.buildDateTime(today, start);
      return now.getTime() >= startAt.getTime() ? 'Đã tới giờ hẹn' : 'Chưa tới giờ hẹn';
    }

    // Chỉ có end
    const endAt = this.buildDateTime(today, end);
    return now.getTime() >= endAt.getTime() ? 'Đã quá giờ hẹn' : 'Chưa tới giờ hẹn';
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
