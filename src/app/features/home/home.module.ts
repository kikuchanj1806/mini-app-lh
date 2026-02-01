import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {HomeRoutingModule} from "./home.routing";
import {I18nFormatCurrencyAmountPipe} from '../../shared/pipes/global';
import {SharedCommonModule} from '../../shared';
import {UniversalSlideComponent} from '../../shared/components/actions';
import {HomeComponent} from './views/home/home.component';
import {FeedbackComponent} from './views/feedback/feedback.component';
import {NewsLatestComponent} from './views/news/news-latest.component';
import {AskedQuestionsComponent} from './views/asked-questions/asked-questions.component';
import {ReviewComponent} from './views/review/review.component';
import {MapsComponent} from './views/maps/maps.component';

@NgModule({
  declarations: [
    HomeComponent,
    FeedbackComponent,
    NewsLatestComponent,
    AskedQuestionsComponent,
    ReviewComponent,
    MapsComponent
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
