import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {BookAppointmentComponent} from './views/book-appointment/book-appointment.component';
import {GetNumberComponent} from './views/get-number/get-number.component';
import {TicketDetailComponent} from './views/ticket-detail/ticket-detail.component';

const routes: Routes = [
  {
    path: 'bookappointment',
    component: BookAppointmentComponent
  },
  {
    path: 'getnumber',
    component: GetNumberComponent
  },
  { path: 'ticket/:id', component: TicketDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BookAppointmentRouting {}
