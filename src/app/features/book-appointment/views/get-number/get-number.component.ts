import {Component, OnDestroy, OnInit} from '@angular/core';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {
  AppointmentApiService,
  IAppointmentFieldOption,
  IAppointmentTimeSlotOption,
} from '../../../../shared/services/api/appointment/appointment-api.service';
import {NotifyService} from '../../../../core/services';
import {finalize, takeUntil, timer} from 'rxjs';
import {ZmaTicketApiService} from '../../../../shared/services/api/ticket/ticket-api.service';
import {formatTicketNumber, parse409} from '../../../../shared/utils';
import {switchMap} from 'rxjs/operators';
import {Router} from '@angular/router';

@Component({
  selector: 'app-get-number',
  templateUrl: 'get-number.component.html',
  styleUrls: ['get-number.component.scss'],
  standalone: false
})

export class GetNumberComponent extends AppCommonComponent implements OnInit, OnDestroy {
  fields: IAppointmentFieldOption[] = [];
  slots: IAppointmentTimeSlotOption[] = [];

  selectedFieldId?: number;
  selectedSlotId?: number;

  loadingFields = false;
  loadingSlots = false;
  isSubmitting = false;
  ticketNo: string | null = null;

  /** Giữ nguyên trong 1 lượt bấm (kể cả khi mạng chập chờn phải gửi lại) — chỉ đổi mới khi
   *  lượt trước đã kết thúc (thành công hoặc lỗi). Double-submit cùng key -> BE trả về đúng
   *  phiếu cũ thay vì tạo phiếu trùng. */
  private pendingIdempotencyKey: string | null = null;

  constructor(
    private apptApi: AppointmentApiService,
    private ticketApi: ZmaTicketApiService,
    private notify: NotifyService,
    private router: Router,
  ) { super(); }

  ngOnInit() {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Lấy số thứ tự' });
    document.body.classList.add('page-book-appointment');
    this.loadFields();
  }

  ngOnDestroy() {
    this.getDestroySubs();
  }

  loadFields() {
    this.loadingFields = true;
    this.apptApi.listFields$()
      .pipe(finalize(() => (this.loadingFields = false)), takeUntil(this.destroyed))
      .subscribe({
        next: (res) => { this.fields = res?.data ?? []; },
        error: () => this.notify.error('Không tải được danh sách lĩnh vực.'),
      });
  }

  /** Sức chứa khung giờ phụ thuộc lĩnh vực đã chọn — phải tải lại khi đổi lĩnh vực. */
  onFieldChange() {
    this.selectedSlotId = undefined;
    this.slots = [];
    if (!this.selectedFieldId) return;

    this.loadingSlots = true;
    this.apptApi.listTimeSlots$(this.selectedFieldId)
      .pipe(finalize(() => (this.loadingSlots = false)), takeUntil(this.destroyed))
      .subscribe({
        next: (res) => { this.slots = res?.data ?? []; },
        error: () => this.notify.error('Không tải được khung giờ.'),
      });
  }

  onTakeNumber() {
    if (this.isSubmitting) return;

    if (!this.selectedFieldId || !this.selectedSlotId) {
      this.notify.warning('Vui lòng chọn lĩnh vực và thời gian.');
      return;
    }

    const slot = this.slots.find(s => s.id === this.selectedSlotId);
    if (slot?.alreadyBooked) {
      this.notify.info('Bạn đã có số trong khung giờ này hôm nay.');
      return;
    }
    if (slot && slot.remaining <= 0) {
      this.notify.warning('Khung giờ đã đủ số, vui lòng chọn khung khác.');
      return;
    }

    this.isSubmitting = true;
    this.pendingIdempotencyKey ??= this.generateIdempotencyKey();

    const payload = {
      fieldId: this.selectedFieldId,
      timeSlotId: this.selectedSlotId,
      idempotencyKey: this.pendingIdempotencyKey,
    };

    // LƯU Ý: KHÔNG dùng finalize() ở đây để reset isSubmitting — finalize gắn trước switchMap
    // sẽ chạy ngay khi request tạo phiếu hoàn tất, TRƯỚC khi timer(1000)+điều hướng xong, mở ra
    // khoảng ~1s người dùng bấm được lần 2 (double-submit). isSubmitting chỉ được hạ ở
    // next/error của subscribe cuối, tức sau khi luồng thực sự kết thúc.
    this.ticketApi.createTicket$(payload).pipe(
      takeUntil(this.destroyed),
      switchMap((res) => {
        const data = res?.data;
        this.ticketNo = formatTicketNumber(data?.orderNumber, data?.ticketDate);
        this.notify.success(`Lấy số thành công. Số của bạn: ${this.ticketNo}`);

        return timer(1000);
      })
    ).subscribe({
      next: () => {
        this.pendingIdempotencyKey = null;
        this.isSubmitting = false;
        this.router.navigateByUrl('/bookappointment');
      },
      error: (err) => {
        this.pendingIdempotencyKey = null;
        this.isSubmitting = false;

        const c = parse409(err);
        if (c) {
          if (c.code === 'SLOT_FULL') {
            this.notify.warning('Khung giờ đã đủ số, vui lòng chọn khung khác.');
            this.onFieldChange();
            return;
          }
          if (c.code === 'FIELD_DAILY_LIMIT_REACHED') {
            this.notify.warning('Hôm nay lĩnh vực này đã đủ số, vui lòng chọn lĩnh vực khác.');
            return;
          }
          if (c.code === 'USER_DAILY_LIMIT_REACHED') {
            this.notify.warning(c.message || 'Bạn đã lấy đủ số phiếu hôm nay.');
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

  private generateIdempotencyKey(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
