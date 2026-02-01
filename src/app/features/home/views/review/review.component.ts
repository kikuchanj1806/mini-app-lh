import {Component, OnDestroy, OnInit} from '@angular/core';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';

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

  ngOnInit() {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Đánh giá dịch vụ' });
  }

  ngOnDestroy() {
    this.getDestroySubs();
  }

  setRate(v: number) {
    this.rating = v;
  }

  setHover(v: number) {
    this.hoverRating = v;
  }

  clearHover() {
    this.hoverRating = 0;
  }

  submit() {
    // UI demo
    if (!this.rating) return;
    console.log('submit review', { rating: this.rating, comment: this.comment });
  }

  get displayRate(): number {
    return this.hoverRating || this.rating;
  }

  trackByIdx = (i: number) => i;
}
