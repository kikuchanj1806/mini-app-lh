import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from './views/home/home.component';
import {FeedbackComponent} from './views/feedback/feedback.component';
import {NewsLatestComponent} from './views/news/news-latest.component';
import {AskedQuestionsComponent} from './views/asked-questions/asked-questions.component';
import {ReviewComponent} from './views/review/review.component';
import {MapsComponent} from './views/maps/maps.component';
import {NewDetailComponent} from './views/news/new-detail.component';
import {TthcVideoListComponent} from './views/tthc-video/tthc-video-list.component';
import {TthcVideoPlayerComponent} from './views/tthc-video/tthc-video-player.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'feedback',
    component: FeedbackComponent
  },
  {
    path: 'news',
    component: NewsLatestComponent
  },
  {
    path: 'asked',
    component: AskedQuestionsComponent
  },
  {
    path: 'review',
    component: ReviewComponent
  },
  {
    path: 'map',
    component: MapsComponent
  },
  {
    path: 'newdetail',
    component: NewDetailComponent
  },
  {path: 'tthc/videos', component: TthcVideoListComponent},
  {path: 'tthc/videos/player', component: TthcVideoPlayerComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule {
}
