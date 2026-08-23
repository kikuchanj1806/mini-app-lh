import {Subject} from 'rxjs';
import {inject, Injectable} from '@angular/core';
import {AppService, NavService, NotifyService, SpinnerService, UserService} from '../../core/services';
import {IFooterConfig, IHeaderConfig} from '../models/global';
import {HeaderFooterFacadeService} from '../services/repository/layout-service/header-footer-facade.service';

/** Base cho các component feature: cung cấp sẵn các service dùng chung + helper set header/footer. */
@Injectable({
  providedIn: "any"
})
export class AppCommonComponent {
  destroyed = new Subject()

  notifyService: NotifyService = inject(NotifyService);
  navService: NavService = inject(NavService);
  userService: UserService = inject(UserService);
  appService: AppService = inject(AppService);
  spinner: SpinnerService = inject(SpinnerService);
  headerFooterFacade = inject(HeaderFooterFacadeService);

  constructor(

  ) {
  }

  getDestroySubs() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  protected setHeader(cfg?: IHeaderConfig): void {
    this.headerFooterFacade.setHeader(cfg);
  }
  protected setFooter(cfg?: IFooterConfig): void {
    this.headerFooterFacade.setFooter(cfg);
  }
}
