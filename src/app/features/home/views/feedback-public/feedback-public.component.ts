import {Component, OnDestroy, OnInit} from '@angular/core';
import {finalize, takeUntil} from 'rxjs/operators';
import {
  FEEDBACK_FIELDS,
  FEEDBACK_STATUS_LABEL,
  FeedbackApiService,
  IFeedbackPublicItem
} from '../../../../shared/services/api/feedbacks/feedback-api.service';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {NotifyService} from '../../../../core/services';
import {openWebview} from 'zmp-sdk/apis';

@Component({
  selector: 'app-feedback-public',
  templateUrl: './feedback-public.component.html',
  styleUrls: ['./feedback-public.component.scss'],
  standalone: false
})
export class FeedbackPublicComponent extends AppCommonComponent implements OnInit, OnDestroy {
  readonly fields = FEEDBACK_FIELDS;
  readonly statusLabel = FEEDBACK_STATUS_LABEL;
  items: IFeedbackPublicItem[] = [];
  selectedField = '';
  loading = false;

  constructor(
    private api: FeedbackApiService,
    private notify: NotifyService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.setHeader({variant: 'title', show: true, back: true, title: 'Phản ánh công khai'});
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.publicList({
      field: this.selectedField || undefined,
      page: 1,
      pageSize: 20,
    })
      .pipe(
        takeUntil(this.destroyed),
        finalize(() => this.loading = false),
      )
      .subscribe({
        next: (res) => this.items = res?.data?.result ?? [],
        error: () => this.notify.error('Không tải được danh sách phản ánh.'),
      });
  }

  onFieldTap(field: string): void {
    this.selectedField = field;
    this.load();
  }

  fieldLabel(field: string): string {
    return this.fields.find((it) => it.value === field)?.label ?? 'Khác';
  }

  imgSrc(it: IFeedbackPublicItem): string {
    return it.coverImageUrl || '/assets/img/tin_tuc_img_default.jpg';
  }

  hasCoordinates(item: IFeedbackPublicItem): boolean {
    return typeof item.latitude === 'number' && typeof item.longitude === 'number';
  }

  openMap(latitude?: number | null, longitude?: number | null): void {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return;
    void openWebview({
      url: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });
  }

  ngOnDestroy(): void {
    this.getDestroySubs();
  }
}
