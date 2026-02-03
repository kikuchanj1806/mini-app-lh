import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {filter, finalize, of, switchMap, takeUntil} from 'rxjs';
import {
  FeedbackApiService,
  IReqCreateFeedback, IResFeedbackItem,
  IResUpload
} from '../../../../shared/services/api/feedbacks/feedback-api.service';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {NotifyService} from '../../../../core/services';
import {environment} from '../../../../../environments';
import {IResponseApi} from '../../../../core/models';
import {HttpEventType, HttpResponse} from '@angular/common/http';
import {map} from 'rxjs/operators';

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

  previewUrl: string | null = null;

  imagePath: string | null = null;

  constructor(
    private fb: FormBuilder,
    private api: FeedbackApiService,
    private notify: NotifyService,
  ) {
    super();
  }

  ngOnInit() {
    this.setHeader({variant: 'title', show: true, back: true, title: 'Phản ánh'});

    this.form = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
    });
  }

  ngOnDestroy() {
    this.getDestroySubs()
  }

  onPickFile(input: HTMLInputElement) {
    input.click();
  }

  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;

    // preview
    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = String(reader.result));
    reader.readAsDataURL(file);

    // upload riêng
    this.callUpload(file);
  }

  private callUpload(selectedFile: File) {
    const wardId = Number(environment.wardId || 0);
    if (!wardId) {
      this.notify.error('Thiếu ward_id.');
      return;
    }

    this.uploading = true;
    this.imagePath = null;

    const fData = new FormData();
    fData.append('name', selectedFile.name);
    fData.append('file', selectedFile); // ✅ quan trọng
    fData.append('file_type', (selectedFile.type.split('/').pop() || 'jpeg')); // jpeg/png...
    fData.append('type', '1');
    fData.append('psName', 's');
    fData.append('itemName', 's');
    fData.append('ward_id', String(wardId)); // ✅ chỉ dùng ward_id (đúng theo BE bạn yêu cầu)

    this.api.uploadFile(fData)
      .pipe(
        takeUntil(this.destroyed),
        finalize(() => (this.uploading = false)),
        filter((e) => e.type === HttpEventType.Response),
        map((e) => (e as HttpResponse<IResUpload>).body),
      )
      .subscribe({
        next: (res) => {
          if (!res || res.status !== 'success' || !res.path) {
            this.notify.error('Upload ảnh thất bại.');
            this.imagePath = null;
            return;
          }
          this.imagePath = res.path;
          this.notify.success('Upload ảnh thành công.');
        },
        error: () => {
          this.notify.error('Upload ảnh thất bại.');
          this.imagePath = null;
        }
      });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const wardId = Number(environment.wardId || 0);
    if (!wardId) {
      this.notify.error('Thiếu ward_id.');
      return;
    }

    // nếu bạn muốn bắt buộc ảnh thì check ở đây
    // if (!this.imagePath) { this.notify.error('Vui lòng upload ảnh trước.'); return; }

    const payload: IReqCreateFeedback = {
      ward_id: wardId,
      title: String(this.form.value.title || '').trim(),
      content: String(this.form.value.content || '').trim(),
      image: this.imagePath, // ✅ path đã có từ bước upload
    };

    this.loading = true;

    this.api.createFeedback(payload)
      .pipe(
        takeUntil(this.destroyed),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (res) => {
          if (res?.status !== 'success') {
            this.notify.error(res?.message || 'Gửi phản ánh thất bại.');
            return;
          }
          this.notify.success('Gửi phản ánh thành công.');

          // reset
          this.form.reset({ title: '', content: '' });
          this.previewUrl = null;
          this.imagePath = null;
        },
        error: () => this.notify.error('Gửi phản ánh thất bại.'),
      });
  }
}
