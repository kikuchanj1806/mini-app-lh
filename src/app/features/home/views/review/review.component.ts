import { showToast } from 'zmp-sdk/apis';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {Component, OnDestroy, OnInit} from '@angular/core';

@Component({
  selector: 'app-review',
  templateUrl: 'review.component.html',
  styleUrls: ['review.component.scss'],
  standalone: false
})
export class ReviewComponent extends AppCommonComponent implements OnInit, OnDestroy {
  rating = 0;
  hoverRating = 0;
  comment = '';

  submitting = false;
  showSuccess = false;

  ngOnInit() {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Đánh giá dịch vụ' });
  }

  ngOnDestroy() {
    this.getDestroySubs();
  }

  setRate(v: number) { this.rating = v; }
  setHover(v: number) { this.hoverRating = v; }
  clearHover() { this.hoverRating = 0; }

  submit() {
    if (!this.rating || this.submitting) return;

    this.submitting = true;

    // fake API delay
    setTimeout(() => {
      console.log('submit review', { rating: this.rating, comment: this.comment });

      this.submitting = false;

      showToast({ message: 'Gửi đánh giá thành công!' });
      this.showSuccess = true;

      this.rating = 0;
      this.hoverRating = 0;
      this.comment = '';
    }, 700);
  }

  closeSuccess(): void {
    this.showSuccess = false;
  }

  get displayRate(): number {
    return this.hoverRating || this.rating;
  }

  trackByIdx = (i: number) => i;
}
