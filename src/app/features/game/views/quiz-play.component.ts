import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import {finalize, interval, Subject} from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import {AppCommonComponent} from '../../../shared/components/app-common.service';
import {QuizStateService} from '../quiz-state.service';
import {IResQuestion, OptionKey} from '../../../shared/models/feature-specific/game/question.model';
import {shuffle} from '../../../shared/utils/shuffle';
import {environment} from '../../../../environments';
import {QuestionSetApiService} from '../../../shared/services/api/game/question-set-api.service';
import {calcCorrectCount} from '../../../shared/utils';


@Component({
  selector: 'app-quiz-play',
  templateUrl: './quiz-play.component.html',
  styleUrls: ['./quiz-play.component.scss'],
  standalone: false,
})
export class QuizPlayComponent extends AppCommonComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private quizState = inject(QuizStateService);
  private setApi = inject(QuestionSetApiService);

  questions: IResQuestion[] = [];
  index = 0;

  elapsedSeconds = 20;

  submitting = false;

  ngOnInit(): void {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Trắc nghiệm' });
    const s = this.quizState.snapshot;
    if (!s) {
      this.router.navigate(['/quiz']);
      return;
    }

    this.questions = shuffle(s.questions);
    this.index = 0;

    this.quizState.startTimer();
    interval(1000)
      .pipe(
        takeUntil(this.destroyed),
        tap(() => (this.elapsedSeconds = this.quizState.getElapsedSeconds()))
      )
      .subscribe();
  }

  get current(): IResQuestion | null {
    return this.questions[this.index] ?? null;
  }

  get total(): number {
    return this.questions.length;
  }

  get answeredCount(): number {
    const s = this.quizState.snapshot;
    if (!s) return 0;
    return Object.keys(s.answers).length;
  }

  get canPrev(): boolean {
    return this.index > 0;
  }

  get canNext(): boolean {
    return this.index < this.total - 1;
  }

  get canSubmit(): boolean {
    return this.total > 0 && this.answeredCount === this.total;
  }

  selected(questionId: number): OptionKey | null {
    const s = this.quizState.snapshot;
    return s?.answers?.[questionId] ?? null;
  }

  choose(opt: OptionKey): void {
    const q = this.current;
    if (!q) return;
    this.quizState.setAnswer(q.id, opt);
  }

  prev(): void {
    if (this.canPrev) this.index--;
  }

  next(): void {
    if (this.canNext) this.index++;
  }

  jumpTo(i: number): void {
    if (i < 0 || i >= this.total) return;
    this.index = i;
  }

  submit(): void {
    const s = this.quizState.snapshot;
    if (!s) {
      this.router.navigate(['/quiz']);
      return;
    }

    this.quizState.stopTimer();

    const wardId = Number(environment.wardId || 0);
    if (!wardId) {
      return;
    }

    const durationSeconds = this.quizState.getDurationSeconds();

    const correctCount = calcCorrectCount(s.questions, s.answers);

    this.submitting = true;

    this.setApi.storeZma({
      ward_id: wardId,
      question_set_id: s.questionSetId ?? undefined,
      correct_count: correctCount,
      duration_seconds: durationSeconds,
    }).pipe(
      takeUntil(this.destroyed),
      finalize(() => (this.submitting = false))
    ).subscribe({
      next: (res) => {
        if (!res?.data) return;

        this.quizState.setSubmitResult(res.data);

        this.router.navigate(['/quiz/result']);
      },
      error: () => {
      }
    });
  }

  formatTime(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(m)}:${pad(s)}`;
  }

  ngOnDestroy(): void {
    this.getDestroySubs();
  }
}
