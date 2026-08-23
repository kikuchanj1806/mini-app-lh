import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {finalize, Observable, of, takeUntil} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {Router} from '@angular/router';
import {
  FEEDBACK_FIELDS,
  FeedbackApiService,
  IReqCreateFeedback
} from '../../../../shared/services/api/feedbacks/feedback-api.service';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {NotifyService} from '../../../../core/services';
import {environment} from '../../../../../environments';
import {UserManageService} from '../../../../shared/services/feature-specific/user/user-manage.service';
import {ICustomerProfile} from '../../../../shared/services/api/user/customer-auth-api.service';

@Component({
  selector: 'app-feedback',
  templateUrl: 'feedback.component.html',
  styleUrls: ['feedback.component.scss'],
  standalone: false
})
export class FeedbackComponent extends AppCommonComponent implements OnInit, OnDestroy {
  form!: FormGroup;

  loading = false;
  uploading = false;

  readonly fields = FEEDBACK_FIELDS;
  readonly feedbackSubmitEnabled = !!environment.features?.feedbackSubmit;
  previewUrls: string[] = [];
  fileIds: number[] = [];

  /** Đang chạy luồng xác thực SĐT — khoá nút để không bắn 2 lượt đăng nhập. */
  isAuthenticating = false;

  constructor(
    private fb: FormBuilder,
    private api: FeedbackApiService,
    private notify: NotifyService,
    private userManage: UserManageService,
    private router: Router,
  ) {
    super();
  }

  ngOnInit() {
    this.setHeader({variant: 'title', show: true, back: true, title: 'Phản ánh'});

    this.form = this.fb.group({
      field: ['khac', Validators.required],
      title: ['', Validators.required],
      content: ['', Validators.required],
      location: [''],
      citizenName: [''],
      phone: [''],
    });

    // Token còn hạn nhưng app vừa mở lại thì hồ sơ trong RAM rỗng — `profileOrFetch$()` hỏi lại BE
    // thay vì bắt người dân đăng nhập lại chỉ để điền sẵn tên/SĐT.
    this.userManage.profileOrFetch$()
      .pipe(takeUntil(this.destroyed))
      .subscribe((profile) => this.prefill(profile));
  }

  /** Điền sẵn tên/SĐT từ hồ sơ, KHÔNG ghi đè thứ người dân đã tự gõ. */
  private prefill(profile: ICustomerProfile | null): void {
    if (!profile) return;

    const patch: Record<string, string> = {};
    if (!String(this.form.value.citizenName || '').trim() && profile.fullName) {
      patch['citizenName'] = profile.fullName;
    }
    if (!String(this.form.value.phone || '').trim() && profile.phone) {
      patch['phone'] = profile.phone;
    }
    if (Object.keys(patch).length) this.form.patchValue(patch);
  }

  /**
   * Bảo đảm có phiên trước khi gọi endpoint cần token (upload ảnh, gửi phản ánh).
   *
   * Đăng nhập phải khởi từ thao tác thật của người dân nên móc vào đúng hai chỗ này, thay vì chạy
   * ngầm lúc vào màn — người chỉ ghé xem form không bị bung hộp thoại xin quyền.
   */
  private ensureLoggedIn$(): Observable<boolean> {
    if (this.userManage.isLoggedIn()) return of(true);

    this.isAuthenticating = true;
    return this.userManage.login$().pipe(
      map((profile) => {
        const ok = this.userManage.isLoggedIn();
        if (ok) this.prefill(profile);
        else this.notify.info('Vui lòng xác thực số điện thoại để tiếp tục.');
        return ok;
      }),
      finalize(() => (this.isAuthenticating = false)),
    );
  }

  ngOnDestroy() {
    this.getDestroySubs()
  }

  onPickFile(input: HTMLInputElement) {
    input.click();
  }

  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;
    if (!this.feedbackSubmitEnabled) {
      this.notify.info('Tính năng gửi phản ánh đang được hoàn thiện.');
      return;
    }

    // Chọn ảnh xong mới xin xác thực: upload đã là endpoint cần token.
    this.ensureLoggedIn$()
      .pipe(takeUntil(this.destroyed))
      .subscribe((ok) => {
        if (!ok) return;

        for (const file of files) {
          if (this.previewUrls.length >= 5) {
            this.notify.warning('Chỉ được đính kèm tối đa 5 ảnh.');
            break;
          }
          if (!this.validateFile(file)) continue;
          this.previewFile(file);
          this.callUpload(file);
        }
      });
  }

  private callUpload(selectedFile: File) {
    this.uploading = true;

    this.api.upload(selectedFile)
      .pipe(
        takeUntil(this.destroyed),
        finalize(() => (this.uploading = false)),
      )
      .subscribe({
        next: (res) => {
          const id = Number(res?.data?.id ?? 0);
          if (res?.code !== 1 || !id) {
            this.notify.error('Upload ảnh thất bại.');
            return;
          }
          this.fileIds.push(id);
          this.notify.success('Upload ảnh thành công.');
        },
        error: () => {
          this.notify.error('Upload ảnh thất bại.');
        }
      });
  }

  removeImage(index: number): void {
    this.previewUrls.splice(index, 1);
    this.fileIds.splice(index, 1);
  }

  onSubmit() {
    if (!this.feedbackSubmitEnabled) {
      this.notify.info('Tính năng gửi phản ánh đang được hoàn thiện.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: IReqCreateFeedback = {
      field: String(this.form.value.field || 'khac'),
      title: String(this.form.value.title || '').trim(),
      content: String(this.form.value.content || '').trim(),
      location: String(this.form.value.location || '').trim() || undefined,
      citizenName: String(this.form.value.citizenName || '').trim() || undefined,
      phone: String(this.form.value.phone || '').trim() || undefined,
      fileIds: this.fileIds,
    };

    this.loading = true;

    this.ensureLoggedIn$()
      .pipe(
        takeUntil(this.destroyed),
        switchMap((ok) => (ok ? this.api.createFeedback(payload) : of(null))),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (res) => {
          if (!res) return;   // người dân từ chối xác thực — thông báo đã hiện ở ensureLoggedIn$
          if (res.code !== 1) {
            this.notify.error(res.messages?.[0] || 'Gửi phản ánh thất bại.');
            return;
          }

          // Hiện mã phiếu để người dân đối chiếu khi hỏi cán bộ, rồi đưa sang màn theo dõi.
          const code = res.data?.code ? ` Mã phiếu: ${res.data.code}` : '';
          this.notify.success(`Gửi phản ánh thành công.${code}`);

          this.form.reset({ field: 'khac', title: '', content: '', location: '', citizenName: '', phone: '' });
          this.previewUrls = [];
          this.fileIds = [];
          this.prefill(null);

          this.router.navigateByUrl('/feedback/my');
        },
        error: (err) => this.notify.error(err?.message || 'Gửi phản ánh thất bại.'),
      });
  }

  private validateFile(file: File): boolean {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.notify.warning('Chỉ nhận ảnh jpg, png hoặc webp.');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.notify.warning('Ảnh không được vượt quá 5MB.');
      return false;
    }
    return true;
  }

  private previewFile(file: File): void {
    const reader = new FileReader();
    reader.onload = () => this.previewUrls.push(String(reader.result));
    reader.readAsDataURL(file);
  }
}
