import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {finalize, Observable, of, takeUntil} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {Router} from '@angular/router';
import {openWebview} from 'zmp-sdk/apis';
import {
  FEEDBACK_FIELDS,
  FeedbackApiService,
  IReqCreateFeedback
} from '../../../../shared/services/api/feedbacks/feedback-api.service';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {NotifyService, ZmpService} from '../../../../core/services';
import {environment} from '../../../../../environments';
import {UserManageService} from '../../../../shared/services/feature-specific/user/user-manage.service';
import {ICustomerProfile} from '../../../../shared/services/api/user/customer-auth-api.service';

interface IFeedbackAttachment {
  localId: number;
  previewUrl: string | null;
  fileId: number | null;
  status: 'reading' | 'uploading' | 'done' | 'error';
}

@Component({
  selector: 'app-feedback',
  templateUrl: 'feedback.component.html',
  styleUrls: ['feedback.component.scss'],
  standalone: false
})
export class FeedbackComponent extends AppCommonComponent implements OnInit, OnDestroy {
  form!: FormGroup;

  loading = false;
  locating = false;
  resolvingLink = false;
  showMapLinkInput = false;
  mapLinkDraft = '';

  readonly fields = FEEDBACK_FIELDS;
  readonly feedbackSubmitEnabled = !!environment.features?.feedbackSubmit;
  attachments: IFeedbackAttachment[] = [];
  private nextAttachmentId = 1;

  /** Đang chạy luồng xác thực SĐT — khoá nút để không bắn 2 lượt đăng nhập. */
  isAuthenticating = false;

  constructor(
    private fb: FormBuilder,
    private api: FeedbackApiService,
    private notify: NotifyService,
    private zmp: ZmpService,
    private userManage: UserManageService,
    private router: Router,
  ) {
    super();
  }

