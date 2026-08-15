import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {NavigationEnd, NavigationStart, Router} from '@angular/router';
import {filter, Subscription} from 'rxjs';
import {SpinnerService, ScrollRestorationService} from '../core/services';
import {NgbOffcanvasOptions} from '@ng-bootstrap/ng-bootstrap';
import {ShareLinkComponent} from '../shared/components/actions/share-link/share-link.component';
import {OffcanvasCustomService} from '../shared/services/modal-canvas-custom.service';


@Component({
  selector: 'app-home',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: false
})
export class LayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly spinner = inject(SpinnerService);
  readonly isLoading$ = this.spinner.isLoading$;
  showFloatingAssist = false;

  @ViewChild('scrollWrap', { static: true }) scrollWrapRef!: ElementRef<HTMLElement>;

  private routerSub?: Subscription;

  constructor(
    private cd: ChangeDetectorRef,
    private offcanvas: OffcanvasCustomService,
    private router: Router,
    private scrollRestoration: ScrollRestorationService,
  ) {}

  ngOnInit() {
    this.syncFloatingAssist(this.router.url);

    this.isLoading$.subscribe(_ => {
      this.cd.markForCheck();
    });
  }

  ngAfterViewInit(): void {
    this.scrollRestoration.register(this.scrollWrapRef.nativeElement);

    this.routerSub = this.router.events.pipe(
      filter(evt => evt instanceof NavigationStart || evt instanceof NavigationEnd)
    ).subscribe(evt => {
      if (evt instanceof NavigationStart) {
        this.scrollRestoration.save(this.router.url);
      } else if (evt instanceof NavigationEnd) {
        this.syncFloatingAssist(evt.urlAfterRedirects);
        this.scrollRestoration.restore(evt.urlAfterRedirects);
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  openShare(): void {
    const opts: NgbOffcanvasOptions = {
      position: 'bottom',
      backdrop: true,
      keyboard: true,
      scroll: false,
      container: 'body',
      panelClass: 'offcanvas-bottom-sheet',
    };
    const ref = this.offcanvas.open(ShareLinkComponent, opts);
    ref.componentInstance.url = location.href;
    ref.componentInstance.title = 'Chia sẻ Nhanh Shop';
  }

  onAssistTap() {
    console.log('aaaaa')
  }

  private syncFloatingAssist(url: string): void {
    const cleanUrl = url.split('?')[0].split('#')[0];
    this.showFloatingAssist = cleanUrl !== '' && cleanUrl !== '/';
    this.cd.markForCheck();
  }
}
