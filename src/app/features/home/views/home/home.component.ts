import {Component, OnDestroy, OnInit} from '@angular/core';
import {of, Subscription, takeUntil} from 'rxjs';
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
import {IResBanner, IResBannerT} from '../../../../shared/models/api';
import {catchError, finalize, map} from 'rxjs/operators';
import {BannerCacheService} from '../../../../shared/models/feature-specific/banner/banner-cache.service';
import {IResPostListItem} from '../../../../shared/models/api';
import {IResMenuItemActive} from '../../../../shared/services/api';
import {MenuItemCacheService} from '../../../../shared/services/feature-specific/home/menu-item-cache.service';
import {NewsCacheService} from '../../../../shared/services/feature-specific/home/news-cache.service';
import {BusinessConfigService} from '../../../../core/services';

/**
 * Ô tiện ích trang chủ — LUÔN đến từ `menu-items/active`, không còn danh sách mặc định viết cứng
 * trong code. Đích đến đã được BE resolve sẵn thành `linkType` + `link`.
 */
type HomeAction = {
  key: string;
  label: string;
  sub: string;
  iconClass: string;
  iconUrl?: string | null;
  linkType: IResMenuItemActive['linkType'];
  link?: string | null;
  ref?: IResMenuItemActive['ref'];
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
  isFollowingOA = false;
  /** OA id lấy từ business-config (mỗi xã một OA); `environment.OAId` chỉ là dự phòng. */
  private get oaId(): string { return this.businessConfig.zaloOaId; }
  get oaDisplayName(): string { return this.businessConfig.businessName || 'Chính quyền số'; }

  todayWeekday = '';
  todayDate = '';

  locationLabel = '';
  weatherText = 'Mây rải rác';
  temperatureText = '25.6°C';
  weatherIconClass = 'wx-cloud';

  // Nội dung do admin xã nhập (site_settings) — một bản build dùng chung cho mọi xã, KHÔNG viết
  // cứng tên xã/tỉnh/hotline ở đây. Chưa cấu hình thì ẩn phần tương ứng.
  get heroEyebrow(): string { return this.businessConfig.setting('home_hero_eyebrow'); }
  get heroTitle(): string { return this.businessConfig.setting('home_hero_title') || this.businessConfig.businessName; }
  get heroSubtitle(): string { return this.businessConfig.setting('home_hero_subtitle'); }
  get welcomeTitle(): string { return this.businessConfig.setting('home_welcome_title', 'Xin chào, bạn!'); }
  get welcomeText(): string { return this.businessConfig.setting('home_welcome_text'); }
  get hotline(): string { return this.businessConfig.hotline; }
  /** Chưa nhập địa điểm thì ẩn hẳn khối thời tiết thay vì hiện thời tiết của xã khác. */
  get showWeather(): boolean { return !!this.businessConfig.setting('weather_location'); }
  /** Chưa cấu hình thì box "Quan tâm OA" tự dùng icon chuông mặc định (xem template). */
  get followOaIconUrl(): string { return this.businessConfig.setting('home_follow_oa_icon_url'); }

  stats = {
    population: 0,
    area: '--',
    services: '--',
    satisfaction: '--',
    updatedMonth: ''
  };
  /**
   * Ô tiện ích trang chủ nạp hoàn toàn từ `menu-items/active` (cache theo vòng đời app).
   * KHÔNG có danh sách mặc định viết cứng: trước đây danh sách cứng hiện ra trước rồi bị API
   * thay thế, gây nháy nội dung mỗi lần quay lại trang chủ.
   */
  quickActions: HomeAction[] = [];
  featuredTools: HomeFeature[] = [];
  loadingQuickActions = true;
  loadingFeaturedTools = true;
  private subs = new Subscription();
  private readonly featurePalette = ['tile-blue', 'tile-green', 'tile-orange', 'tile-purple', 'tile-teal', 'tile-pink', 'tile-cyan', 'tile-sky'];

  loadingNews = false;
  newsItems: IResPostListItem[] = [];
  newsSectionTitle = 'Tin tức nổi bật';
  newsViewAllCategoryId: number | null = null;

  constructor(
    private weatherService: WeatherService,
    private followSvc: FollowOfficialService,
    private zmaShortcut: ZmaShortcutService,
    private _notify: NotifyService,
    private offCanvasService: OffcanvasCustomService,
    private route: Router,
    private users: UserService,
    private bannerCache: BannerCacheService,
    private menuItemCache: MenuItemCacheService,
    private newsCache: NewsCacheService,
    private businessConfig: BusinessConfigService,
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
    const stored = this.users.userInfoValue ?? this.appService.getUserInfo;
    this.hasFollowed = !!stored?.followedOA;

    this.loadWeather();
    this.loadHomeContent();

    this.loadBannerTop();
    this.loadBannerMiddle();
    this.loadFeaturedTools();
    this.loadQuickActions();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.getDestroySubs();
  }

  private loadBannerTop(): void {
    this.bannerCache.getBannersOnce({
      positionCode: 'miniapp_home_hero',
      platform: 'miniapp',
    }).pipe(
      catchError(() => of([])),
      takeUntil(this.destroyed),
    ).subscribe((items) => {
      this.slides = items
        .filter((b) => !!b.imageUrl)
        .map((b) => ({
          id: b.id,
          name: b.title ?? '',
          image: b.imageUrl ?? '',
          intro: '',
          description: '',
          typeVideo: false,
          linkUrl: b.linkUrl,
        }));
    });
  }

  private loadBannerMiddle(): void {
    this.bannerCache.getFirstBannerOnce({
      positionCode: 'miniapp_home_mid',
      platform: 'miniapp',
    }).pipe(
      catchError(() => of(null)),
      takeUntil(this.destroyed),
    ).subscribe((b) => {
      this.bannerMiddle = b;
    });
  }

  async onOpenBanner() {
    const url = this.bannerMiddle?.linkUrl;
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
    return (b.imageUrl || '').trim();
  }

  loadHomeContent() {
    this.loadingNews = true;
    this.newsCache.homeContentOnce$()
      .pipe(
        takeUntil(this.destroyed),
      )
      .subscribe((data) => {
        this.loadingNews = false;
        const section = data?.sections?.[0] ?? null;
        this.newsSectionTitle = section?.title || 'Tin tức nổi bật';
        this.newsViewAllCategoryId = section?.viewAllCategory?.id ?? null;
        this.newsItems = section?.items?.slice(0, section.displayLimit || 2) ?? [];

        const stats = data?.stats;
        if (stats?.isActive) {
          const getValue = (code: string) => stats.items?.find((it) => it.code === code)?.value || '--';
          this.stats = {
            population: Number(getValue('population')) || 0,
            area: getValue('area'),
            services: getValue('services'),
            satisfaction: getValue('satisfaction'),
            updatedMonth: stats.updatedMonth ?? ''
          };
        }
      });
  }

  /**
   * Hàng nút tắt đầu trang. Nạp qua cache nên chỉ gọi API một lần cho cả vòng đời app — lần quay
   * lại trang chủ sau đó dữ liệu có ngay, không còn khoảng rỗng rồi mới đầy.
   */
  private loadQuickActions(): void {
    this.menuItemCache.activeOnce$('home_quick_actions')
      .pipe(
        finalize(() => (this.loadingQuickActions = false)),
        takeUntil(this.destroyed),
      )
      .subscribe((items) => {
        this.quickActions = items.map((it) => ({
          key: String(it.id),
          label: it.label,
          sub: '',
          iconClass: it.iconClass || 'fa-regular fa-circle-dot',
          iconUrl: it.icon,
          linkType: it.linkType,
          link: it.link,
          ref: it.ref,
        }));
      });
  }

  private loadFeaturedTools(): void {
    this.menuItemCache.activeOnce$('home_utilities')
      .pipe(
        finalize(() => (this.loadingFeaturedTools = false)),
        takeUntil(this.destroyed),
      )
      .subscribe((items) => {
        this.featuredTools = items.map((it, index) => ({
          key: String(it.id),
          label: it.label,
          sub: '',
          iconClass: it.iconClass || 'fa-solid fa-grid-2',
          iconUrl: it.icon,
          colorClass: this.featurePalette[index % this.featurePalette.length],
          linkType: it.linkType,
          link: it.link,
          ref: it.ref,
        }));
      });
  }

  /**
   * Điều hướng theo `linkType` mà BE đã resolve sẵn (`menu-items/active`).
   *
   * FE không tự suy diễn lại từ `actionType`: `post_category`/`post_detail` đã được BE đổi thành
   * route `/news?categoryId=N` và `/news/N` — nhân bản logic đó ở đây là mời lệch về sau.
   */
  private async openByLinkType(it: HomeAction): Promise<void> {
    switch (it.linkType) {
      case 'route':
        if (it.link) this.route.navigateByUrl(it.link);
        return;
      case 'url':
        if (it.link) window.open(it.link, '_blank');
        return;
      case 'webview':
        if (it.link) await this.openExternalUrl(it.link);
        return;
      case 'phone':
        if (it.link) this.callNow(it.link);
        return;
      default:
        this._notify.info('Tính năng đang được cập nhật.');
        return;
    }
  }

  // Mọi ô đều đến từ `menu-items/active` nên luôn có `linkType`, không còn nhánh dự phòng cũ.
  onQuickAction(it: HomeAction): Promise<void> {
    return this.openByLinkType(it);
  }

  onFeatureClick(it: HomeFeature): Promise<void> {
    return this.openByLinkType(it);
  }

  onNotificationTap(): void {
    this.route.navigateByUrl('/notifications');
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
      // Tên/icon phím tắt lấy từ cấu hình của từng xã; dự phòng về tên đơn vị và icon mặc định.
      const appName = this.businessConfig.setting('miniapp_shortcut_name')
        || this.businessConfig.businessName
        || 'Chính quyền số';
      const appIcon = this.businessConfig.setting(
        'miniapp_shortcut_icon_url',
        'https://smartzalo.io.vn/assets/img/Quoc_Huy_Viet_Nam_Chuan.png',
      );

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
    if (this.hasFollowed || this.isFollowingOA) return;

    this.isFollowingOA = true;
    this.followSvc.follow$(this.oaId, {
      devBypass: false,
    })
      .pipe(
        finalize(() => (this.isFollowingOA = false)),
        takeUntil(this.destroyed),
      )
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
    if (this.newsViewAllCategoryId) {
      this.route.navigate(['/news'], {queryParams: {categoryId: this.newsViewAllCategoryId}});
      return;
    }
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
    const location = this.businessConfig.setting('weather_location');
    if (!location) return; // Chưa cấu hình địa danh -> ẩn khối, xem getter `showWeather`.

    this.locationLabel = location;

    this.subs.add(
      this.weatherService.getCurrentByLocationName(location).subscribe({
        next: (res) => {
          this.locationLabel = res.label || location;

          if (res.temp == null) {
            this.temperatureText = '--°C';
            this.weatherText = 'Không lấy được thời tiết';
            this.weatherIconClass = 'wx-cloud';
            return;
          }

          this.temperatureText = `${res.temp.toFixed(1)}°C`;
          this.weatherText = this.mapWeatherCodeToText(res.code);
          this.weatherIconClass = this.mapWeatherCodeToIconClass(res.code);
        },
        error: () => {
          this.weatherText = 'Không lấy được thời tiết';
          this.temperatureText = '--°C';
          this.weatherIconClass = 'wx-cloud';
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

  trackByNewsId = (_: number, it: IResPostListItem) => it.id;
}
