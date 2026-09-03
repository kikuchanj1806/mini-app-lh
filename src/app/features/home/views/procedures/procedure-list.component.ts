import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs';
import { AppCommonComponent } from '../../../../shared/components/app-common.service';
import { NotifyService } from '../../../../core/services';
import {
  IResProcedureCategory,
  IResProcedurePublicItem,
  ProcedureApiService,
} from '../../../../shared/services/api';

@Component({
  selector: 'app-procedure-list',
  templateUrl: './procedure-list.component.html',
  styleUrls: ['./procedure-list.component.scss'],
  standalone: false,
})
export class ProcedureListComponent extends AppCommonComponent implements OnInit, OnDestroy {
  items: IResProcedurePublicItem[] = [];
  categories: IResProcedureCategory[] = [];
  selectedCategoryId: number | null = null;
  keyword = '';
  loading = false;

  private keyword$ = new Subject<string>();

  constructor(
    private procedureApi: ProcedureApiService,
    private notify: NotifyService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Thủ tục hành chính' });

    this.selectedCategoryId = this.readCategoryId();
    this.loadCategories();
    this.load();

    this.keyword$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroyed))
      .subscribe(() => this.load());
  }

  ngOnDestroy(): void {
    this.getDestroySubs();
  }

  onSearchChange(value: string): void {
    this.keyword = value;
    this.keyword$.next(value);
  }

  onCategoryTap(categoryId: number | null): void {
    this.selectedCategoryId = categoryId;
    this.load();
  }

  load(): void {
    this.loading = true;

    this.procedureApi.publicList({
      keyword: this.keyword.trim() || undefined,
      categoryId: this.selectedCategoryId ?? undefined,
      page: 1,
      pageSize: 50,
    })
      .pipe(
        takeUntil(this.destroyed),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: (res) => (this.items = res?.data?.result ?? []),
        error: () => this.notify.error('Không tải được danh sách thủ tục hành chính.'),
      });
  }

  trackById(_: number, it: IResProcedurePublicItem): number {
    return it.id;
  }

  private loadCategories(): void {
    this.procedureApi.categoryOptions()
      .pipe(takeUntil(this.destroyed))
      .subscribe((res) => (this.categories = res?.data ?? []));
  }

  private readCategoryId(): number | null {
    const raw = this.navService.getParam('categoryId');
    const n = raw == null ? NaN : Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
}
