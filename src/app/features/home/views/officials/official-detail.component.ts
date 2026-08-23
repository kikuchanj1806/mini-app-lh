import { Component, OnDestroy, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs/operators';
import { openPhone } from 'zmp-sdk/apis';
import { AppCommonComponent } from '../../../../shared/components/app-common.service';
import { NotifyService } from '../../../../core/services';
import { OfficialApiService } from '../../../../shared/services/api/officials/official-api.service';
import { IResOfficialPublicDetail } from '../../../../shared/models/api';

@Component({
  selector: 'app-official-detail',
  templateUrl: './official-detail.component.html',
  styleUrls: ['./official-detail.component.scss'],
  standalone: false,
})
export class OfficialDetailComponent extends AppCommonComponent implements OnInit, OnDestroy {
  loading = false;
  item: IResOfficialPublicDetail | null = null;

  constructor(
    private officialsApi: OfficialApiService,
    private notify: NotifyService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Thông tin cán bộ' });

    const id = Number(this.navService.getParam('id') ?? 0);
    if (!id) {
      this.notify.error('Không tìm thấy cán bộ.');
      return;
    }

    this.loading = true;
    this.officialsApi.publicDetail(id)
      .pipe(
        takeUntil(this.destroyed),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: (res) => {
          this.item = res?.data ?? null;
          if (!this.item) this.notify.error('Không tìm thấy cán bộ.');
        },
        error: () => this.notify.error('Không tải được thông tin cán bộ.'),
      });
  }

  ngOnDestroy(): void {
    this.getDestroySubs();
  }

  callNow(phone: string): void {
    openPhone({ phoneNumber: phone.replace(/\./g, '').trim() }).catch(() => {});
  }
}
