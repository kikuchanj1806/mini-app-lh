import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {HomeRoutingModule} from "./home.routing";
import {I18nFormatCurrencyAmountPipe} from '../../shared/pipes/global';
import {SharedCommonModule} from '../../shared';
import {HomeComponent} from './views/home/home.component';
import {HomeHeroComponent} from './views/home/components/home-hero/home-hero.component';
import {HomeBannerHeroComponent} from './views/home/components/home-banner-hero/home-banner-hero.component';
import {HomeQuickActionsComponent} from './views/home/components/home-quick-actions/home-quick-actions.component';
import {HomeWelcomeCardComponent} from './views/home/components/home-welcome-card/home-welcome-card.component';
import {HomeStatsComponent} from './views/home/components/home-stats/home-stats.component';
import {HomeBannerMidComponent} from './views/home/components/home-banner-mid/home-banner-mid.component';
import {HomeFeaturedToolsComponent} from './views/home/components/home-featured-tools/home-featured-tools.component';
import {HomeBannerStripComponent} from './views/home/components/home-banner-strip/home-banner-strip.component';
import {HomeNewsComponent} from './views/home/components/home-news/home-news.component';
import {HomeFollowOaComponent} from './views/home/components/home-follow-oa/home-follow-oa.component';
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
    OfficialListComponent,
    OfficialDetailComponent,
    NotificationListComponent,
    NotificationDetailComponent,
    WorkScheduleComponent,
    ProfileComponent,
    ResidenceComponent,
    DvcMenuComponent,
    ProcedureListComponent,
    ProcedureDetailComponent,
    DvcLookupComponent,
    DvcQuestionsComponent
  ],
  imports: [
    CommonModule,
    HomeRoutingModule,
    I18nFormatCurrencyAmountPipe,
    SharedCommonModule,
    HomeHeroComponent,
    HomeBannerHeroComponent,
    HomeQuickActionsComponent,
    HomeWelcomeCardComponent,
    HomeStatsComponent,
    HomeBannerMidComponent,
    HomeFeaturedToolsComponent,
    HomeBannerStripComponent,
    HomeNewsComponent,
    HomeFollowOaComponent,
  ]
})
export class HomeModule {}
