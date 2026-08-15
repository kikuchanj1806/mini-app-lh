import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {IResUserInfo} from '../../../../core/models/zmp.model';
import {AllScope} from '../../../../shared/models/feature-specific/zmp.model';
import {finalize, Observable, of, takeUntil} from 'rxjs';
import {UserManageService} from '../../../../shared/services/feature-specific/user/user-manage.service';
import {NotifyService} from '../../../../core/services';
import {environment} from '../../../../../environments';
import {catchError, map, switchMap, take, tap} from 'rxjs/operators';
import {
  IZmaTicket,
  IZmaTicketApi,
  ZmaTicketApiService
} from '../../../../shared/services/api/ticket/ticket-api.service';
import {Router} from '@angular/router';
import {formatTicketNumber, normalizeTicketDateYmd} from '../../../../shared/utils';

@Component({
  selector: 'app-book-appointment',
  templateUrl: 'book-appointment.component.html',
  styleUrls: [`book-appointment.component.scss`],
  standalone: false
})

export class BookAppointmentComponent extends AppCommonComponent implements OnInit, OnDestroy {
  userInfo!: IResUserInfo;
  /** 1: chưa login | 2: đã login */
  step: 1 | 2 = 1; // đổi sang 1 để test màn chưa login
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

    const appId = String(environment.apiConfig?.appId ?? '');
    this.userService.userInfo$
      .pipe(
        takeUntil(this.destroyed),
        switchMap((info) => {
          if (!(info && info.name)) {
            this.step = 1;
            return of(null);
          }

          this.userInfo = info;
          // 1) có token valid -> step 2 -> load tickets
          const token = this.userMsService.getTokenIfValid();
          if (token) {
            this.step = 2;
            return this.loadMyTickets$();
          }

          // 2) token hết hạn -> refresh -> step 2 -> load tickets
          return this.userMsService.refresh$(appId).pipe(
            tap(() => (this.step = 2)),
            switchMap(() => this.loadMyTickets$()),
            catchError(() => {
              this.step = 1;
              return of(null);
            })
          );
        })
      )
      .subscribe();

    // this.step = 2 // Dùng để test màn đã login
  }

  ngOnDestroy() {
    document.body.classList.remove('page-book-appointment');
    this.getDestroySubs();
  }

  // demo handlers
  onLoginNow() {
    if (this.isGranting) return;
    this.isGranting = true;

    const scopes: AllScope[] = ['scope.userInfo', 'scope.userPhonenumber'];
    const appId = String(environment.apiConfig?.appId ?? '');

    this.spinner.show();

    this.userMsService.grantPermissionAndFetchUser$(scopes).pipe(
      takeUntil(this.destroyed),
      switchMap((res) => {
        if (!res) return of(null);
        const { perms, userInfo } = res;

        if (!userInfo) return of(res);

        this.userService.saveGrantAndUser(perms, userInfo);

        const phone = (userInfo && userInfo.phoneNumber) ? userInfo.phoneNumber : '';
        //lấy token nội bộ
        return this.userMsService.refresh$(appId, phone).pipe(
          map(() => res),
          catchError(() => of(res))
        );
      }),
      finalize(() => {
        this.isGranting = false;
        this.spinner.hide();
      })
    ).subscribe({
      next: (res) => {
        if (!res) {
          this._notify.error('Có lỗi xảy ra khi xin quyền.');
          return;
        }

        const { perms, userInfo } = res;

        if (userInfo) {
          if (this.userMsService.getTokenIfValid()) {
            this.step = 2;
            this._notify.success('Đăng nhập thành công.');
          } else {
            this._notify.warning('Đã lấy thông tin, nhưng chưa tạo được token nội bộ. Vui lòng thử lại.');
          }
          return;
        }

        const missing = scopes.filter(s => !perms?.[s]);
        if (missing.length) this._notify.warning('Bạn chưa cấp đủ quyền cần thiết (User info / Phone).');
        else this._notify.error('Không thể lấy thông tin người dùng.');
      },
      error: () => this._notify.error('Đã xảy ra lỗi khi cấp quyền.')
    });
  }

  private loadMyTickets$(): Observable<IZmaTicket[] | null> {
    this.loadingTickets = true;

    return this.ticketApi.myTickets().pipe(
      map((res) => (res?.data ?? []) as IZmaTicketApi[]),
      map((arr) => arr.map(x => this.normalizeTicket(x))),

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

  private normalizeTicket(x: IZmaTicketApi): IZmaTicket {
    const orderNumber = Number(x.orderNumber ?? 0);
    const status = Number(x.status ?? 0);
    const appointmentDate = normalizeTicketDateYmd(
      x.appointmentDate ?? x.appointment_date ?? x.createdAt ?? x.created_at
    );
    const createdAt = Number(x.createdAt ?? x.created_at ?? 0) || undefined;

    // timeSlot có thể trả startTime/endTime hoặc start_time/end_time
    const start = (x.timeSlot?.startTime ?? x.timeSlot?.start_time ?? '') as string;
    const end   = (x.timeSlot?.endTime ?? x.timeSlot?.end_time ?? '') as string;

    // serviceField có thể name/title tuỳ bạn
    const serviceName = (x.serviceField?.name ?? x.serviceField?.title ?? '') as string;

    return {
      id: x.id,
      orderNumber,
      ticketCode: x.ticketCode,
      qrToken: x.qrToken,
      status,
      wardName: x.ward?.name,
      serviceName,
      startTime: start ? start.toString().slice(0, 5) : undefined,
      endTime: end ? end.toString().slice(0, 5) : undefined,
      appointmentDate,
      createdAt,
    };
  }

  displayTicketNo(t: IZmaTicket): string {
    return formatTicketNumber(t.orderNumber, t.appointmentDate ?? t.createdAt);
  }

  displayTimeRange(t: IZmaTicket): string {
    return this.formatTimeRange(t.startTime, t.endTime);
  }

  displayServiceTitle(t: IZmaTicket): string {
    return t.serviceName ?? '';
  }

  onSelectTicket(id: number) {
    this.selectedTicketId = id;
  }

  mapStatus(status: number | string | null | undefined): string {
    const s = Number(status ?? 0);

    // Bạn đổi theo enum thực tế của BE nếu có
    switch (s) {
      case 0: return 'Chờ xác nhận';
      case 1: return 'Đã xác nhận';
      case 2: return 'Đang xử lý';
      case 3: return 'Hoàn thành';
      case 4: return 'Đã hủy';
      default: return 'Không xác định';
    }
  }

  private formatTimeRange(start?: string | null, end?: string | null): string {
    const s = (start ?? '').toString().slice(0, 5); // "HH:mm"
    const e = (end ?? '').toString().slice(0, 5);
    if (!s || !e) return '--:-- - --:--';
    return `${s} - ${e}`;
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

  private ticketsTodayCount(): number {
    const today = this.todayYmd();

    return (this.tickets ?? []).filter(t => {
      const ticketDate = t.appointmentDate ?? normalizeTicketDateYmd(t.createdAt);
      return !ticketDate || ticketDate === today;
    }).length;
  }

  get canTakeNumber(): boolean {
    return this.ticketsTodayCount() < this.maxTicketsPerDay;
  }
}
