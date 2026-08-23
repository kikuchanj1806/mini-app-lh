import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {catchError, map} from 'rxjs/operators';
import {ActivatedRoute, Router} from '@angular/router';
import {IZmaTicketDetail, ZmaTicketApiService} from '../../../../shared/services/api/ticket/ticket-api.service';
import {NotifyService} from '../../../../core/services';
import {finalize, of, takeUntil, tap} from 'rxjs';
import {formatTicketCreatedAt, formatTicketNumber, formatTicketStatus} from '../../../../shared/utils';

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

    // Không tự đăng nhập ngầm ở đây: màn này chỉ mở được từ danh sách phiếu, tức người dân đã đăng
    // nhập từ trước. Token hết hạn/bị thu hồi thì nhánh 401 bên dưới đưa về màn danh sách để đăng
    // nhập lại — đúng một đường xử lý, không có luồng xin quyền bung ra giữa màn chi tiết.
    this.loading = true;

    this.api.showTicket(id).pipe(
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

  /** Đọc thẳng status/ticketDate/field/timeSlot từ BE — không tự suy diễn từ giờ hẹn nữa. */
  private applyDetail(raw: IZmaTicketDetail | null) {
    if (!raw) return;

    this.ticketNo = formatTicketNumber(raw.orderNumber, raw.ticketDate);

    this.fieldIndex = raw.field?.id ?? 0;
    this.fieldName = raw.field?.name ?? '';

    this.timeRange = raw.timeSlot ? `${raw.timeSlot.startTime} - ${raw.timeSlot.endTime}` : '--:-- - --:--';
    this.statusText = formatTicketStatus(raw.status);
    this.createdAt = formatTicketCreatedAt(raw.createdAt);
  }
}
