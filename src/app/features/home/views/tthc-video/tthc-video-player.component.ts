import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { takeUntil } from 'rxjs';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {NotifyService} from '../../../../core/services';
import {isMp4Url, isYoutubeUrl, toYoutubeEmbedUrl} from '../../../../shared/utils/video.util';
@Component({
  selector: 'app-tthc-video-player',
  templateUrl: './tthc-video-player.component.html',
  styleUrls: ['./tthc-video-player.component.scss'],
  standalone: false,
})
export class TthcVideoPlayerComponent extends AppCommonComponent implements OnInit, OnDestroy {
  title = 'Video hướng dẫn TTHC';
  rawUrl = '';

  isYoutube = false;
  isMp4 = false;

  iframeUrl: SafeResourceUrl | null = null;

  constructor(
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private notify: NotifyService,
  ) { super(); }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroyed))
      .subscribe((qp) => {
        const url = qp?.['url'] ? String(qp['url']) : '';
        const title = qp?.['title'] ? String(qp['title']) : this.title;

        this.title = title;
        this.setHeader({ variant: 'title', show: true, back: true, title: this.title });

        this.rawUrl = url;
        this.isYoutube = isYoutubeUrl(url);
        this.isMp4 = isMp4Url(url);

        if (this.isYoutube) {
          const embed = toYoutubeEmbedUrl(url, true);
          if (!embed) {
            this.notify.warning('Link YouTube không hợp lệ.');
            this.iframeUrl = null;
            return;
          }
          this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embed);
          return;
        }

        if (this.isMp4) {
          this.iframeUrl = null; // dùng <video>
          return;
        }

        // loại link khác: vẫn có thể nhúng iframe nếu bạn muốn (nhưng phải whitelisting domain)
        this.notify.warning('Định dạng video chưa hỗ trợ (chỉ hỗ trợ YouTube / mp4).');
        this.iframeUrl = null;
      });
  }

  ngOnDestroy(): void {
    this.getDestroySubs();
  }
}
