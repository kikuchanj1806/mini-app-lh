import {Component, OnDestroy, OnInit} from '@angular/core';
import {of} from 'rxjs';
import {catchError, finalize, switchMap, takeUntil} from 'rxjs/operators';
import {
  FEEDBACK_FIELDS,
  FEEDBACK_STATUS_LABEL,
  FeedbackApiService,
  IFeedbackMyDetail,
  IFeedbackPublicItem,
} from '../../../../shared/services/api/feedbacks/feedback-api.service';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {NotifyService} from '../../../../core/services';
import {UserManageService} from '../../../../shared/services/feature-specific/user/user-manage.service';

@Component({
  selector: 'app-feedback-my',
  templateUrl: './feedback-my.component.html',
  styleUrls: ['./feedback-my.component.scss'],
  standalone: false
})
export class FeedbackMyComponent extends AppCommonComponent implements OnInit, OnDestroy {
  readonly fields = FEEDBACK_FIELDS;
  readonly statusLabel = FEEDBACK_STATUS_LABEL;

  items: IFeedbackPublicItem[] = [];
  loading = false;

  /** Chưa đăng nhập -> hiện lời mời xác thực thay vì danh sách rỗng gây hiểu nhầm "chưa gửi cái nào". */
  needsLogin = false;
  isLoggingIn = false;

  /** Chi tiết mở tại chỗ: id đang mở + nội dung đã tải (cache theo id để không gọi lại). */
  expandedId: number | null = null;
  detailById = new Map<number, IFeedbackMyDetail>();
  loadingDetailId: number | null = null;

  constructor(
    private api: FeedbackApiService,
    private notify: NotifyService,
    private userManage: UserManageService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.setHeader({variant: 'title', show: true, back: true, title: 'Phản ánh của tôi'});

    // Quyền có thể bị gỡ bên Cài đặt Zalo khi webview vẫn đang chạy — kiểm ở điểm vào màn.
    this.userManage.clearSessionIfScopeRevoked$()
      .pipe(takeUntil(this.destroyed))
      .subscribe(() => {
        this.needsLogin = !this.userManage.isLoggedIn();
        if (!this.needsLogin) this.load();
      });
  }

  load(): void {
    this.loading = true;
    this.api.myList({page: 1, pageSize: 20})
      .pipe(
        takeUntil(this.destroyed),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: (res) => {
          this.items = res?.data?.result ?? [];
          this.needsLogin = false;
        },
        error: (err) => {
          // 401 ở đây nghĩa là token vừa bị interceptor xoá (hết hạn/bị thu hồi) — mời đăng nhập
          // lại thay vì báo lỗi tải dữ liệu.
          if (err?.status === 401) {
            this.needsLogin = true;
            return;
          }
          this.notify.error('Không tải được danh sách phản ánh của bạn.');
        },
      });
  }

  /** Đăng nhập do người dân chủ động bấm — `login$()` cần ngữ cảnh tương tác. */
  onLogin(): void {
    if (this.isLoggingIn) return;
    this.isLoggingIn = true;
    this.spinner.show();

    this.userManage.login$()
      .pipe(
        takeUntil(this.destroyed),
        finalize(() => {
          this.isLoggingIn = false;
          this.spinner.hide();
        }),
      )
      .subscribe(() => {
        this.needsLogin = !this.userManage.isLoggedIn();
        if (!this.needsLogin) this.load();
      });
  }

  onToggleDetail(it: IFeedbackPublicItem): void {
    if (this.expandedId === it.id) {
      this.expandedId = null;
      return;
    }

    this.expandedId = it.id;
    if (this.detailById.has(it.id)) return;

    this.loadingDetailId = it.id;
    this.api.myDetail(it.id)
      .pipe(
        takeUntil(this.destroyed),
        catchError(() => {
          this.notify.error('Không tải được chi tiết phản ánh.');
          return of(null);
        }),
        finalize(() => (this.loadingDetailId = null)),
      )
      .subscribe((res) => {
        const detail = res?.data ?? null;
        if (detail) this.detailById.set(it.id, detail);
      });
  }

  detailOf(id: number): IFeedbackMyDetail | null {
    return this.detailById.get(id) ?? null;
  }

  fieldLabel(field: string): string {
    return this.fields.find((it) => it.value === field)?.label ?? 'Khác';
  }

  imgSrc(it: IFeedbackPublicItem): string {
    return it.coverImageUrl || '/assets/img/tin_tuc_img_default.jpg';
  }

  ngOnDestroy(): void {
    this.getDestroySubs();
  }
}
