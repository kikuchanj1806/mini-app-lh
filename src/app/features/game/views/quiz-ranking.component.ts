import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import {AppCommonComponent} from '../../../shared/components/app-common.service';
import {QuestionSetApiService} from '../../../shared/services/api/game/question-set-api.service';
import {environment} from '../../../../environments';

interface IResQuizRankingItem {
  id: number;
  ward_id: number;
  user_id: number;
  user_name: string;
  correct_count: number;
  duration_seconds: number;
  created_at: string;
}
@Component({
  selector: 'app-quiz-ranking',
  templateUrl: './quiz-ranking.component.html',
  styleUrls: ['./quiz-ranking.component.scss'],
  standalone: false,
})
export class QuizRankingComponent extends AppCommonComponent implements OnInit, OnDestroy {
  private api = inject(QuestionSetApiService);

  loading = false;
  items: IResQuizRankingItem[] = [];
  limit = 10;

  ngOnInit(): void {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Bảng xếp hạng' });
    this.load();
  }

  load(): void {
    const wardId = Number(environment.wardId || 0);
    if (!wardId) return;

    this.loading = true;
    this.api.ranking({ ward_id: wardId, limit: this.limit })
      .pipe(takeUntil(this.destroyed))
      .subscribe({
        next: (res) => {
          this.items = (res?.data ?? []) as IResQuizRankingItem[];
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  trackById(_: number, it: IResQuizRankingItem) {
    return it.id;
  }

  ngOnDestroy(): void {
    this.getDestroySubs();
  }
}
