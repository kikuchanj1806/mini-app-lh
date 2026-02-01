import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-spinner-with-logo',
  standalone: true,
  template: `
    <div class="spinner-overlay"
         [class.hidden]="!loading"
         [style.--overlay-alpha]="opacity">
      <div class="spin-wrapper"
           [style.--size.rem]="sizeRem"
           [style.--thickness.px]="thickness"
           [style.--speed.s]="speed"
           [style.--track-color]="trackColor"
           [style.--segment-color]="segmentColor">
        <div class="spin-track"></div>
        <div class="spin-loader"></div>
        <div class="logo-wrap">
          <img [src]="logoUrl" alt="logo">
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./spinner-with-logo.component.scss'],
})
export class SpinnerWithLogoComponent {
  @Input() logoUrl = 'https://smartzalo.io.vn/assets/img/Quoc_Huy_Viet_Nam_Chuan.png';

  /** Kích thước vòng (rem) và độ dày nét (px) */
  @Input() sizeRem = 2.85;
  @Input() thickness = 3;

  /** Tốc độ quay (giây) */
  @Input() speed = 1;

  /** Màu track và màu segment động */
  @Input() trackColor = '#ccc';
  @Input() segmentColor = '#f82c2c';

  /** Hiển thị/ẩn, độ mờ, và lớp vị trí (absolute/fixed/relative...) */
  @Input() loading = true;
  @Input() opacity = 0.25;
  @Input() position = 'position-absolute';
}
