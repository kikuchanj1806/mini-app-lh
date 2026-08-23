import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {finalize, forkJoin, of} from 'rxjs';
import {catchError, map, takeUntil} from 'rxjs/operators';
import {Router} from '@angular/router';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {NotifyService} from '../../../../core/services';
import {UserManageService} from '../../../../shared/services/feature-specific/user/user-manage.service';
import {ResidentApiService} from '../../../../shared/services/api/resident/resident-api.service';
import {ResidentCacheService} from '../../../../shared/services/feature-specific/user/resident-cache.service';
import {
  IReqResidentChangePayload,
  IReqResidentDeclare,
  IResAreaOption,
  IResMyResident,
} from '../../../../shared/models/api';

interface IFlatAreaOption {
  id: number;
  label: string;
  selectable: boolean;
}

/** errorCode nghiệp vụ của nhóm `residents/*` — xem hợp đồng API. */
const RESIDENT_ERROR_MESSAGES: Record<string, string> = {
  RESIDENT_ALREADY_LINKED: 'Hồ sơ này đã được liên kết với tài khoản Zalo khác.',
  NO_CHANGES: 'Bạn chưa thay đổi thông tin nào.',
  EMPTY_CHANGE_REQUEST: 'Không có thông tin cần chỉnh sửa.',
  NOT_FOUND: 'Bạn chưa khai báo thông tin cư trú.',
};

@Component({
  selector: 'app-residence',
  templateUrl: './residence.component.html',
  styleUrls: ['./residence.component.scss'],
  standalone: false,
})
export class ResidenceComponent extends AppCommonComponent implements OnInit, OnDestroy {
  needsLogin = false;
  isLoggingIn = false;
  loading = false;
  isSubmitting = false;

  resident: IResMyResident | null = null;
  areaOptions: IFlatAreaOption[] = [];

  form!: FormGroup;

  /** Hồ sơ đã `verified` mặc định chỉ đọc — người dân phải bấm mới mở form gửi yêu cầu sửa. */
  isEditingVerified = false;

  constructor(
    private fb: FormBuilder,
    private residentApi: ResidentApiService,
    private residentCache: ResidentCacheService,
    private notify: NotifyService,
    private userManage: UserManageService,
    private router: Router,
  ) {
    super();
  }

