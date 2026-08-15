import {Component, OnDestroy, OnInit} from '@angular/core';
import {finalize, of, Subscription, takeUntil, tap} from 'rxjs';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {WeatherService} from '../../../../shared/services/weather.service';
import {createShortcut, openPhone, openWebview} from 'zmp-sdk/apis';
import {NotifyService, UserService} from '../../../../core/services';
import {ZmaShortcutService} from '../../../../shared/services/feature-specific/home/zm-shortcut.service';
import {environment} from '../../../../../environments';
import {NgbOffcanvasOptions} from '@ng-bootstrap/ng-bootstrap';
import {CreateShortcutComponent} from '../../../../shared/components/modals/create-shortcut/create-shortcut.component';
import {OffcanvasCustomService} from '../../../../shared/services/modal-canvas-custom.service';
import {Router} from '@angular/router';
import {FollowOfficialService} from '../../../../shared/services/feature-specific/home/follow-official.service';
import {IResNewsItem, NewApiService} from '../../../../shared/services/api/news/new-api.service';
import {MOCK_NEWS} from '../../../../shared/mock/news-mock.data';
import {IResBanner, IResBannerT} from '../../../../shared/models/api';
import {catchError, map} from 'rxjs/operators';
import {BannerCacheService} from '../../../../shared/models/feature-specific/banner/banner-cache.service';
import {UserApiService} from '../../../../shared/services/api/user/user-api.service';

type HomeAction = {
  key: string;
  label: string;
  sub: string;
  iconClass: string;
  route?: string;
  externalUrl?: string;
  phone?: string;
  categoryId?: number;
};

type HomeFeature = HomeAction & {
  colorClass: string;
};

type UiTool = { key: string; label: string; iconUrl: string; route?: string };
type ExtraService = { key: string; label: string; iconUrl: string; colorClass: string; route?: string };

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: false,
})
export class HomeComponent extends AppCommonComponent implements OnInit, OnDestroy {
  bannerMiddle: IResBanner | null = null;
  slides: IResBannerT[] = [];

  hasFollowed = false;
  private oaId = environment.OAId;

  // UI date
  todayWeekday = '';
  todayDate = '';

  // Weather UI bindings
  locationLabel = 'Long Hưng, Hưng Yên';
  weatherText = '';
  temperatureText = '--°C';
  weatherIconClass = 'wx-cloud';

  stats = {
    population: 0,
    area: '--',
    services: '--',
    satisfaction: '--',
    updatedMonth: ''
  };
  quickActions: HomeAction[] = [
    {
      key: 'news',
      label: 'Tin tức',
      sub: 'mới nhất',
      iconClass: 'fa-regular fa-newspaper',
      route: '/news',
    },
    {
      key: 'schedule',
      label: 'Lịch công tác',
      sub: 'hôm nay',
      iconClass: 'fa-regular fa-calendar-days',
    },
    {
      key: 'service',
      label: 'Dịch vụ công',
      sub: 'trực tuyến',
      iconClass: 'fa-regular fa-desktop',
      externalUrl: 'https://dichvucong.gov.vn/tra-cuu-ho-so',
    },
    {
      key: 'feedback',
      label: 'Phản ánh',
      sub: 'hiện trường',
      iconClass: 'fa-regular fa-camera',
      route: '/feedback',
    },
  ];

  featuredTools: HomeFeature[] = [
    {
      key: 'tthc',
      label: 'Thủ tục hành chính',
      sub: 'Tra cứu, nộp hồ sơ',
      iconClass: 'fa-solid fa-file-circle-check',
      colorClass: 'tile-blue',
      externalUrl: 'https://dichvucong.gov.vn/tra-cuu-ho-so',
    },
    {
      key: 'online',
      label: 'Tra cứu hồ sơ',
      sub: 'Theo dõi tiến độ',
      iconClass: 'fa-solid fa-folder-open',
      colorClass: 'tile-green',
      externalUrl: 'https://dichvucong.gov.vn/tra-cuu-ho-so',
    },
    {
      key: 'feedback',
      label: 'Phản ánh kiến nghị',
      sub: 'Gửi phản ánh',
      iconClass: 'fa-solid fa-comments',
      colorClass: 'tile-orange',
      route: '/feedback',
    },
    {
      key: 'schedule',
      label: 'Lịch công tác',
      sub: 'Theo dõi lịch',
      iconClass: 'fa-solid fa-calendar-check',
      colorClass: 'tile-purple',
    },
    {
      key: 'documents',
      label: 'Văn bản - Công văn',
      sub: 'Tra cứu, tải về',
      iconClass: 'fa-solid fa-file-lines',
      colorClass: 'tile-teal',
      categoryId: 23,
    },
    {
      key: 'qa',
      label: 'Hỏi đáp',
      sub: 'Chatbot hỗ trợ',
      iconClass: 'fa-solid fa-user-group',
      colorClass: 'tile-pink',
      route: '/asked',
    },
    {
      key: 'survey',
      label: 'Khảo sát',
      sub: 'Lấy ý kiến người dân',
      iconClass: 'fa-solid fa-chart-simple',
      colorClass: 'tile-cyan',
      externalUrl: 'https://forms.gle/BPyScAuL13n9da486',
    },
    {
      key: 'map',
      label: 'Bản đồ số',
      sub: 'Cơ sở dữ liệu đất đai',
      iconClass: 'fa-solid fa-location-dot',
      colorClass: 'tile-sky',
      route: '/map',
    },
  ];
  private subs = new Subscription();

  loadingNews = false;
  newsItems: IResNewsItem[] = [];

  constructor(
    private weatherService: WeatherService,
    private followSvc: FollowOfficialService,
    private zmaShortcut: ZmaShortcutService,
    private _notify: NotifyService,
    private offCanvasService: OffcanvasCustomService,
    private route: Router,
    private users: UserService,
    private newsApi: NewApiService,
    private bannerCache: BannerCacheService,
    private userApiService: UserApiService,
  ) {
    super();
  }

  ngOnInit() {
    this.setHeader({variant: 'title', title: '', show: false})
    this.setFooter({
      variant: 'tabs',
      show: true,
      className: 'footer home-footer',
      items: [
        {path: '/', iconClass: 'fa-solid fa-house', label: 'Trang chủ', exact: true},
        {path: '/feedback', iconClass: 'fa-light fa-pen-to-square', label: 'Phản ánh'},
        {path: '__scan_qr__', iconClass: 'fa-solid fa-qrcode', label: 'Quét QR'},
        {path: '/news', iconClass: 'fa-light fa-newspaper', label: 'Tin tức'},
        {path: '__profile__', iconClass: 'fa-light fa-circle-user', label: 'Cá nhân'},
      ],
    });
    this.setToday();
    const wardId = Number(environment.wardId || 0);
    const stored = this.users.userInfoValue ?? this.appService.getUserInfo;
    this.hasFollowed = !!stored?.followedOA;

    this.loadWardStats(wardId);

    this.loadWeather();
    this.loadNews();

    this.loadBannerTop();
    this.loadBannerMiddle();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.getDestroySubs();
  }

  private loadWardStats(wardId: number): void {
    this.userApiService.getWardDetail({ward_id: wardId}).pipe(
      map((res: any) => res?.data ?? null),
      tap((w) => {
        if (!w) return;

        const population = Number(w.population ?? 0);

        const areaKm2 = Number(w.area_km2 ?? 0);
        const areaText = areaKm2 > 0 ? this.formatKm2(areaKm2) : '--';

        const servicesCount = Number(w.services_count ?? 0);
        const servicesText = servicesCount > 0 ? `${servicesCount}+` : '--';

        const avg = Number(w.satisfaction_avg ?? 0);
        const percent = avg > 0 ? Math.round((avg / 5) * 100) : 0;
        const satisfactionText = avg > 0 ? `${percent}%` : '--';

        const updatedAt = Number(w.updated_at ?? 0);
        const updatedMonth = updatedAt ? this.formatMonthYearFromUnix(updatedAt) : '';

        this.stats = {
          population,
          area: areaText,
          services: servicesText,
          satisfaction: satisfactionText,
          updatedMonth
        };
      }),
      catchError(() => of(null)),
      takeUntil(this.destroyed)
    ).subscribe();
  }

