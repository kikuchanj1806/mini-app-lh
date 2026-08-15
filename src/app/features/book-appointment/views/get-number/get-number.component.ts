import {Component, OnDestroy, OnInit} from '@angular/core';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {AppointmentApiService} from '../../../../shared/services/api/appointment/appointment-api.service';
import {NotifyService} from '../../../../core/services';
import {finalize, forkJoin, takeUntil, timer} from 'rxjs';
import {ZmaTicketApiService} from '../../../../shared/services/api/ticket/ticket-api.service';
import {formatTicketNumber, parse409} from '../../../../shared/utils';
import {environment} from '../../../../../environments';
import {switchMap} from 'rxjs/operators';
import {Router} from '@angular/router';

@Component({
  selector: 'app-get-number',
  templateUrl: 'get-number.component.html',
  styleUrls: ['get-number.component.scss'],
  standalone: false
})

export class GetNumberComponent extends AppCommonComponent implements OnInit, OnDestroy {
  fields: Array<{id:number; name:string}> = [];
  slots: Array<{id:number; start_time:string; end_time:string; max_tickets:number}> = [];

  selectedFieldId?: number;
  selectedSlotId?: number;

  wardId = environment.wardId;

  isSubmitting = false;
  ticketNo: string | null = null;

  constructor(
    private apptApi: AppointmentApiService,
    private ticketApi: ZmaTicketApiService,
    private notify: NotifyService,
    private router: Router,
  ) { super(); }

  ngOnInit() {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Lấy số thứ tự' });
    document.body.classList.add('page-book-appointment');
    this.loadDropdowns();
  }

  ngOnDestroy() {
    this.getDestroySubs();
  }

  loadDropdowns() {
    forkJoin({
      fields: this.apptApi.listFields$(this.wardId),
      slots: this.apptApi.listTimeSlots$(this.wardId),
    })
      .pipe(takeUntil(this.destroyed))
      .subscribe({
        next: ({ fields, slots }) => {
          this.fields = fields?.data ?? [];

          const raw = slots?.data ?? [];
          this.slots = raw.map((x: any) => ({
            id: Number(x.id),
            start_time: x.startTime ?? '',
            end_time: x.endTime ?? '',
            max_tickets: Number(x.maxTickets ?? 0),
          }));
        },
        error: () => this.notify.error('Không tải được dữ liệu lĩnh vực/khung giờ.')
      });
  }

  onTakeNumber() {
    if (this.isSubmitting) return;

    if (!this.selectedFieldId || !this.selectedSlotId) {
      this.notify.warning('Vui lòng chọn lĩnh vực và thời gian.');
      return;
    }

    this.isSubmitting = true;

    const payload = {
      ward_id: this.wardId,
      service_field_id: this.selectedFieldId!,
      time_slot_id: this.selectedSlotId!,
    };

    this.ticketApi.createTicket$(payload).pipe(
      takeUntil(this.destroyed),
      finalize(() => (this.isSubmitting = false)),
      switchMap((res) => {
        const orderNumber = res?.data?.order_number ?? res?.data?.orderNumber;
        const ticketDate =
          res?.data?.appointment_date ??
          res?.data?.appointmentDate ??
          res?.data?.created_at ??
          res?.data?.createdAt;
        this.ticketNo = formatTicketNumber(orderNumber, ticketDate);

        this.notify.success(`Lấy số thành công. Số của bạn: ${this.ticketNo}`);

        return timer(1000);
      })
    ).subscribe({
      next: () => {
        this.router.navigateByUrl('/bookappointment');
      },
      error: (err) => {
        const c = parse409(err);
        if (c) {
          if (c.code === 'SLOT_FULL') {
            this.notify.warning('Khung giờ đã đủ số, vui lòng chọn khung khác.');
            return;
          }
          if (c.code === 'FIELD_DAILY_LIMIT_REACHED') {
            this.notify.warning('Hôm nay lĩnh vực này đã đủ số, vui lòng chọn lĩnh vực khác.');
            return;
          }
          if (c.code === 'DUPLICATE_BOOKING') {
            this.notify.info('Bạn đã có số trong khung giờ này hôm nay.');
            return;
          }
          this.notify.warning(c.message || 'Không thể lấy số, vui lòng thử lại.');
          return;
        }

        this.notify.error('Không thể lấy số, vui lòng thử lại.');
      }
    });
  }
}