  ngOnInit(): void {
    this.setHeader({variant: 'title', show: true, back: true, title: 'Thông tin cư trú'});

    this.form = this.fb.group({
      fullName: ['', Validators.required],
      gender: ['other', Validators.required],
      dateOfBirth: [''],
      idCardNo: [''],
      relationshipToHead: [''],
      permanentAddress: [''],
      areaId: [null],
      householdCode: [''],
    });

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
      resident: this.residentCache.myProfileOnce$(),
      areas: this.residentApi.areaOptions().pipe(
        map((res) => res?.data ?? []),
        catchError(() => of([] as IResAreaOption[])),
      ),
    })
      .pipe(takeUntil(this.destroyed), finalize(() => (this.loading = false)))
      .subscribe({
        next: ({resident, areas}) => {
          this.resident = resident;
          this.areaOptions = this.flattenAreas(areas);
          this.isEditingVerified = false;
          this.patchForm(resident);
          this.form.enable();
          if (this.isLocked) this.form.disable();
        },
        error: (err) => this.notify.error(this.errorMessage(err, 'Không tải được thông tin cư trú.')),
      });
  }

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

  onRequestEdit(): void {
    this.isEditingVerified = true;
  }

  onCancelEdit(): void {
    this.isEditingVerified = false;
    this.patchForm(this.resident);
  }

  get isDeclareMode(): boolean {
    return !this.resident;
  }

  get isReadOnly(): boolean {
    return !this.isDeclareMode && this.resident?.verificationStatus === 'verified' && !this.isEditingVerified;
  }

  get isLocked(): boolean {
    return !!this.resident?.pendingChangeRequest;
  }

  genderLabel(g?: string | null): string {
    if (g === 'male') return 'Nam';
    if (g === 'female') return 'Nữ';
    return 'Khác';
  }

  statusLabel(status?: string | null): string {
    if (status === 'verified') return 'Đã xác thực';
    if (status === 'pending') return 'Chờ duyệt';
    if (status === 'rejected') return 'Bị từ chối';
    return status || '';
  }

  onSubmit(): void {
    if (this.isSubmitting || this.isLocked) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isDeclareMode) {
      this.submitDeclare();
    } else {
      this.submitChange();
    }
  }

  private submitDeclare(): void {
    const areaId = Number(this.form.value.areaId);
    if (!areaId) {
      this.notify.warning('Vui lòng chọn địa bàn cư trú.');
      return;
    }

    const payload: IReqResidentDeclare = {
      fullName: String(this.form.value.fullName || '').trim(),
      gender: this.form.value.gender || 'other',
      dateOfBirth: this.form.value.dateOfBirth || null,
      idCardNo: String(this.form.value.idCardNo || '').trim() || null,
      relationshipToHead: String(this.form.value.relationshipToHead || '').trim() || null,
      permanentAddress: String(this.form.value.permanentAddress || '').trim() || null,
      areaId,
      householdCode: String(this.form.value.householdCode || '').trim() || null,
    };

    this.isSubmitting = true;
    this.residentApi.declare(payload)
      .pipe(takeUntil(this.destroyed))
      .subscribe({
        next: (res) => {
          if (res.code !== 1) {
            this.isSubmitting = false;
            this.notify.error(res.messages?.[0] || 'Khai báo thông tin cư trú thất bại.');
            return;
          }
          this.residentCache.invalidate();
          this.notify.success('Khai báo thông tin cư trú thành công, đang chờ cán bộ duyệt.');
          this.router.navigateByUrl('/profile');
        },
        error: (err) => {
          this.isSubmitting = false;
          this.notify.error(this.errorMessage(err, 'Khai báo thông tin cư trú thất bại.'));
        },
      });
  }

  private submitChange(): void {
    const diff = this.buildChangePayload();
    if (!diff) {
      this.notify.info('Bạn chưa thay đổi thông tin nào.');
      return;
    }

    this.isSubmitting = true;
    this.residentApi.requestChange(diff)
      .pipe(takeUntil(this.destroyed))
      .subscribe({
        next: (res) => {
          if (res.code !== 1) {
            this.isSubmitting = false;
            this.notify.error(res.messages?.[0] || 'Gửi yêu cầu chỉnh sửa thất bại.');
            return;
          }
          this.residentCache.invalidate();
          this.notify.success('Đã gửi yêu cầu chỉnh sửa thông tin cư trú.');
          this.router.navigateByUrl('/profile');
        },
        error: (err) => {
          this.isSubmitting = false;
          this.notify.error(this.errorMessage(err, 'Gửi yêu cầu chỉnh sửa thất bại.'));
        },
      });
  }

  /**
   * So với `resident` gốc, chỉ giữ lại khoá thực sự đổi — gửi thừa với hồ sơ `verified` sẽ bị BE
   * trả `NO_CHANGES`, còn với hồ sơ khác sẽ tạo yêu cầu duyệt cho những trường không hề thay đổi.
   */
  private buildChangePayload(): IReqResidentChangePayload | null {
    if (!this.resident) return null;

    const v = this.form.value;
    const payload: IReqResidentChangePayload = {};

    const fullName = String(v.fullName || '').trim();
    if (fullName !== (this.resident.fullName || '')) payload.fullName = fullName;

    const gender = v.gender || 'other';
    if (gender !== this.resident.gender) payload.gender = gender;

    const dateOfBirth = v.dateOfBirth || null;
    if (dateOfBirth !== (this.resident.dateOfBirth || null)) payload.dateOfBirth = dateOfBirth;

    const idCardNo = String(v.idCardNo || '').trim() || null;
    if (idCardNo !== (this.resident.idCardNo || null)) payload.idCardNo = idCardNo;

    const relationshipToHead = String(v.relationshipToHead || '').trim() || null;
    if (relationshipToHead !== (this.resident.relationshipToHead || null)) {
      payload.relationshipToHead = relationshipToHead;
    }

    const permanentAddress = String(v.permanentAddress || '').trim() || null;
    if (permanentAddress !== (this.resident.permanentAddress || null)) payload.permanentAddress = permanentAddress;

    const areaId = v.areaId ? Number(v.areaId) : null;
    if (areaId && areaId !== (this.resident.area?.id ?? null)) payload.areaId = areaId;

    // `my-profile` không trả householdCode nên không có gốc để so sánh — chỉ gửi khi người dân
    // thực sự gõ vào ô này.
    const householdCode = String(v.householdCode || '').trim();
    if (householdCode) payload.householdCode = householdCode;

    return Object.keys(payload).length ? payload : null;
  }

  private patchForm(resident: IResMyResident | null): void {
    this.form.patchValue({
      fullName: resident?.fullName || '',
      gender: resident?.gender || 'other',
      dateOfBirth: resident?.dateOfBirth || '',
      idCardNo: resident?.idCardNo || '',
      relationshipToHead: resident?.relationshipToHead || '',
      permanentAddress: resident?.permanentAddress || '',
      areaId: resident?.area?.id ?? null,
      householdCode: '',
    });
  }

  private flattenAreas(nodes: IResAreaOption[], depth = 0): IFlatAreaOption[] {
    const out: IFlatAreaOption[] = [];
    for (const node of nodes ?? []) {
      const hasChildren = !!node.children?.length;
      out.push({
        id: node.id,
        label: `${'—'.repeat(depth)} ${node.name}`.trim(),
        selectable: !hasChildren,
      });
      if (hasChildren) out.push(...this.flattenAreas(node.children, depth + 1));
    }
    return out;
  }

  private errorMessage(err: any, fallback: string): string {
    const code = err?.errorCode;
    if (code && RESIDENT_ERROR_MESSAGES[code]) return RESIDENT_ERROR_MESSAGES[code];
    return err?.messages?.[0] || err?.message || fallback;
  }
}
