import { Component, OnDestroy, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs/operators';
import { openWebview } from 'zmp-sdk/apis';
import { AppCommonComponent } from '../../../../shared/components/app-common.service';
import { NotifyService } from '../../../../core/services';
import {
  IResProcedurePublicDetail,
  ProcedureApiService,
} from '../../../../shared/services/api/procedures/procedure-api.service';

@Component({
  selector: 'app-procedure-detail',
  templateUrl: './procedure-detail.component.html',
  styleUrls: ['./procedure-detail.component.scss'],
  standalone: false,
})
export class ProcedureDetailComponent extends AppCommonComponent implements OnInit, OnDestroy {
  loading = false;
  item: IResProcedurePublicDetail | null = null;

  readonly serviceLevelLabel: Record<string, string> = {
    toan_trinh: 'Toàn trình',
    mot_phan: 'Một phần',
  };

  constructor(
    private procedureApi: ProcedureApiService,
    private notify: NotifyService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Chi tiết thủ tục' });

    const id = Number(this.navService.getParam('id') ?? 0);
    if (!id) {
      this.notify.error('Thủ tục không hợp lệ.');
      return;
    }

    this.loading = true;
    this.procedureApi.publicDetail(id)
      .pipe(
        takeUntil(this.destroyed),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: (res) => {
          this.item = res?.data ?? null;
          if (!this.item) this.notify.error('Không tìm thấy thủ tục hành chính.');
        },
        error: () => this.notify.error('Không tải được chi tiết thủ tục hành chính.'),
      });
  }

  ngOnDestroy(): void {
    this.getDestroySubs();
  }

  async onSubmitOnline(): Promise<void> {
    const url = this.item?.onlineUrl;
    if (!url) return;

    const isBrowser = typeof (window as any).ZaloMiniAppSDK === 'undefined';
    if (isBrowser || this.item?.onlineMode === 'browser') {
      window.open(url, '_blank');
      return;
    }

    try {
      await openWebview({ url, config: { style: 'normal' } });
    } catch {
      window.open(url, '_blank');
    }
  }
}
