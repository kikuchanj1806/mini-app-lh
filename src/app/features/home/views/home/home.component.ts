import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {IResBanner} from '../../../../shared/models/api';
import {WeatherService} from '../../../../shared/services/weather.service';
import { openPhone } from 'zmp-sdk/apis';

type UiTool = { key: string; label: string; iconUrl: string; route?: string };
type ExtraService = { key: string; label: string; iconUrl: string; colorClass: string; route?: string };

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: false,
})
export class HomeComponent extends AppCommonComponent implements OnInit, OnDestroy {
  slides: IResBanner[] = [];

  // UI date
  todayWeekday = '';
  todayDate = '';

  // Weather UI bindings
  locationLabel = 'Trường Tân, Hải Phòng';
  weatherText = '';
  temperatureText = '--°C';
  weatherIconClass = 'wx-cloud';

  stats = {
    population: 34432,
    area: '19,94 km2',
    services: '25+',
    satisfaction: '98%',
    updatedMonth: '1/2026'
  };

  mainTools: UiTool[] = [
    {key: 'calendar', label: 'Đăng ký lịch làm việc', iconUrl: '/assets/img/icons/lich_lam_viec.png', route: 'bookappointment'},
    {key: 'map', label: 'Bản đồ', iconUrl: '/assets/img/icons/maps_icon.png'},
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

  constructor(private weatherService: WeatherService) {
    super();
  }

  ngOnInit() {
    this.setHeader({variant: 'title', title: '', show: false})
    this.setToday();

    this.slides = [
      {
        id: 1,
        name: '',
        image: 'assets/img/banners/banner_main_zma_STT.jpg',
        intro: '',
        description: '',
        typeVideo: false
      },
    ];

    this.loadWeather();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.getDestroySubs();
  }

  onToolClick(it: UiTool) {
    console.log('tool click', it.key);
    // TODO: this.router.navigate([it.route]) hoặc open modal...
  }

  onExtraClick(it: ExtraService) {
    console.log('extra click', it.key);
  }

  onHotline() {
    console.log('Call hotline');
  }

  onFollowOfficial() {
    console.log('Follow official channel');
  }

  onQuickNotify() {
    console.log('Quick notify');
  }

  onUpdate247() {
    console.log('Update 24/7');
  }

  onOpenBanner() {
    console.log('Open banner detail');
  }

  onViewAllNews() {
    console.log('View all news');
  }

  onOpenNews(type: 'law' | 'security' | '') {
    console.log('Open news', type);
  }

  callNow(phone: string) {
    const phoneNumber = phone.replace(/\./g, '').trim();
    openPhone({ phoneNumber }).catch(() => {});
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
}
