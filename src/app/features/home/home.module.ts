import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {HomeRoutingModule} from "./home.routing";
import {I18nFormatCurrencyAmountPipe} from '../../shared/pipes/global';
import {SharedCommonModule} from '../../shared';
import {UniversalSlideComponent} from '../../shared/components/actions';
import {HomeComponent} from './views/home/home.component';
import {FeedbackComponent} from './views/feedback/feedback.component';
import {FeedbackPublicComponent} from './views/feedback-public/feedback-public.component';
import {FeedbackMyComponent} from './views/feedback-my/feedback-my.component';
import {NewsLatestComponent} from './views/news/news-latest.component';
import {AskedQuestionsComponent} from './views/asked-questions/asked-questions.component';
import {ReviewComponent} from './views/review/review.component';
import {MapsComponent} from './views/maps/maps.component';
import {NewDetailComponent} from './views/news/new-detail.component';
import {TthcVideoListComponent} from './views/tthc-video/tthc-video-list.component';
import {TthcVideoPlayerComponent} from './views/tthc-video/tthc-video-player.component';
import {OfficialListComponent} from './views/officials/official-list.component';
import {OfficialDetailComponent} from './views/officials/official-detail.component';
import {NotificationListComponent} from './views/notifications/notification-list.component';
import {NotificationDetailComponent} from './views/notifications/notification-detail.component';
import {WorkScheduleComponent} from './views/work-schedules/work-schedule.component';
import {ProfileComponent} from './views/profile/profile.component';
import {ResidenceComponent} from './views/profile/residence.component';

@NgModule({
  declarations: [
    HomeComponent,
    FeedbackComponent,
    FeedbackPublicComponent,
    FeedbackMyComponent,
    NewsLatestComponent,
    AskedQuestionsComponent,
    ReviewComponent,
    MapsComponent,
    NewDetailComponent,
    TthcVideoListComponent,
    TthcVideoPlayerComponent,
    OfficialListComponent,
    OfficialDetailComponent,
    NotificationListComponent,
    NotificationDetailComponent,
    WorkScheduleComponent,
    ProfileComponent,
    ResidenceComponent
  ],
  imports: [
    CommonModule,
    HomeRoutingModule,
    I18nFormatCurrencyAmountPipe,
    SharedCommonModule,
    UniversalSlideComponent,
  ]
})
export class HomeModule {}
