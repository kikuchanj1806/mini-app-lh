import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit, SimpleChanges
} from '@angular/core';
import {DEFAULT_FOOTER, IFooterCartConfig, IFooterConfig, IFooterItem, IFooterTabsConfig} from '../../models/global';
import {uriFeConst} from '../../constants';
import {openChat, scanQRCode} from 'zmp-sdk/apis'
import {OffcanvasCustomService} from '../../services/modal-canvas-custom.service';
import {Subject, takeUntil} from 'rxjs';
import {environment} from '../../../../environments';
import {HeaderFooterFacadeService} from '../../services/repository/layout-service/header-footer-facade.service';


@Component({
  selector: 'app-footer',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  template: `
    @if (cfg.show !== false) {
      <div [class]="(cfg.className || 'footer') + ' w-100'">
        @if (isTabs(cfg)) {
          <nav class="w-100 p-2 grid footer-nav shadow-lg"
               style="padding-bottom: max(16px, env(safe-area-inset-bottom));">
            @for (item of itemsToRender; track (item?.path ?? $index)) {

              @if (!!item.path && !isCommandPath(item.path) && !item.badge) {
                <a
                  [routerLink]="item.path"
                  [queryParams]="item.queryParams"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: (item.exact ?? (item.path === '/')) }"
                  class="footer-tab no-hover d-flex flex-col align-items-center space-y-0.5 p-1 pb-0.5 position-relative cursor-pointer">

                  @if (item.iconTypeImg) {
                    <img
                      class="footer-icon-img"
                      [src]="item.iconTypeImg"
                      [attr.alt]="item.label" />
                  } @else {
                    <i [class]="(item.iconClass || '') + ' f-6'"></i>
                  }
                  <span class="text-2xs mt-1">{{ item.label }}</span>
                </a>
              } @else {
                <button
                  type="button"
                  (click)="onNavClick(item, $event)"
                  [class.footer-tab--center]="item.path === '__scan_qr__'"
                  class="footer-tab no-active as-button d-flex flex-col align-items-center space-y-0.5 p-1 pb-0.5 position-relative cursor-pointer">
                  <i [class]="(item.iconClass || '') + ' f-6'"></i>
                  <span class="text-2xs mt-1">{{ item.label }}</span>

                  @if (item.badge) {
                    <span class="position-absolute translate-middle badge rounded-pill"
                          [style]="'background-color: var(--brand-color);'">
                    </span>
                  }
                </button>
              }
            } @empty {
              <div class="text-center text-muted py-2 text-2xs">Không có mục nào</div>
            }
          </nav>
        } @else {
          <div class="row nav-item_nav pt-2 pb-3 align-items-center">
            <div class="col-2">
              <div class="chat_zalo" (click)="openChat()">
                <img [src]="'assets/img/logo_zalo.svg'" alt="Zalo" class="logo-zalo-size"/>
                <div class="zalo-chat_text mt-1">Chat ngay</div>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `
})
export class AppFooterComponent implements OnInit, OnChanges, OnDestroy {
  @Input() items: IFooterItem[] = [
    {path: '/', iconClass: 'fal fa-house', label: 'Trang chủ'},
    {path: uriFeConst.user.feedback, iconClass: 'fa-light fa-pen-to-square', label: 'Phản ánh'},
    {path: uriFeConst.news.index, iconClass: 'fa-light fa-newspaper', label: 'Tin tức'},
    {path: '', iconClass: 'fa-light fa-message-dots', label: 'Liên hệ'},
  ];

  // state
  cfg: IFooterConfig = DEFAULT_FOOTER;
  itemsToRender: IFooterItem[] = this.items;

  // services
  readonly hf = inject(HeaderFooterFacadeService);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly offcanvasSvc = inject(OffcanvasCustomService);

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.hf.footer$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cfg => {
        this.cfg = cfg;
        this.recomputeItemsToRender();
        this.cd.markForCheck();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.recomputeItemsToRender();
      this.cd.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async onNavClick(item: IFooterItem, ev: MouseEvent): Promise<void> {
    if (item.path === '__scan_qr__') {
      ev.preventDefault();
      try {
        await scanQRCode();
      } catch (e) {
        console.warn('scan qr failed', e);
      }
      return;
    }

    if (item.path === '__profile__') {
      ev.preventDefault();
      return;
    }

    if (!item.path) {
      ev.preventDefault();
      openChat({type: 'oa', id: environment.OAId, message: 'Xin chào'});
    }
  }


  isTabs(c: IFooterConfig): c is IFooterTabsConfig {
    return c?.variant === 'tabs';
  }

  isCommandPath(path: string): boolean {
    return path.startsWith('__');
  }

  openChat() {
    openChat({type: 'user', id: environment.OAId, message: 'Xin chào'});
  }

  private recomputeItemsToRender() {
    if (this.isTabs(this.cfg) && Array.isArray(this.cfg.items) && this.cfg.items.length) {
      this.itemsToRender = this.cfg.items;
    } else {
      this.itemsToRender = this.items;
    }
  }
}
