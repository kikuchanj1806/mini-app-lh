import { Component, ElementRef, EventEmitter, HostListener, Output, ViewChild } from '@angular/core';

type Pos = { x: number; y: number };

@Component({
  selector: 'app-floating-assist',
  template: `
    <button
      #btn
      type="button"
      class="assist-btn"
      (pointerdown)="onDown($event)"
      (click)="onClick($event)"
    >
      <i class="fa-solid fa-headset"></i>
    </button>
  `,
  styles: [`
    .assist-btn{
      position: fixed;
      left: 0; top: 0;
      width: 40px; height: 40px;
      border-radius: 999px;
      border: 0;
      z-index: 999999;
      box-shadow: 0 8px 24px rgba(0,0,0,.18);
      background: #0ea5e9;
      color: #fff;
      display:flex; align-items:center; justify-content:center;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }
  `],
  standalone: true,
})
export class FloatingAssistComponent {
  @ViewChild('btn', { static: true }) btn!: ElementRef<HTMLButtonElement>;
  @Output() tap = new EventEmitter<void>();

  private dragging = false;
  private moved = false;

  private startPointer = { x: 0, y: 0 };
  private startPos: Pos = { x: 0, y: 0 };
  private pos: Pos = { x: 12, y: 160 };

  private readonly KEY = 'assist_pos_v1';
  private readonly MARGIN = 10; // cách mép
  private readonly SNAP = true;

  ngAfterViewInit() {
    const raw = localStorage.getItem(this.KEY);
    if (raw) {
      try {
        const p = JSON.parse(raw) as Pos;
        if (Number.isFinite(p.x) && Number.isFinite(p.y)) this.pos = p;
      } catch {}
    }

    this.applyPos(this.pos);
    this.clampIntoViewport();
  }

  onDown(ev: PointerEvent) {
    ev.preventDefault();
    this.dragging = true;
    this.moved = false;

    this.startPointer = { x: ev.clientX, y: ev.clientY };
    this.startPos = { ...this.pos };

    this.btn.nativeElement.setPointerCapture(ev.pointerId);
  }

  @HostListener('window:pointermove', ['$event'])
  onMove(ev: PointerEvent) {
    if (!this.dragging) return;

    const dx = ev.clientX - this.startPointer.x;
    const dy = ev.clientY - this.startPointer.y;

    if (Math.abs(dx) + Math.abs(dy) > 3) this.moved = true;

    const next = { x: this.startPos.x + dx, y: this.startPos.y + dy };
    this.pos = this.clamp(next);
    this.applyPos(this.pos);
  }

  @HostListener('window:pointerup', ['$event'])
  onUp(ev: PointerEvent) {
    if (!this.dragging) return;
    this.dragging = false;

    if (this.SNAP) {
      this.pos = this.snapToEdge(this.pos);
      this.applyPos(this.pos, true);
    }

    localStorage.setItem(this.KEY, JSON.stringify(this.pos));
  }

  onClick(ev: MouseEvent) {
    // nếu là click sau kéo -> bỏ qua
    if (this.moved) {
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
    this.tap.emit();
  }

  @HostListener('window:resize')
  onResize() {
    this.clampIntoViewport();
  }

  private applyPos(p: Pos, animate = false) {
    const el = this.btn.nativeElement;
    el.style.transition = animate ? 'transform 180ms ease' : 'none';
    el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
  }

  private clampIntoViewport() {
    this.pos = this.clamp(this.pos);
    this.applyPos(this.pos, true);
    localStorage.setItem(this.KEY, JSON.stringify(this.pos));
  }

  private clamp(p: Pos): Pos {
    const el = this.btn.nativeElement;
    const w = el.offsetWidth || 54;
    const h = el.offsetHeight || 54;

    const maxX = window.innerWidth - w - this.MARGIN;
    const maxY = window.innerHeight - h - this.MARGIN;

    const x = Math.max(this.MARGIN, Math.min(p.x, maxX));
    const y = Math.max(this.MARGIN, Math.min(p.y, maxY));

    return { x, y };
  }

  private snapToEdge(p: Pos): Pos {
    const el = this.btn.nativeElement;
    const w = el.offsetWidth || 54;
    const leftX = this.MARGIN;
    const rightX = window.innerWidth - w - this.MARGIN;
    const mid = window.innerWidth / 2;

    return { ...p, x: (p.x + w / 2) < mid ? leftX : rightX };
  }
}
