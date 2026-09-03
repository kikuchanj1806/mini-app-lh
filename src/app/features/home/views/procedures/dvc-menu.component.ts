import { Component, OnDestroy, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { openWebview } from 'zmp-sdk/apis';
import { AppCommonComponent } from '../../../../shared/components/app-common.service';
import { IResMenuItemActive, MenuItemApiService } from '../../../../shared/services/api';

/** Menu "Dịch vụ công" (5 mục) — nguồn từ `menu-items/active(groupKey='public_service')`. */
@Component({
  selector: 'app-dvc-menu',
  templateUrl: './dvc-menu.component.html',
  styleUrls: ['./dvc-menu.component.scss'],
  standalone: false,
})
export class DvcMenuComponent extends AppCommonComponent implements OnInit, OnDestroy {
  items: IResMenuItemActive[] = [];
  loading = false;
  hasError = false;

  constructor(private menuItemApi: MenuItemApiService) {
    super();
  }

  ngOnInit(): void {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Dịch vụ công' });

    this.loading = true;
    this.menuItemApi.active('public_service')
      .pipe(takeUntil(this.destroyed))
      .subscribe({
        next: (res) => {
          this.items = res?.data ?? [];
          this.loading = false;
          this.hasError = false;
        },
        error: () => {
          this.items = [];
          this.loading = false;
          this.hasError = true;
        },
      });
  }

  ngOnDestroy(): void {
    this.getDestroySubs();
  }

  async onItemTap(item: IResMenuItemActive): Promise<void> {
    if (!item.link) return;

    if (item.linkType === 'route') {
      this.navService.redirect([item.link.split('?')[0]], {
        queryParams: this.parseQuery(item.link),
      });
      return;
    }

    if (item.linkType === 'phone') {
      window.location.href = `tel:${item.link}`;
      return;
    }

    const isBrowser = typeof (window as any).ZaloMiniAppSDK === 'undefined';
    if (isBrowser) {
      window.open(item.link, '_blank');
      return;
    }

    try {
      await openWebview({ url: item.link, config: { style: 'normal' } });
    } catch {
      window.open(item.link, '_blank');
    }
  }

  private parseQuery(link: string): Record<string, string> {
    const idx = link.indexOf('?');
    if (idx < 0) return {};

    const params: Record<string, string> = {};
    new URLSearchParams(link.slice(idx + 1)).forEach((value, key) => (params[key] = value));
    return params;
  }
}
