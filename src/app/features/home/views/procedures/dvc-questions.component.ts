import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, finalize, of, switchMap, takeUntil } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppCommonComponent } from '../../../../shared/components/app-common.service';
import { NotifyService } from '../../../../core/services';
import {
  DvcQuestionApiService,
  IReqCreateDvcQuestion,
  IResDvcQuestionPublicItem,
} from '../../../../shared/services/api/dvc-questions/dvc-question-api.service';
import { UserManageService } from '../../../../shared/services/feature-specific/user/user-manage.service';
import { ICustomerProfile } from '../../../../shared/services/api/user/customer-auth-api.service';

@Component({
  selector: 'app-dvc-questions',
  templateUrl: './dvc-questions.component.html',
  styleUrls: ['./dvc-questions.component.scss'],
  standalone: false,
})
export class DvcQuestionsComponent extends AppCommonComponent implements OnInit, OnDestroy {
  form!: FormGroup;

  submitting = false;
  loadingList = false;
  isAuthenticating = false;

  items: IResDvcQuestionPublicItem[] = [];

  constructor(
    private fb: FormBuilder,
    private api: DvcQuestionApiService,
    private notify: NotifyService,
    private userManage: UserManageService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Hỏi đáp dịch vụ công' });

    this.form = this.fb.group({
      question: ['', [Validators.required, Validators.maxLength(2000)]],
    });

    this.loadList();
  }

  ngOnDestroy(): void {
    this.getDestroySubs();
  }

  loadList(): void {
    this.loadingList = true;
    this.api.publicList({ page: 1, pageSize: 20 })
      .pipe(
        takeUntil(this.destroyed),
        finalize(() => (this.loadingList = false)),
      )
      .subscribe({
        next: (res) => (this.items = res?.data?.result ?? []),
        error: () => (this.items = []),
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: IReqCreateDvcQuestion = {
      question: String(this.form.value.question || '').trim(),
    };

    this.submitting = true;

    this.ensureLoggedIn$()
      .pipe(
        takeUntil(this.destroyed),
        switchMap((ok) => (ok ? this.api.create(payload) : of(null))),
        finalize(() => (this.submitting = false)),
      )
      .subscribe({
        next: (res) => {
          if (!res) return; // người dân từ chối xác thực — thông báo đã hiện ở ensureLoggedIn$
          if (res.code !== 1) {
            this.notify.error(res.messages?.[0] || 'Gửi câu hỏi thất bại.');
            return;
          }

          const code = res.data?.code ? ` Mã: ${res.data.code}` : '';
          this.notify.success(`Gửi câu hỏi thành công.${code} Cán bộ xã sẽ trả lời sớm nhất.`);
          this.form.reset({ question: '' });
        },
        error: (err) => this.notify.error(err?.message || 'Gửi câu hỏi thất bại.'),
      });
  }

  trackById(_: number, it: IResDvcQuestionPublicItem): number {
    return it.id;
  }

  private ensureLoggedIn$(): Observable<boolean> {
    if (this.userManage.isLoggedIn()) return of(true);

    this.isAuthenticating = true;
    return this.userManage.login$().pipe(
      map((profile: ICustomerProfile | null) => {
        const ok = this.userManage.isLoggedIn();
        if (!ok) this.notify.info('Vui lòng xác thực số điện thoại để tiếp tục.');
        return ok;
      }),
      finalize(() => (this.isAuthenticating = false)),
    );
  }
}
