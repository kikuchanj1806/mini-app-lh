import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';

@Component({
  selector: 'app-maps',
  templateUrl: 'maps.component.html',
  styleUrls: ['maps.component.scss'],
  standalone: false
})
export class MapsComponent extends AppCommonComponent implements OnInit, OnDestroy {
  mapUrl!: SafeResourceUrl;

  private lat = 20.8055;
  private lng = 106.2690;
  private zoom = 16;

  constructor(private sanitizer: DomSanitizer) {
    super();
  }

  ngOnInit() {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Bản đồ' });
    const delta = 0.01;
    const left = this.lng - delta;
    const right = this.lng + delta;
    const top = this.lat + delta;
    const bottom = this.lat - delta;

    const url =
      `https://www.openstreetmap.org/export/embed.html` +
      `?bbox=${left}%2C${bottom}%2C${right}%2C${top}` +
      `&layer=mapnik&marker=${this.lat}%2C${this.lng}`;

    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  openInMap() {
    // mở app/brower map ngoài (tuỳ môi trường)
    const url = `https://www.google.com/maps?q=${this.lat},${this.lng}`;
    window.open(url, '_blank');
  }

  ngOnDestroy() {
    this.getDestroySubs();
  }
}
