import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {SharedCommonModule} from '../../shared';
import {BroadcastsRoutingModule} from './broadcasts.routing';
import {BroadcastDetailComponent} from './views/broadcast-detail/broadcast-detail.component';
import {BroadcastListComponent} from './views/broadcast-list/broadcast-list.component';

@NgModule({
  declarations: [
    BroadcastDetailComponent,
    BroadcastListComponent,
  ],
  imports: [
    CommonModule,
    SharedCommonModule,
    BroadcastsRoutingModule,
  ]
})
export class BroadcastsModule {}
