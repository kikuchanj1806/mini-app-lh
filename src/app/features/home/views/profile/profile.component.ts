import {Component, OnDestroy, OnInit} from '@angular/core';
import {forkJoin} from 'rxjs';
import {finalize, takeUntil} from 'rxjs/operators';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {NotifyService, UserService} from '../../../../core/services';
import {UserManageService} from '../../../../shared/services/feature-specific/user/user-manage.service';
import {ICustomerProfile} from '../../../../shared/services/api/user/customer-auth-api.service';
import {ResidentCacheService} from '../../../../shared/services/feature-specific/user/resident-cache.service';
import {IResMyResident} from '../../../../shared/models/api';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: false,
})
export class ProfileComponent extends AppCommonComponent implements OnInit, OnDestroy {
  /** Chưa đăng nhập -> hiện lời mời xác thực thay vì hồ sơ rỗng. */
  needsLogin = false;
  isLoggingIn = false;
  isLoggingOut = false;
  loading = false;

  profile: ICustomerProfile | null = null;
  resident: IResMyResident | null = null;
  avatarBroken = false;

  readonly verificationLabel: Record<string, string> = {
    pending: 'Chờ duyệt',
    verified: 'Đã xác thực',
    rejected: 'Bị từ chối',
  };

  constructor(
    private residentCache: ResidentCacheService,
    private notify: NotifyService,
    private userManage: UserManageService,
    private users: UserService,
  ) {
    super();
  }

  /** Ảnh Zalo lưu sẵn từ lúc đăng nhập (`login$()` -> `UserService.saveGrantAndUser`) — có ngay,
   * không tốn thêm request. */
  get avatarUrl(): string | null {
    return this.avatarBroken ? null : (this.users.userInfoValue?.avatar || null);
  }

  onAvatarError(): void {
    this.avatarBroken = true;
  }

  ngOnInit(): void {
    this.setHeader({variant: 'title', show: true, back: true, title: 'Cá nhân'});

    // Quyền Zalo có thể bị gỡ ngoài app trong lúc webview vẫn đang chạy — kiểm ở điểm vào màn.
    this.userManage.clearSessionIfScopeRevoked$()
      .pipe(takeUntil(this.destroyed))
      .subscribe(() => {
        this.needsLogin = !this.userManage.isLoggedIn();
        if (!this.needsLogin) this.load();
      });
  }

  ngOnDestroy(): void {
    this.getDestroySubs();
  }

  load(): void {
    this.loading = true;
    forkJoin({
      profile: this.userManage.profileOrFetch$(),
      resident: this.residentCache.myProfileOnce$(),
    })
      .pipe(takeUntil(this.destroyed), finalize(() => (this.loading = false)))
      .subscribe(({profile, resident}) => {
        this.profile = profile;
        this.resident = resident;
        this.needsLogin = !profile;
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

  onLogout(): void {
    if (this.isLoggingOut) return;

    this.notify.dialogConfirmDelete({
      title: 'Đăng xuất',
      content: 'Bạn có chắc muốn đăng xuất khỏi ứng dụng?',
      btnConfirmName: 'Đăng xuất',
      btnConfirmClass: 'btn-danger',
      btnCloseName: 'Huỷ',
    }).pipe(takeUntil(this.destroyed)).subscribe((res: any) => {
      if (!res?.confirmDelete) return;
      this.doLogout();
    });
  }

  private doLogout(): void {
    this.isLoggingOut = true;
    this.spinner.show();

    this.userManage.logout$()
      .pipe(
        takeUntil(this.destroyed),
        finalize(() => {
          this.isLoggingOut = false;
          this.spinner.hide();
        }),
      )
      .subscribe(() => {
        this.profile = null;
        this.resident = null;
        this.needsLogin = true;
      });
  }

  verificationBadgeLabel(): string {
    const status = this.resident?.verificationStatus;
    return status ? (this.verificationLabel[status] ?? status) : '';
  }
}
