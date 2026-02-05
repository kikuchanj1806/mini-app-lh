import {Component, OnDestroy, OnInit, inject} from '@angular/core';
import {Router} from '@angular/router';
import {of, Observable} from 'rxjs';
import {catchError, finalize, map, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {QuestionSetApiService} from '../../../shared/services/api/game/question-set-api.service';
import {QuizStateService} from '../quiz-state.service';
import {IResQuestion, IResQuestionSet} from '../../../shared/models/feature-specific/game/question.model';
import {environment} from '../../../../environments';
import {AppCommonComponent} from '../../../shared/components/app-common.service';
import {IResUserInfo} from '../../../core/models/zmp.model';
import {UserManageService} from '../../../shared/services/feature-specific/user/user-manage.service';
import {AllScope} from '../../../shared/models/feature-specific/zmp.model';

@Component({
  selector: 'app-quiz-start',
  templateUrl: './quiz-start.component.html',
  styleUrls: ['quiz-start.component.scss'],
  standalone: false,
})
export class QuizStartComponent extends AppCommonComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private setApi = inject(QuestionSetApiService);
  private quizState = inject(QuizStateService);
  private userMsService = inject(UserManageService);

  loading = false;

  questionSet: IResQuestionSet | null = null;
  questionsCount = 0;

  // để “start” nhanh, load sẵn questions luôn
  private loadedQuestions: IResQuestion[] = [];

  authReady = false;
  authLoading = false;

  userInfo!: IResUserInfo;
  private appId = String(environment.apiConfig?.appId ?? '');

  ngOnInit(): void {
    const wardId = Number(environment.wardId || 0);
    if (!wardId) return;

    this.loading = true;

    this.setApi.listSet({ward_id: wardId}).pipe(
      map(res => res.data ?? []),
      map((sets) => sets[0] ?? null),
      tap((set) => (this.questionSet = set)),
      switchMap((set) => {
        if (!set) return of([] as IResQuestion[]);
        return this.setApi.listQues({ward_id: wardId, question_set_id: set.id}).pipe(
          map(res => res.data ?? [])
        );
      }),
      tap((qs) => {
        this.loadedQuestions = qs;
        this.questionsCount = qs.length;
      }),
      catchError(() => of([] as IResQuestion[])),
      finalize(() => (this.loading = false)),
      takeUntil(this.destroyed)
    ).subscribe();

    this.userService.userInfo$
      .pipe(takeUntil(this.destroyed))
      .subscribe((info) => {
        if (!(info && info.name)) {
          return;
        }
        if (info) this.userInfo = info;
        this.authReady = !!(info && info.name && this.userMsService.getTokenIfValid());
      });
  }

  private ensureQuizAuth$(): Observable<boolean> {
    if (this.authReady) return of(true);

    const scopes: AllScope[] = ['scope.userInfo', 'scope.userPhonenumber'];
    const appId = this.appId;

    this.authLoading = true;

    return this.userMsService.grantPermissionAndFetchUser$(scopes).pipe(
      switchMap((res) => {
        if (!res) return of(false);

        const {perms, userInfo} = res;
        if (!userInfo) return of(false);

        this.userService.saveGrantAndUser(perms, userInfo);
        this.userInfo = userInfo;

        const phone = (userInfo && userInfo.phoneNumber) ? userInfo.phoneNumber : '';
        return this.userMsService.refresh$(appId, phone).pipe(
          map(() => !!this.userMsService.getTokenIfValid()),
          catchError(() => of(false))
        );
      }),
      finalize(() => (this.authLoading = false))
    );
  }

  onStartClick(): void {

    this.ensureQuizAuth$().pipe(take(1)).subscribe((ok) => {
      console.log('ok', ok)
      if (!ok) {
        return;
      }
      this.start();
    });
  }

  start(): void {
    const wardId = Number(environment.wardId || 0);
    const set = this.questionSet;
    if (!wardId || !set) return;
    if (!this.loadedQuestions.length) return;

    this.quizState.init({
      wardId,
      questionSetId: set.id,
      questions: this.loadedQuestions,
    });

    this.router.navigate(['/quiz/play']);
  }

  onOpenRanking(): void {
    if (this.authLoading) return;
    this.ensureQuizAuth$().pipe(take(1)).subscribe((ok) => {
      if (!ok) {
        return;
      }
      this.router.navigate(['/quiz/ranking']);
    });
  }

  ngOnDestroy(): void {
    this.getDestroySubs();
  }
}
