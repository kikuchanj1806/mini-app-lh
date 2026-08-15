import { Injectable } from '@angular/core';

/**
 * Lưu và phục hồi scroll position của inner scroll container (không phải window).
 * Dùng cho layout dạng: <div class="overflow-y-auto"> chứa <router-outlet>.
 */
@Injectable({ providedIn: 'root' })
export class ScrollRestorationService {
  private positions = new Map<string, number>();
  private scrollEl: HTMLElement | null = null;

  /** Đăng ký element là scroll container. Gọi từ LayoutComponent.ngAfterViewInit */
  register(el: HTMLElement): void {
    this.scrollEl = el;
  }

  /** Lưu vị trí scroll hiện tại cho url đang đứng. Gọi khi NavigationStart */
  save(url: string): void {
    if (this.scrollEl) {
      this.positions.set(url, this.scrollEl.scrollTop);
    }
  }

  /** Phục hồi vị trí scroll cho url vừa navigate đến. Gọi khi NavigationEnd */
  restore(url: string): void {
    const top = this.positions.get(url) ?? 0;
    // rAF để đảm bảo router-outlet đã render xong nội dung trước khi scroll
    requestAnimationFrame(() => {
      this.scrollEl?.scrollTo({ top, behavior: 'instant' });
    });
  }
}
