import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from './views/home/home.component';
import {FeedbackComponent} from './views/feedback/feedback.component';
import {FeedbackPublicComponent} from './views/feedback-public/feedback-public.component';
import {FeedbackMyComponent} from './views/feedback-my/feedback-my.component';
import {NewsLatestComponent} from './views/news/news-latest.component';
import {AskedQuestionsComponent} from './views/asked-questions/asked-questions.component';
import {ReviewComponent} from './views/review/review.component';
import {MapsComponent} from './views/maps/maps.component';
import {NewDetailComponent} from './views/news/new-detail.component';
import {OfficialListComponent} from './views/officials/official-list.component';
import {OfficialDetailComponent} from './views/officials/official-detail.component';
import {NotificationListComponent} from './views/notifications/notification-list.component';
import {NotificationDetailComponent} from './views/notifications/notification-detail.component';
import {WorkScheduleComponent} from './views/work-schedules/work-schedule.component';
import {ProfileComponent} from './views/profile/profile.component';
import {ResidenceComponent} from './views/profile/residence.component';
import {DvcMenuComponent} from './views/procedures/dvc-menu.component';
import {ProcedureListComponent} from './views/procedures/procedure-list.component';
import {ProcedureDetailComponent} from './views/procedures/procedure-detail.component';
import {DvcLookupComponent} from './views/procedures/dvc-lookup.component';
import {DvcQuestionsComponent} from './views/procedures/dvc-questions.component';

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
    path: 'feedback/public',
    component: FeedbackPublicComponent
  },
  {
    path: 'feedback/my',
    component: FeedbackMyComponent
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
  {path: 'officials', component: OfficialListComponent},
  {path: 'officialdetail', component: OfficialDetailComponent},
  {path: 'notifications', component: NotificationListComponent},
  {path: 'notificationdetail', component: NotificationDetailComponent},
  {path: 'workschedule', component: WorkScheduleComponent},
  {path: 'profile', component: ProfileComponent},
  {path: 'profile/residence', component: ResidenceComponent},
  {path: 'dvc', component: DvcMenuComponent},
  {path: 'dvc/tthc', component: ProcedureListComponent},
  {path: 'dvc/tthc/detail', component: ProcedureDetailComponent},
  {path: 'dvc/tra-cuu-ho-so', component: DvcLookupComponent},
  {path: 'dvc/hoi-dap', component: DvcQuestionsComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule {
}
