import { Injectable } from '@angular/core';
import {IResQuestion, OptionKey} from '../../shared/models/feature-specific/game/question.model';
import {IResQuizResult} from '../../shared/services/api/game/question-set-api.service';

export interface QuizSnapshot {
  wardId: number;
  questionSetId: number;
  questions: IResQuestion[];
  answers: Record<number, OptionKey>;
  startedAtMs: number;
  finishedAtMs: number;
  submitResult?: IResQuizResult;
}

@Injectable({ providedIn: 'root' })
export class QuizStateService {
  private state: QuizSnapshot | null = null;

  get snapshot(): QuizSnapshot | null {
    return this.state;
  }

  init(payload: { wardId: number; questionSetId: number; questions: IResQuestion[] }): void {
    this.state = {
      wardId: payload.wardId,
      questionSetId: payload.questionSetId,
      questions: payload.questions,
      answers: {},
      startedAtMs: 0,
      finishedAtMs: 0,
    };
  }

  setAnswer(questionId: number, opt: OptionKey): void {
    if (!this.state) return;
    this.state.answers = { ...this.state.answers, [questionId]: opt };
  }

  startTimer(): void {
    if (!this.state) return;
    if (!this.state.startedAtMs) this.state.startedAtMs = Date.now();
  }

  stopTimer(): void {
    if (!this.state) return;
    if (!this.state.finishedAtMs) this.state.finishedAtMs = Date.now();
  }

  getElapsedSeconds(): number {
    if (!this.state?.startedAtMs) return 0;
    const end = this.state.finishedAtMs ?? Date.now();
    return Math.max(0, Math.floor((end - this.state.startedAtMs) / 1000));
  }

  getDurationSeconds(): number {
    const s = this.snapshot;
    if (!s) return 0;
    const startedAt = s.startedAtMs; // nên là number
    return Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  }

  setSubmitResult(result: IResQuizResult): void {
    if (!this.state) return;
    this.state = { ...this.state, submitResult: result };
  }

  reset(): void {
    this.state = null;
  }
}
