import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {UserService} from '../../../../core/services';
import {DEFAULT_FOOTER, DEFAULT_HEADER, IFooterConfig, IHeaderConfig} from '../../../models/global';

@Injectable({ providedIn: 'root' })
export class HeaderFooterFacadeService {
  private readonly location = inject(Location);
  private readonly userService = inject(UserService);

  readonly user$ = this.userService.userInfo$;

  private headerSub = new BehaviorSubject<IHeaderConfig | undefined>(undefined);
  private footerSub = new BehaviorSubject<IFooterConfig | undefined>(undefined);

  // Public streams: fallback về default nếu chưa set
  readonly header$: Observable<IHeaderConfig> = this.headerSub.pipe(
    map(v => v ?? DEFAULT_HEADER)
  );

  readonly footer$: Observable<IFooterConfig> = this.footerSub.pipe(
    map(v => v ?? DEFAULT_FOOTER)
  );

  setHeader(cfg?: IHeaderConfig): void {
    this.headerSub.next(cfg);
  }
  getHeader$(): Observable<IHeaderConfig | undefined> {
    return this.headerSub.asObservable();
  }
  getHeaderSnapshot(): IHeaderConfig | undefined {
    return this.headerSub.value;
  }

  setFooter(cfg?: IFooterConfig): void {
    this.footerSub.next(cfg);
  }
  getFooter$(): Observable<IFooterConfig | undefined> {
    return this.footerSub.asObservable();
  }
  getFooterSnapshot(): IFooterConfig | undefined {
    return this.footerSub.value;
  }

  back(): void {
    this.location.back();
  }
}
