import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {IResUserInfo} from '../../../../core/models/zmp.model';
import {finalize, Observable, of, takeUntil} from 'rxjs';
import {UserManageService} from '../../../../shared/services/feature-specific/user/user-manage.service';
import {NotifyService} from '../../../../core/services';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import {IZmaTicket, ZmaTicketApiService} from '../../../../shared/services/api/ticket/ticket-api.service';
import {Router} from '@angular/router';
import {formatTicketNumber, formatTicketStatus} from '../../../../shared/utils';

@Component({
  selector: 'app-book-appointment',
  templateUrl: 'book-appointment.component.html',
  styleUrls: [`book-appointment.component.scss`],
  standalone: false
})

export class BookAppointmentComponent extends AppCommonComponent implements OnInit, OnDestroy {
  userInfo!: IResUserInfo;
  /** 1: chưa login | 2: đã login */
  step: 1 | 2 = 1;
  private isGranting = false
  private router = inject(Router);

  tickets: IZmaTicket[] = [];
  selectedTicketId: number | null = null;

  get selectedTicket(): IZmaTicket | null {
    if (!this.selectedTicketId) return null;
    return this.tickets.find(t => t.id === this.selectedTicketId) ?? null;
  }

  loadingTickets = false;
  readonly maxTicketsPerDay = 2;

  constructor(
    private userMsService: UserManageService,
    private _notify: NotifyService,
    private ticketApi: ZmaTicketApiService
  ) {
    super();
  }
  ngOnInit() {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Danh sách số thứ tự' });
    document.body.classList.add('page-book-appointment');

    // Kiểm tra người dân có vừa gỡ quyền bên Cài đặt Zalo không — thao tác đó xảy ra ngoài app nên
    // phải kiểm ở điểm vào màn, không thể chỉ dựa vào lúc app khởi động.
    this.userMsService.clearSessionIfScopeRevoked$()
      .pipe(
        switchMap(() => this.userService.userInfo$),
        takeUntil(this.destroyed),
        switchMap((info) => {
          if (!(info && info.name) || !this.userMsService.isLoggedIn()) {
            // Không tự đăng nhập ngầm: `authorize()`/`getPhoneNumber()` cần thao tác thật của
            // người dùng. Hiện bước 1 để người dân chủ động bấm "Đăng nhập".
            this.step = 1;
            return of(null);
          }

          this.userInfo = info;
          this.step = 2;
          return this.loadMyTickets$();
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    document.body.classList.remove('page-book-appointment');
    this.getDestroySubs();
  }

  /**
   * Người dân bấm "Đăng nhập". `login$()` lo trọn gói: xin quyền -> verify accessToken ->
   * getPhoneNumber -> đổi lấy token nội bộ; lỗi nghiệp vụ đã được toast bên trong nên ở đây chỉ
   * cần bám vào kết quả cuối là đã có phiên hay chưa.
   */
  onLoginNow() {
    if (this.isGranting) return;
    this.isGranting = true;

    this.spinner.show();

    this.userMsService.login$().pipe(
      takeUntil(this.destroyed),
      switchMap(() => {
        if (!this.userMsService.isLoggedIn()) {
          this.step = 1;
          return of(null);
        }

        this.step = 2;
        this._notify.success('Đăng nhập thành công.');
        return this.loadMyTickets$();
      }),
      finalize(() => {
        this.isGranting = false;
        this.spinner.hide();
      })
    ).subscribe();
  }

  private loadMyTickets$(): Observable<IZmaTicket[] | null> {
    this.loadingTickets = true;

    return this.ticketApi.myTickets().pipe(
      map((res) => res?.data?.result ?? []),

      tap((tickets) => {
        this.tickets = tickets;

        if (tickets.length) {
          this.selectedTicketId ??= tickets[0].id;
        } else {
          this.selectedTicketId = null;
        }
      }),

      catchError(() => {
        this._notify.error('Không thể tải danh sách số thứ tự.');
        this.tickets = [];
        this.selectedTicketId = null;
        return of(null);
      }),
      finalize(() => (this.loadingTickets = false))
    );
  }

  displayTicketNo(t: IZmaTicket): string {
    return formatTicketNumber(t.orderNumber, t.ticketDate);
  }

  displayTimeRange(t: IZmaTicket): string {
    if (!t.timeSlot) return '--:-- - --:--';
    return `${t.timeSlot.startTime} - ${t.timeSlot.endTime}`;
  }

  displayServiceTitle(t: IZmaTicket): string {
    return t.field?.name ?? '';
  }

  onSelectTicket(id: number) {
    this.selectedTicketId = id;
  }

  /** Trạng thái đọc THẲNG từ BE (nguồn sự thật duy nhất) — không tự suy diễn từ ngày/giờ hẹn. */
  mapStatus(status: string | null | undefined): string {
    return formatTicketStatus(status);
  }

  onTakeNumber() {
    if (this.loadingTickets) return;

    const used = this.ticketsTodayCount();
    if (used >= this.maxTicketsPerDay) {
      this._notify.warning(`Bạn đã lấy đủ ${this.maxTicketsPerDay} số hôm nay, không thể lấy thêm.`);
      return;
    }

    this.router.navigate(['/getnumber']);
  }

  onCopyTicket(t: IZmaTicket) {
    const text = `${this.displayTicketNo(t)} | ${this.displayServiceTitle(t)} | ${this.displayTimeRange(t)}`;
    navigator.clipboard?.writeText(text);
    this._notify.success('Đã sao chép.');
  }

  onDetailTicket(t: IZmaTicket) {
    this.router.navigate(['/ticket', t.id]);
  }

  private todayYmd(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /**
   * Đếm phiếu "hôm nay" theo `ticketDate` thật của BE — chỉ dùng để CẢNH BÁO SỚM phía FE
   * (chặn ở BE mới là chốt chặn thật, xem R1 phía AppointmentTicketService::create). Nếu máy
   * người dùng lệch múi giờ, ước tính này có thể trễ 1 nhịp so với "hôm nay" thật của server —
   * khi đó BE vẫn trả lỗi USER_DAILY_LIMIT_REACHED đúng, get-number.component sẽ hiển thị đúng.
   */
  private ticketsTodayCount(): number {
    const today = this.todayYmd();
    return (this.tickets ?? []).filter(t => t.ticketDate === today).length;
  }

  get canTakeNumber(): boolean {
    return this.ticketsTodayCount() < this.maxTicketsPerDay;
  }
}
