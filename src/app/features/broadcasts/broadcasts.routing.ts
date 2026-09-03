import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {BroadcastListComponent} from './views/broadcast-list/broadcast-list.component';
import {BroadcastDetailComponent} from './views/broadcast-detail/broadcast-detail.component';

const routes: Routes = [
  {
    path: '',
    component: BroadcastListComponent
  },
  {
    path: ':id',
    component: BroadcastDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BroadcastsRoutingModule {}
