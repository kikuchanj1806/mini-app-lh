import {Component, OnDestroy, OnInit} from '@angular/core';
import {finalize, Observable, of, Subscription, takeUntil} from 'rxjs';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {WeatherService} from '../../../../shared/services/weather.service';
import {openPhone, openWebview} from 'zmp-sdk/apis';
import {NotifyService, UserService} from '../../../../core/services';
import {ZmaShortcutService} from '../../../../shared/services/feature-specific/home/zm-shortcut.service';
import {environment} from '../../../../../environments';
import {NgbOffcanvasOptions} from '@ng-bootstrap/ng-bootstrap';
import {CreateShortcutComponent} from '../../../../shared/components/modals/create-shortcut/create-shortcut.component';
import {OffcanvasCustomService} from '../../../../shared/services/modal-canvas-custom.service';
import {Router} from '@angular/router';
import {FollowOfficialService} from '../../../../shared/services/feature-specific/home/follow-official.service';
import {IResNewsItem, NewApiService} from '../../../../shared/services/api/news/new-api.service';
import {BannerApiService} from '../../../../shared/services/api/banners/banner-api.service';
import {BannerPositionKey, IResBanner, IResBannerT} from '../../../../shared/models/api';
import {catchError, map, shareReplay} from 'rxjs/operators';
import {BannerCacheService} from '../../../../shared/models/feature-specific/banner/banner-cache.service';

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
  locationLabel = 'Trường Tân, Hải Phòng';
  weatherText = '';
  temperatureText = '--°C';
  weatherIconClass = 'wx-cloud';

  stats = {
    population: 31736,
    area: '24,56 km2',
    services: '25+',
    satisfaction: '98%',
    updatedMonth: '1/2026'
  };
  mainTools: UiTool[] = [
    {
      key: 'calendar',
      label: 'Đăng ký lịch làm việc',
      iconUrl: '/assets/img/icons/lich_lam_viec.png',
      route: 'bookappointment'
    },
    {key: 'map', label: 'Bản đồ', iconUrl: '/assets/img/icons/maps_icon.png', route: 'map'},
    {key: 'law', label: 'Thư viện pháp luật', iconUrl: '/assets/img/icons/phap_luat.png'},
    {key: 'security', label: 'Tin tức an ninh', iconUrl: '/assets/img/icons/news-paper.png'},

    {key: 'directive', label: 'Tin chỉ đạo - điều hành', iconUrl: '/assets/img/icons/canh_bao.png'},
    {key: 'culture', label: 'Văn hóa – Xã hội – Du lịch', iconUrl: '/assets/img/icons/du_lich.png'},
    {key: 'feedback', label: 'Phản ánh', iconUrl: '/assets/img/icons/phan_hoi.png', route: 'feedback'},
    {key: 'online', label: 'Công dịch vụ công trực tuyến', iconUrl: '/assets/img/icons/dich_vu_cong.png'},

    {key: 'quiz', label: 'Trắc nghiệm pháp luật', iconUrl: '/assets/img/icons/testing.png'},
    {key: 'penalty', label: 'Tra cứu phạt nguội', iconUrl: '/assets/img/icons/smart-car.png'},
    {key: 'tv', label: 'Truyền hình Hải Phòng', iconUrl: '/assets/img/icons/radio.png'},
    {key: 'video', label: 'Video hướng dẫn', iconUrl: '/assets/img/icons/video.png'},
  ];
  extraServices: ExtraService[] = [
    {key: 'rate', label: 'Đánh giá', iconUrl: '/assets/img/icons/danh_gia.png', colorClass: 'extra-red'},
    {key: 'qa', label: 'Hỏi đáp', iconUrl: '/assets/img/icons/cau_hoi.png', colorClass: 'extra-blue'},
    {key: 'faq', label: 'Câu hỏi thường gặp', iconUrl: '/assets/img/icons/q&a.png', colorClass: 'extra-green'},
    {key: 'shortcut', label: 'Tạo phím tắt', iconUrl: '/assets/img/icons/phim_tat.png', colorClass: 'extra-purple'},
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
    private bannerApi: BannerApiService,
    private bannerCache: BannerCacheService,
  ) {
    super();
  }

  ngOnInit() {
    this.setHeader({variant: 'title', title: '', show: false})
    this.setToday();

    const stored = this.users.userInfoValue ?? this.appService.getUserInfo;
    this.hasFollowed = !!stored?.followedOA;

    this.loadWeather();
    this.loadNews();

    this.loadBannerTop();
    this.loadBannerMiddle();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.getDestroySubs();
  }

  private loadBannerTop(): void {
    const wardId = Number(environment.wardId || 0);
    if (!wardId) return;

    this.bannerCache.getFirstBannerOnce({
      ward_id: wardId,
      position_key: 'HOME_TOP',
    }).pipe(
      catchError(() => of(null)),
      takeUntil(this.destroyed),
    ).subscribe((b) => {
      const image = b?.image_url ?? '';
      this.slides = image
        ? [{
          id: b!.id,
          name: b?.title ?? '',
          image,
          intro: '',
          description: '',
          typeVideo: false,
        }]
        : [];
    });
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
    const wardId = environment.wardId;

    this.loadingNews = true;
    this.newsApi.newsList({
      ward_id: wardId,
      perPage: 2,
      page: 1,
    })
      .pipe(finalize(() => (this.loadingNews = false)))
      .subscribe({
        next: (res) => {
          this.newsItems = res?.data ?? [];
        },
        error: () => {
          this.newsItems = [];
        },
      });
  }

  async onToolClick(it: UiTool, ev?: Event) {
    const categoryByKey: Record<string, number> = {
      law: 14,
      security: 15,
      directive: 16,
      culture: 17,
    };

    const categoryId = categoryByKey[it.key];
    if (categoryId) {
      return this.navService.redirect(['/news'], { queryParams: { categoryId } });
    }

    const externalMap: Record<string, string> = {
      online:
        'https://dichvucong.gov.vn/p/home/dvc-dich-vu-cong-truc-tuyen-ds.html?pCoQuanId=387628&typeInapp=1',
      penalty:
        'https://www.csgt.vn/m/tra-cuu-phuong-tien-vi-pham.html',
      tv:
        'https://thhp.vn/truyen-hinh?channel=THPONLINE&typeInapp=1&zarsrc=1303&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo'
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
      const appName = 'UBND xã Trường Tân';
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
      const opts: NgbOffcanvasOptions = {
        position: 'bottom',
        backdrop: true,
        keyboard: true,
        scroll: false,
        container: 'body',
        panelClass: 'offcanvas-bottom-sheet',
      };

      const ref = this.offCanvasService.open(CreateShortcutComponent, opts);
      ref.componentInstance.shortcutUrl = res.url;
    }

    if (it.key === 'faq') {
      this.route.navigate(['/asked'])
    }

    if (it.key === 'rate') {
      this.route.navigate(['/review'])
    }
  }

  onHotline() {
    console.log('Call hotline');
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

  onQuickNotify() {
    console.log('Quick notify');
  }

  onUpdate247() {
    console.log('Update 24/7');
  }

  onViewAllNews() {
    console.log('View all news');
  }

  onOpenNews(item: any) {
    if (!item?.id) return;
    // route tuỳ bạn: /news/:id
    this.route.navigate(['news', item.id]);
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
          // label đã được service set sẵn (Trường Tân, Hải Phòng)
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
          this.locationLabel = 'Trường Tân, Hải Phòng';
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
