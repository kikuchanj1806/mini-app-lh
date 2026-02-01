import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {I18nFormatCurrencyAmountPipe} from '../../shared/pipes/global';
import {SharedCommonModule} from '../../shared';
import {UniversalSlideComponent} from '../../shared/components/actions';
import {BookAppointmentComponent} from './views/book-appointment/book-appointment.component';
import {BookAppointmentRouting} from './book-appointment.routing';
import {GetNumberComponent} from './views/get-number/get-number.component';
import {TicketDetailComponent} from './views/ticket-detail/ticket-detail.component';

@NgModule({
  declarations: [
    BookAppointmentComponent,
    GetNumberComponent,
    TicketDetailComponent
  ],
  imports: [
    CommonModule,
    BookAppointmentRouting,
    I18nFormatCurrencyAmountPipe,
    SharedCommonModule,
    UniversalSlideComponent,
  ]
})
export class BookAppointmentModule {}
