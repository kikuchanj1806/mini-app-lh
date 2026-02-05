import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import {IResQuestion, OptionKey} from '../../../shared/models/feature-specific/game/question.model';
import {AppCommonComponent} from '../../../shared/components/app-common.service';
import {QuizStateService} from '../quiz-state.service';

type ResultRow = {
  q: IResQuestion;
  picked: OptionKey | null;
  correct: OptionKey;
  isCorrect: boolean;
};

const OPTION_KEYS: ReadonlyArray<OptionKey> = ['A', 'B', 'C', 'D'];
@Component({
  selector: 'app-quiz-result',
  templateUrl: './quiz-result.component.html',
  styleUrls: ['./quiz-result.component.scss'],
  standalone: false,
})
export class QuizResultComponent extends AppCommonComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private quizState = inject(QuizStateService);
  readonly optionKeys = OPTION_KEYS;
  rows: ResultRow[] = [];
  correctCount = 0;
  total = 0;
  durationSeconds = 0;

  ngOnInit(): void {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Kết quả' });

    const s = this.quizState.snapshot;
    if (!s) {
      this.router.navigate(['/quiz']);
      return;
    }

    const now = Date.now();
    this.durationSeconds = Math.max(0, Math.floor((now - s.startedAtMs) / 1000));

    this.total = s.questions.length;

    this.rows = s.questions.map((q) => {
      const picked = s.answers[q.id] ?? null;
      const correct = q.correct_option;
      const isCorrect = picked !== null && picked === correct;
      return { q, picked, correct, isCorrect };
    });

    this.correctCount = this.rows.filter(r => r.isCorrect).length;
  }

  toPlay(): void {
    this.router.navigate(['/quiz/play']);
  }

  toStartNew(): void {
    this.quizState.reset();
    this.router.navigate(['/quiz']);
  }

  ngOnDestroy(): void {
    this.getDestroySubs();
  }
}
