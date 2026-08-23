import { Component, OnDestroy, OnInit } from '@angular/core';
import { openWebview } from 'zmp-sdk/apis';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';

@Component({
  selector: 'app-maps',
  templateUrl: 'maps.component.html',
  styleUrls: ['maps.component.scss'],
  standalone: false
})
export class MapsComponent extends AppCommonComponent implements OnInit, OnDestroy {
  lat = 20.8756613;
  lng = 106.169283;
  zoom = 17;

  ngOnInit() {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Bản đồ' });
  }

  openInMap(): void {
    // Link Google Maps (ổn định, mở được trong webview)
    const url = `https://www.google.com/maps/search/?api=1&query=${this.lat},${this.lng}`;

    openWebview({
      url,
    });
  }

  openDirection(): void {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${this.lat},${this.lng}`;

    openWebview({ url });
  }

  ngOnDestroy() {
    this.getDestroySubs();
  }
}
