import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {I18nFormatCurrencyAmountPipe} from '../../shared/pipes/global';
import {SharedCommonModule} from '../../shared';
import {QuizRouting} from './quiz-routing';
import {QuizStartComponent} from './views/quiz-start.component';
import {QuizPlayComponent} from './views/quiz-play.component';
import {QuizResultComponent} from './views/quiz-result.component';
import {QuizRankingComponent} from './views/quiz-ranking.component';

@NgModule({
  declarations: [
    QuizStartComponent,
    QuizPlayComponent,
    QuizResultComponent,
    QuizRankingComponent
  ],
  imports: [
    CommonModule,
    QuizRouting,
    I18nFormatCurrencyAmountPipe,
    SharedCommonModule,
  ]
})
export class QuizModule {}
