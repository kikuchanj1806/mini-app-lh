import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subscription, takeUntil} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {WeatherService} from '../../../../shared/services/weather.service';
import {createShortcut, openWebview} from 'zmp-sdk/apis';
import {NotifyService, UserService, BusinessConfigService} from '../../../../core/services';
import {ZmaShortcutService} from '../../../../shared/services/feature-specific/home/zm-shortcut.service';
import {environment} from '../../../../../environments';
import {Router} from '@angular/router';
import {FollowOfficialService} from '../../../../shared/services/feature-specific/home/follow-official.service';
import {IResBanner, IResBannerT, IResHomeBelow, IResPostListItem, IHomeBroadcastFeatureCard} from '../../../../shared/models/api';
import {IResMenuItemActive} from '../../../../shared/services/api';
import {markAppLoad, markLoadDone, measureLoad, trackHomeLoads} from '../../../../core/utils/app-load-timer.util';
import {mapWeatherCodeToIconClass, mapWeatherCodeToText} from '../../../../core/utils/weather-code.util';
import {HomeBootstrapService} from '../../../../shared/services/feature-specific/home/home-bootstrap.service';
import {HomeLinkService} from '../../../../shared/services/feature-specific/home/home-link.service';
import {HomeAction, HomeFeature} from './models/home.types';

const HOME_LOAD_KEYS = ['weather', 'above', 'below'];

/** Suất tạo shortcut ra màn hình chính — xem `onExtraClick`. */
type ExtraService = { key: string; label: string; iconUrl: string; colorClass: string; route?: string };

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: false,
})
export class HomeComponent extends AppCommonComponent implements OnInit, OnDestroy {
  // ---- above the fold (nạp ngay trong ngOnInit) ----
  slides: IResBannerT[] = [];
  quickActions: HomeAction[] = [];
  loadingQuickActions = true;

  hasFollowed = false;
  isFollowingOA = false;
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

  private subs = new Subscription();
  private readonly featurePalette = ['tile-blue', 'tile-green', 'tile-orange', 'tile-purple', 'tile-teal', 'tile-pink', 'tile-cyan', 'tile-sky'];

  constructor(
    private weatherService: WeatherService,
    private followSvc: FollowOfficialService,
    private zmaShortcut: ZmaShortcutService,
    private _notify: NotifyService,
    private route: Router,
    private users: UserService,
    private homeBootstrap: HomeBootstrapService,
    private homeLink: HomeLinkService,
    private businessConfig: BusinessConfigService,
  ) {
    super();
    this.below$ = this.homeBootstrap.below$();
  }

  /** Phần dưới màn hình đầu tiên — kích hoạt bởi khối `@defer (on viewport)` trong template. */
  readonly below$: Observable<IResHomeBelow | null>;

  ngOnInit() {
    markAppLoad('home-component:init');
    trackHomeLoads(HOME_LOAD_KEYS);

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
        {path: '/profile', iconClass: 'fa-light fa-circle-user', label: 'Cá nhân'},
      ],
    });
    this.setToday();
    const stored = this.users.userInfoValue ?? this.appService.getUserInfo;
    this.hasFollowed = !!stored?.followedOA;

    this.loadWeather();
    this.loadAbove();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.getDestroySubs();
  }

  private loadAbove(): void {
    this.homeBootstrap.above$().pipe(
      takeUntil(this.destroyed),
    ).subscribe((data) => {
      this.loadingQuickActions = false;
      this.slides = this.toSlideItems(data?.heroBanners ?? []);
      this.quickActions = (data?.quickActions ?? []).map((it) => ({
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

  toSlideItems(items: IResBanner[]): IResBannerT[] {
    return items
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
  }

  /** Ô tiện ích trang chủ — thêm `colorClass` xoay vòng theo bảng màu, còn lại giữ nguyên field BE trả về. */
  toFeatureItems(items: IResMenuItemActive[]): HomeFeature[] {
    return items.map((it, index) => ({
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
  }

  /** Dùng chung cho slide hero lẫn banner giữa/sự kiện/đối tác — đều mở `linkUrl` qua webview Zalo. */
  async onOpenBanner(url?: string | null) {
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

  // Mọi ô đều đến từ `menu-items/active` nên luôn có `linkType`, không còn nhánh dự phòng cũ.
  onQuickAction(it: HomeAction): Promise<void> {
    return this.homeLink.openByLinkType(it);
  }

  onFeatureClick(it: HomeFeature): Promise<void> {
    return this.homeLink.openByLinkType(it);
  }

  callHotline(): void {
    if (this.hotline) this.homeLink.callNow(this.hotline);
  }

  onNotificationTap(): void {
    this.route.navigateByUrl('/notifications');
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

  onViewAllNews(categoryId: number | null | undefined) {
    if (categoryId) {
      this.route.navigate(['/news'], {queryParams: {categoryId}});
      return;
    }
    this.route.navigateByUrl('/news');
  }

  openNewsDetail(it: IResPostListItem): void {
    this.route.navigate(['/newdetail'], {queryParams: {id: it.id}});
  }

  broadcastTitle(broadcast: IResHomeBelow['content']['broadcast']): string {
    return broadcast?.title || 'Truyền thanh Chính quyền số';
  }

  mapBroadcastFeatureCard(card: IHomeBroadcastFeatureCard): IHomeBroadcastFeatureCard {
    return card;
  }

  openBroadcastList(): void { this.route.navigateByUrl('/broadcasts'); }

  onBroadcastChannel(slug: string): void { this.route.navigateByUrl(`/broadcasts?channel=${encodeURIComponent(slug)}`); }

  onBroadcastFeatureCard(card: IHomeBroadcastFeatureCard): void {
    if (card.channel?.slug) this.onBroadcastChannel(card.channel.slug);
  }

  private setToday() {
    const d = new Date();
    const weekday = new Intl.DateTimeFormat('vi-VN', {weekday: 'long'}).format(d);
    this.todayWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    this.todayDate = new Intl.DateTimeFormat('vi-VN').format(d);
  }

  private loadWeather() {
    const location = this.businessConfig.setting('weather_location');
    if (!location) {
      markAppLoad('weather:skipped', {reason: 'chưa cấu hình weather_location'});
      markLoadDone('weather'); // Chưa cấu hình địa danh -> ẩn khối, xem getter `showWeather`.
      return;
    }

    this.locationLabel = location;

    this.subs.add(
      this.weatherService.getCurrentByLocationName(location).pipe(
        measureLoad('weather'),
      ).subscribe({
        next: (res) => {
          this.locationLabel = res.label || location;

          if (res.temp == null) {
            this.temperatureText = '--°C';
            this.weatherText = 'Không lấy được thời tiết';
            this.weatherIconClass = 'wx-cloud';
            return;
          }

          this.temperatureText = `${res.temp.toFixed(1)}°C`;
          this.weatherText = mapWeatherCodeToText(res.code);
          this.weatherIconClass = mapWeatherCodeToIconClass(res.code);
        },
        error: () => {
          this.weatherText = 'Không lấy được thời tiết';
          this.temperatureText = '--°C';
          this.weatherIconClass = 'wx-cloud';
        },
      })
    );
  }
}
