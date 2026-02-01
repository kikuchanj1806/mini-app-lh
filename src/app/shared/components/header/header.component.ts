import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {HeaderFooterFacadeService} from '../../services/repository/layout-service/header-footer-facade.service';
import {IHeaderConfig, IHeaderTitleConfig} from '../../models/global';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  template: `
    @if (cfg && cfg.show !== false && isTitle(cfg)) {
      <div
        [class]="
          (cfg.className ?? 'header-color') +
          ' h-14 safe-pt-16 w-100 d-flex align-items-center px-2 pb-2'
        "
      >
        <div class="d-flex align-items-center back-header px-1 py-2 w-100">
          @if (cfg.back !== false) {
            <button
              type="button"
              class="btn btn-link text-white p-0 me-3 back-button"
              (click)="back()"
            >
              <i class="fa fa-arrow-left fa-lg"></i>
            </button>
          }

          <div class="mb-0 text-white text-truncate">
            {{ cfg.title }}
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .header-color {
        background: linear-gradient(135deg, #1767ff 0%, #6a42ff 100%);
        padding-bottom: 14px !important;

        border-bottom-left-radius: 18px;
        border-bottom-right-radius: 18px;

        overflow: hidden;

        box-shadow: 0 10px 22px rgba(0, 0, 0, 0.10);
      }
      .back-button {
        padding: 0.5rem;
        background: transparent;
        border: 0;
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: 0.25rem;
      }

      .back-button:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      .back-button:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
      }
    `,
  ],
})
export class AppHeaderComponent implements OnInit {
  private readonly facade = inject(HeaderFooterFacadeService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  cfg?: IHeaderConfig;

  ngOnInit(): void {
    this.facade.header$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cfg) => {
        this.cfg = cfg;
        this.cdr.markForCheck();
      });
  }

  back() {
    this.facade.back();
  }

  isTitle(c: IHeaderConfig): c is IHeaderTitleConfig {
    return c.variant === 'title';
  }
}
