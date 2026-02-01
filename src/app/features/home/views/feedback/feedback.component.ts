import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';

@Component({
  selector: 'app-feedback',
  templateUrl: 'feedback.component.html',
  styleUrls: ['feedback.component.scss'],
  standalone: false
})
export class FeedbackComponent extends AppCommonComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  previewUrl: string | null = null;

  constructor(private fb: FormBuilder) {
    super();
  }

  ngOnInit() {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Phản ánh' });

    this.form = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      file: [null],
    });
  }

  onPickFile(input: HTMLInputElement) {
    input.click();
  }

  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.form.patchValue({ file });

    if (file) {
      const reader = new FileReader();
      reader.onload = () => (this.previewUrl = String(reader.result));
      reader.readAsDataURL(file);
    } else {
      this.previewUrl = null;
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    console.log('Submit feedback:', this.form.value);
  }

  ngOnDestroy() {
    this.getDestroySubs();
  }
}
