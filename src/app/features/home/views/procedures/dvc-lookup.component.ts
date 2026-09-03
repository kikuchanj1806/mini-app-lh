import { Component, OnDestroy, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { openWebview } from 'zmp-sdk/apis';
import { AppCommonComponent } from '../../../../shared/components/app-common.service';
import { BusinessConfigService } from '../../../../core/services';
import { IResMenuItemActive, MenuItemApiService } from '../../../../shared/services/api';

/** Portal tra cứu hồ sơ mini app không tự làm — chỉ điều hướng ra cổng dịch vụ công chính thức. */
@Component({
  selector: 'app-dvc-lookup',
  templateUrl: './dvc-lookup.component.html',
  styleUrls: ['./dvc-lookup.component.scss'],
  standalone: false,
})
export class DvcLookupComponent extends AppCommonComponent implements OnInit, OnDestroy {
  portals: IResMenuItemActive[] = [];
  loading = false;

  constructor(
    private menuItemApi: MenuItemApiService,
    public businessConfig: BusinessConfigService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Tra cứu hồ sơ' });

    this.loading = true;
    this.menuItemApi.active('dvc_lookup')
      .pipe(takeUntil(this.destroyed))
      .subscribe({
        next: (res) => {
          this.portals = res?.data ?? [];
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
  }

  ngOnDestroy(): void {
    this.getDestroySubs();
  }

  async onPortalTap(portal: IResMenuItemActive): Promise<void> {
    if (!portal.link) return;

    if (portal.linkType === 'route') {
      this.navService.redirect([portal.link]);
      return;
    }

    if (portal.linkType === 'phone') {
      window.location.href = `tel:${portal.link}`;
      return;
    }

    const isBrowser = typeof (window as any).ZaloMiniAppSDK === 'undefined';
    if (isBrowser) {
      window.open(portal.link, '_blank');
      return;
    }

    try {
      await openWebview({ url: portal.link, config: { style: 'normal' } });
    } catch {
      window.open(portal.link, '_blank');
    }
  }
}
