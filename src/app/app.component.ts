import {AfterViewInit, Component, inject, OnInit, ViewEncapsulation} from "@angular/core";
import {NavigationEnd, Router} from "@angular/router";
import {catchError, filter, of} from "rxjs";
import {AppUrlService} from './core/services/app-url.service';
import {isAndroid} from './core/utils/app.utils';
import {MiniappApiService} from './shared/services/api/miniapp/miniapp-api.service';


@Component({
  selector: '[id=app]',
  template: `<router-outlet></router-outlet>`,
  standalone: false,
  styles: [`
    :host { display: block; height: 100%; }
  `],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'fashion-app-1';
  private miniappApi = inject(MiniappApiService);

  constructor(
    private router: Router,
    private urlSvc: AppUrlService
  ) {}

  ngOnInit() {
    this.trackVisit();
    this.router.events.pipe(
      filter((evt): evt is NavigationEnd => evt instanceof NavigationEnd)
    ).subscribe(evt => {
      console.log('Navigated to:', evt.urlAfterRedirects);
      this.urlSvc.recomputeBaseFrom(location.href);
    });

    // Nếu Android, cộng thêm 6px
    document.documentElement.style.setProperty(
      '--zaui-safe-extra-top',
      isAndroid() ? '6px' : '0px'
    );
  }

  ngAfterViewInit(): void {
    // Chỉ dùng để debug local, tuyệt đối không commit code debug này
    const top = this.readCssVar('--zaui-safe-area-inset-top');
    const bottom = this.readCssVar('--zaui-safe-area-inset-bottom');
    console.log({ top, bottom });
    window.addEventListener('resize', () => {
      console.log({
        top: this.readCssVar('--zaui-safe-area-inset-top'),
        bottom: this.readCssVar('--zaui-safe-area-inset-bottom'),
      });
    });
  }

  /**
   * Đếm lượt mở mini app — fire-and-forget, một lần mỗi phiên. Lỗi ở đây tuyệt đối không được nổi
   * lên UI: đây là số liệu thống kê, không phải chức năng người dân đang chờ.
   */
  private trackVisit(): void {
    this.miniappApi.trackVisit()
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  private readCssVar(name: string): string {
    const probe = document.createElement('div');
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.paddingTop = `var(${name})`;
    document.body.appendChild(probe);
    const px = getComputedStyle(probe).paddingTop;
    probe.remove();
    return px;
  }
}