  ngOnInit() {
    this.setHeader({variant: 'title', show: true, back: true, title: 'Phản ánh'});

    this.form = this.fb.group({
      field: ['khac', Validators.required],
      title: ['', [Validators.required, Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.maxLength(5000)]],
      location: ['', Validators.maxLength(255)],
      latitude: [null as number | null],
      longitude: [null as number | null],
      mapUrl: [null as string | null],
      citizenName: [''],
      phone: ['', Validators.maxLength(20)],
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

  get uploading(): boolean {
    return this.attachments.some((attachment) =>
      attachment.status === 'reading' || attachment.status === 'uploading'
    );
  }

  get attachedCount(): number {
    return this.attachments.filter((attachment) => attachment.status === 'done').length;
  }

  get hasCoordinates(): boolean {
    return typeof this.form?.value.latitude === 'number' && typeof this.form?.value.longitude === 'number';
  }

  get coordinateLabel(): string {
    if (!this.hasCoordinates) return '';
    return `${Number(this.form.value.latitude).toFixed(4)}, ${Number(this.form.value.longitude).toFixed(4)}`;
  }

  onUseCurrentLocation(): void {
    if (this.locating) return;
    this.locating = true;

    this.ensureLoggedIn$()
      .pipe(
        switchMap((loggedIn) => {
          if (!loggedIn) return of(null);

          return this.userManage.authorizeScopes$(['scope.userLocation']).pipe(
            switchMap((permissions) => {
              if (!permissions['scope.userLocation']) {
                this.notify.info('Bạn chưa cho phép chia sẻ vị trí.');
                return of(null);
              }

              return this.zmp.getLocationToken$().pipe(
                switchMap((locationToken) => {
                  if (!locationToken) {
                    this.notify.info('Chức năng này chỉ hoạt động khi mở mini app trong ứng dụng Zalo.');
                    return of(null);
                  }

                  return this.zmp.getAccessToken$().pipe(
                    switchMap((accessToken) => this.api.resolveLocation(String(accessToken || ''), locationToken)),
                  );
                }),
              );
            }),
          );
        }),
        takeUntil(this.destroyed),
        finalize(() => (this.locating = false)),
      )
      .subscribe({
        next: (res) => {
          if (!res) return;
          if (res.code !== 1 || typeof res.data?.latitude !== 'number' || typeof res.data?.longitude !== 'number') {
            this.notify.error(res.messages?.[0] || 'Không lấy được vị trí hiện tại.');
            return;
          }

          this.form.patchValue({
            latitude: res.data.latitude,
            longitude: res.data.longitude,
            mapUrl: null,
          });
          this.mapLinkDraft = '';
          this.showMapLinkInput = false;
          this.notify.success('Đã đính kèm vị trí hiện tại.');
        },
        error: (error) => this.notify.error(this.apiErrorMessage(error, 'Không lấy được vị trí hiện tại.')),
      });
  }

  onShowMapLinkInput(): void {
    this.showMapLinkInput = true;
  }

  onMapLinkDraftChange(value: string): void {
    this.mapLinkDraft = value;
    const verifiedUrl = String(this.form.value.mapUrl || '');
    if (verifiedUrl && value !== verifiedUrl) {
      this.form.patchValue({latitude: null, longitude: null, mapUrl: null});
    }
  }

  onResolveMapLink(): void {
    const url = this.mapLinkDraft.trim();
    if (!url) {
      this.notify.info('Vui lòng dán link Google Maps.');
      return;
    }
    if (this.resolvingLink) return;

    this.resolvingLink = true;
    this.ensureLoggedIn$()
      .pipe(
        switchMap((loggedIn) => (loggedIn ? this.api.resolveMapLink(url) : of(null))),
        takeUntil(this.destroyed),
        finalize(() => (this.resolvingLink = false)),
      )
      .subscribe({
        next: (res) => {
          if (!res) return;
          if (res.code !== 1 || typeof res.data?.latitude !== 'number' || typeof res.data?.longitude !== 'number') {
            this.notify.error(res.messages?.[0] || 'Không đọc được toạ độ từ link này.');
            return;
          }

          this.mapLinkDraft = url;
          this.form.patchValue({
            latitude: res.data.latitude,
            longitude: res.data.longitude,
            mapUrl: url,
          });
          this.notify.success('Đã đính kèm vị trí từ Google Maps.');
        },
        error: (error) => this.notify.error(this.apiErrorMessage(error, 'Không đọc được toạ độ từ link này.')),
      });
  }

  openMap(): void {
    if (!this.hasCoordinates) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${this.form.value.latitude},${this.form.value.longitude}`;
    void openWebview({url});
  }

  removeLocation(): void {
    this.form.patchValue({latitude: null, longitude: null, mapUrl: null});
    this.mapLinkDraft = '';
    this.showMapLinkInput = false;
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
          if (this.attachments.length >= 5) {
            this.notify.warning('Chỉ được đính kèm tối đa 5 ảnh.');
            break;
          }
          if (!this.validateFile(file)) continue;

          const attachment: IFeedbackAttachment = {
            localId: this.nextAttachmentId++,
            previewUrl: null,
            fileId: null,
            status: 'reading',
          };
          this.attachments.push(attachment);
          this.previewFile(file, attachment.localId);
        }
      });
  }

  private callUpload(selectedFile: File, localId: number): void {
    this.updateAttachment(localId, {status: 'uploading'});
    this.api.upload(selectedFile)
      .pipe(takeUntil(this.destroyed))
      .subscribe({
        next: (res) => {
          const id = Number(res?.data?.id ?? 0);
          if (res?.code !== 1 || !id) {
            this.removeFailedAttachment(localId, selectedFile.name);
            return;
          }
          this.updateAttachment(localId, {fileId: id, status: 'done'});
        },
        error: () => {
          this.removeFailedAttachment(localId, selectedFile.name);
        }
      });
  }

  removeImage(localId: number): void {
    this.attachments = this.attachments.filter((attachment) => attachment.localId !== localId);
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
      latitude: typeof this.form.value.latitude === 'number' ? this.form.value.latitude : undefined,
      longitude: typeof this.form.value.longitude === 'number' ? this.form.value.longitude : undefined,
      mapUrl: String(this.form.value.mapUrl || '').trim() || undefined,
      citizenName: String(this.form.value.citizenName || '').trim() || undefined,
      phone: String(this.form.value.phone || '').trim() || undefined,
      fileIds: this.attachments
        .filter((attachment) => attachment.fileId)
        .map((attachment) => attachment.fileId!),
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

          this.form.reset({
            field: 'khac',
            title: '',
            content: '',
            location: '',
            latitude: null,
            longitude: null,
            mapUrl: null,
            citizenName: '',
            phone: '',
          });
          this.attachments = [];
          this.mapLinkDraft = '';
          this.showMapLinkInput = false;
          this.userManage.profileOrFetch$()
            .pipe(takeUntil(this.destroyed))
            .subscribe((profile) => this.prefill(profile));

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

  private previewFile(file: File, localId: number): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.updateAttachment(localId, {previewUrl: String(reader.result)});
      this.callUpload(file, localId);
    };
    reader.onerror = () => this.removeFailedAttachment(localId, file.name);
    reader.readAsDataURL(file);
  }

  private updateAttachment(localId: number, patch: Partial<IFeedbackAttachment>): void {
    const attachment = this.attachments.find((item) => item.localId === localId);
    if (attachment) Object.assign(attachment, patch);
  }

  private removeFailedAttachment(localId: number, fileName: string): void {
    this.updateAttachment(localId, {status: 'error'});
    this.attachments = this.attachments.filter((attachment) => attachment.localId !== localId);
    this.notify.error(`Upload ảnh "${fileName}" thất bại.`);
  }

  private apiErrorMessage(error: any, fallback: string): string {
    return error?.messages?.[0] || error?.message || fallback;
  }
}
