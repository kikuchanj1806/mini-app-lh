import { Component, OnDestroy, OnInit } from '@angular/core';
import { finalize, takeUntil } from 'rxjs/operators';
import { openPhone } from 'zmp-sdk/apis';
import { AppCommonComponent } from '../../../../shared/components/app-common.service';
import { NotifyService } from '../../../../core/services';
import { OfficialApiService } from '../../../../shared/services/api/officials/official-api.service';
import { IResOfficialGroup } from '../../../../shared/models/api';

@Component({
  selector: 'app-official-list',
  templateUrl: './official-list.component.html',
  styleUrls: ['./official-list.component.scss'],
  standalone: false,
})
export class OfficialListComponent extends AppCommonComponent implements OnInit, OnDestroy {
  groups: IResOfficialGroup[] = [];
  keyword = '';
  loading = false;

  constructor(
    private officialsApi: OfficialApiService,
    private notify: NotifyService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Danh bạ cán bộ' });
    this.load();
  }

  ngOnDestroy(): void {
    this.getDestroySubs();
  }

  load(): void {
    this.loading = true;

    this.officialsApi.publicList({ keyword: this.keyword.trim() || undefined })
      .pipe(
        takeUntil(this.destroyed),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: (res) => (this.groups = res?.data ?? []),
        error: () => this.notify.error('Không tải được danh bạ cán bộ.'),
      });
  }

  onSearch(): void {
    this.load();
  }

  callNow(phone: string, ev: Event): void {
    ev.stopPropagation();
    openPhone({ phoneNumber: phone.replace(/\./g, '').trim() }).catch(() => {});
  }
}
