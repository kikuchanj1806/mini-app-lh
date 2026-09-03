import {Component, OnDestroy, OnInit} from '@angular/core';
import {takeUntil} from 'rxjs/operators';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';
import {DvcQuestionApiService} from '../../../../shared/services/api/dvc-questions/dvc-question-api.service';

type FaqItem = {
  id: number;
  question: string;
  answer: string;
};

@Component({
  selector: 'app-asked-questions',
  templateUrl: 'asked-questions.component.html',
  styleUrls: ['asked-questions.component.scss'],
  standalone: false
})
export class AskedQuestionsComponent extends AppCommonComponent implements OnInit, OnDestroy {
  faqs: FaqItem[] = [];
  loading = false;

  openId: number | null = null;

  constructor(private dvcQuestionApi: DvcQuestionApiService) {
    super();
  }

  ngOnInit() {
    this.setHeader({variant: 'title', show: true, back: true, title: 'Câu hỏi thường gặp'});

    this.loading = true;
    this.dvcQuestionApi.publicList({onlyFaq: true, page: 1, pageSize: 50})
      .pipe(takeUntil(this.destroyed))
      .subscribe({
        next: (res) => {
          this.loading = false;
          const arr = res?.data?.result ?? [];
          this.faqs = arr.map((x) => ({id: x.id, question: x.question, answer: x.answer || ''}));
          this.openId = this.faqs[0]?.id ?? null;
        },
        error: () => (this.loading = false),
      });
  }

  ngOnDestroy() {
    this.getDestroySubs();
  }

  toggle(item: FaqItem) {
    this.openId = this.openId === item.id ? null : item.id;
  }

  isOpen(item: FaqItem) {
    return this.openId === item.id;
  }

  trackById = (_: number, it: FaqItem) => it.id;
}