  private formatKm2(v: number): string {
    const s = v.toFixed(2).replace('.', ',');
    return `${s} km2`;
  }

  private formatMonthYearFromUnix(unixSeconds: number): string {
    const d = new Date(unixSeconds * 1000);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    return `${m}/${y}`;
  }

  private loadBannerTop(): void {
    // FAKE DATA (demo) — dùng ảnh banner local thay vì gọi API.
    // Khi có API thật, bỏ đoạn dưới và mở lại đoạn gọi BannerCacheService bên dưới.
    this.slides = [{
      id: 0,
      name: '',
      image: '/assets/img/banners/93f5685b-e172-4c80-9941-b2c167bbbc45.png',
      intro: '',
      description: '',
      typeVideo: false,
    }];

    // const wardId = Number(environment.wardId || 0);
    // if (!wardId) return;
    //
    // this.bannerCache.getFirstBannerOnce({
    //   ward_id: wardId,
    //   position_key: 'HOME_TOP',
    // }).pipe(
    //   catchError(() => of(null)),
    //   takeUntil(this.destroyed),
    // ).subscribe((b) => {
    //   const image = b?.image_url ?? '';
    //   this.slides = image
    //     ? [{
    //       id: b!.id,
    //       name: b?.title ?? '',
    //       image,
    //       intro: '',
    //       description: '',
    //       typeVideo: false,
    //     }]
    //     : [];
    // });
  }

  private loadBannerMiddle(): void {
    const wardId = Number(environment.wardId || 0);
    if (!wardId) return;

    this.bannerCache.getFirstBannerOnce({
      ward_id: wardId,
      position_key: 'HOME_MIDDLE',
    }).pipe(
      catchError(() => of(null)),
      takeUntil(this.destroyed),
    ).subscribe((b) => {
      this.bannerMiddle = b;
    });
  }

  async onOpenBanner() {
    const url = this.bannerMiddle?.link_url;
    if (!url) return;

    try {
      await openWebview({
        url,
        config: {
          style: 'normal',
        },
      });
    } catch (e) {
      window.open(url, '_blank');
    }
  }

  getBannerImgUrl(b: IResBanner | null): string {
    if (!b) return '';
    return (b.image_url || b.image || '').trim();
  }

  loadNews() {
    // FAKE DATA (demo) — backend /api/news chưa sẵn sàng.
    // Khi có API thật, bỏ 2 dòng dưới và mở lại đoạn gọi NewApiService bên dưới.
    this.loadingNews = false;
    this.newsItems = MOCK_NEWS.slice(0, 2);

    // const wardId = environment.wardId;
    //
    // this.loadingNews = true;
    // this.newsApi.newsList({
    //   ward_id: wardId,
    //   perPage: 2,
    //   page: 1,
    // })
    //   .pipe(finalize(() => (this.loadingNews = false)))
    //   .subscribe({
    //     next: (res) => {
    //       this.newsItems = res?.data ?? [];
    //     },
    //     error: () => {
    //       this.newsItems = [];
    //     },
    //   });
  }

  async onQuickAction(it: HomeAction): Promise<void> {
    if (it.phone) {
      this.callNow(it.phone);
      return;
    }

    if (it.route) {
      this.route.navigateByUrl(it.route);
      return;
    }

    if (it.externalUrl) {
      await this.openExternalUrl(it.externalUrl);
      return;
    }

    if (it.key === 'schedule') {
      this._notify.info('Lịch công tác đang được cập nhật.');
      return;
    }
  }

  async onFeatureClick(it: HomeFeature): Promise<void> {
    if (it.categoryId) {
      this.route.navigate(['/news'], {queryParams: {categoryId: it.categoryId}});
      return;
    }

    if (it.route) {
      this.route.navigateByUrl(it.route);
      return;
    }

    if (it.externalUrl) {
      await this.openExternalUrl(it.externalUrl);
      return;
    }

    if (it.key === 'schedule') {
      this._notify.info('Lịch công tác đang được cập nhật.');
      return;
    }
  }

  onNotificationTap(): void {
    this._notify.info('Bạn có 3 thông báo mới.');
  }

  private async openExternalUrl(url: string): Promise<void> {
    const isBrowser = typeof (window as any).ZaloMiniAppSDK === 'undefined';
    if (isBrowser) {
      window.open(url, '_blank');
      return;
    }

    try {
      await openWebview({
        url,
        config: {
          style: 'normal',
        },
      });
    } catch (e) {
      window.open(url, '_blank');
    }
  }

  async onToolClick(it: UiTool, ev?: Event) {
    const categoryByKey: Record<string, number> = {
      law: 23,
      security: 24,
      directive: 25,
      culture: 26,
    };

    const categoryId = categoryByKey[it.key];
    if (categoryId) {
      return this.navService.redirect(['/news'], {queryParams: {categoryId}});
    }

    const externalMap: Record<string, string> = {
      survey: 'https://forms.gle/BPyScAuL13n9da486',
      online:
        'https://dichvucong.gov.vn/tra-cuu-ho-so',
      // penalty:
      //   'https://www.csgt.vn/m/tra-cuu-phuong-tien-vi-pham.html',
      // tv:
      //   'https://thhp.vn/truyen-hinh?channel=THPONLINE&typeInapp=1&zarsrc=1303&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo'
    };

    const url = externalMap[it.key];
    if (!url) {
      console.log('tool click', it.key);
      return;
    }

    ev?.preventDefault();
    ev?.stopPropagation();

    const isBrowser = typeof (window as any).ZaloMiniAppSDK === 'undefined';
    if (isBrowser) {
      window.open(url, '_blank');
      return;
    }

    try {
      await openWebview({
        url,
        config: {
          style: 'normal',
        },
      });
    } catch (e) {
      window.open(url, '_blank');
    }
  }

  async onExtraClick(it: ExtraService) {
    if (it.key === 'shortcut') {

      const appId = environment.apiConfig.appId;
      const appName = 'UBND xã Long Hưng';
      const appIcon = 'https://smartzalo.io.vn/assets/img/Quoc_Huy_Viet_Nam_Chuan.png';

      const res = await this.zmaShortcut.createShortcutSafe({
        params: {
          utm_source: 'shortcut',
          utm_medium: 'default',
          utm_campaign: 'default',
        },
        devBypass: false,

        appId,
        appName,
        appIcon,
      });
      //
      // if (!res.ok) {
      //   this._notify.warning(res.message || 'Không thể tạo phím tắt.');
      //   return;
      // }
      //
      // if (res.bypass) {
      //   this._notify.info('[DEV] Đã bypass tạo phím tắt.');
      //   return;
      // }
      //
      // if (res.url) {
      //   window.open(res.url, '_blank');
      //   this._notify.info('Đang mở trang tạo phím tắt. Vui lòng thao tác theo hướng dẫn.');
      //   return;
      // }
      //
      // this._notify.success('Đã gửi yêu cầu tạo phím tắt. Vui lòng xác nhận trên Zalo.');
      // const opts: NgbOffcanvasOptions = {
      //   position: 'bottom',
      //   backdrop: true,
      //   keyboard: true,
      //   scroll: false,
      //   container: 'body',
      //   panelClass: 'offcanvas-bottom-sheet',
      // };
      //
      // const ref = this.offCanvasService.open(CreateShortcutComponent, opts);
      // ref.componentInstance.shortcutUrl = res.url;


      await createShortcut({
        params: {
          utm_source: "shortcut",
        },
      });
    }

    if (it.key === 'faq') {
      this.route.navigate(['/asked'])
    }

    if (it.key === 'rate') {
      this.route.navigate(['/review'])
    }
  }

  onFollowOfficial() {
    if (this.hasFollowed) return;

    this.followSvc.follow$(this.oaId, {
      devBypass: false,
    })
      .pipe(takeUntil(this.destroyed))
      .subscribe((rs) => {
        if (rs === 'already') {
          this.hasFollowed = true;
          this._notify.info('Bạn đã quan tâm kênh này.');
          return;
        }

        if (rs === 'followed') {
          this.hasFollowed = true;
          this._notify.success('Quan tâm thành công!');
          return;
        }

        if (rs === 'bypass') {
          this.hasFollowed = true;
          this._notify.info('[DEV] Đã bypass follow OA.');
          return;
        }

        if (rs === 'denied') {
          this._notify.warning('Bạn đã từ chối quan tâm OA.');
          return;
        }

        this._notify.error('Không thể quan tâm OA. Vui lòng thử lại.');
      });
  }

  onViewAllNews() {
    this.route.navigateByUrl('/news');
  }

  callNow(phone: string) {
    const phoneNumber = phone.replace(/\./g, '').trim();
    openPhone({phoneNumber}).catch(() => {
    });
  }

  private setToday() {
    const d = new Date();
    const weekday = new Intl.DateTimeFormat('vi-VN', {weekday: 'long'}).format(d);
    this.todayWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    this.todayDate = new Intl.DateTimeFormat('vi-VN').format(d);
  }

  private loadWeather() {
    this.subs.add(
      this.weatherService.getCurrentFixed().subscribe({
        next: (res) => {
          // label đã được service set sẵn (Long Hưng, Hưng Yên)
          this.locationLabel = res.label;

          this.temperatureText =
            res.temp == null ? '--°C' : `${res.temp.toFixed(1)}°C`;

          this.weatherText = this.mapWeatherCodeToText(res.code);
          this.weatherIconClass = this.mapWeatherCodeToIconClass(res.code);
        },
        error: () => {
          this.weatherText = 'Không lấy được thời tiết';
          this.temperatureText = '--°C';
          this.weatherIconClass = 'wx-cloud';
          this.locationLabel = 'Long Hưng, Hưng Yên';
        },
      })
    );
  }

  private mapWeatherCodeToText(code: number | null): string {
    // mapping cơ bản theo WMO Weather interpretation codes
    if (code == null) return 'Không xác định';
    if (code === 0) return 'Trời quang';
    if ([1, 2, 3].includes(code)) return 'Mây rải rác';
    if ([45, 48].includes(code)) return 'Sương mù';
    if ([51, 53, 55, 56, 57].includes(code)) return 'Mưa phùn';
    if ([61, 63, 65, 66, 67].includes(code)) return 'Mưa';
    if ([71, 73, 75, 77].includes(code)) return 'Tuyết';
    if ([80, 81, 82].includes(code)) return 'Mưa rào';
    if ([95, 96, 99].includes(code)) return 'Dông';
    return 'Thời tiết thay đổi';
  }

  private mapWeatherCodeToIconClass(code: number | null): string {
    if (code == null) return 'wx-cloud';
    if (code === 0) return 'wx-sun';
    if ([1, 2, 3].includes(code)) return 'wx-cloud';
    if ([45, 48].includes(code)) return 'wx-fog';
    if ([51, 53, 55, 56, 57].includes(code)) return 'wx-drizzle';
    if ([61, 63, 65, 66, 67].includes(code)) return 'wx-rain';
    if ([71, 73, 75, 77].includes(code)) return 'wx-snow';
    if ([80, 81, 82].includes(code)) return 'wx-shower';
    if ([95, 96, 99].includes(code)) return 'wx-thunder';
    return 'wx-cloud';
  }

  trackByNewsId = (_: number, it: IResNewsItem) => it.id;
}
