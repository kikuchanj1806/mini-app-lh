import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {QuizStartComponent} from './views/quiz-start.component';
import {QuizPlayComponent} from './views/quiz-play.component';
import {QuizResultComponent} from './views/quiz-result.component';
import {QuizRankingComponent} from './views/quiz-ranking.component';

const routes: Routes = [
  {path: '', component: QuizStartComponent},
  {path: 'play', component: QuizPlayComponent},
  {path: 'result', component: QuizResultComponent},
  {path: 'ranking', component: QuizRankingComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class QuizRouting {
}
