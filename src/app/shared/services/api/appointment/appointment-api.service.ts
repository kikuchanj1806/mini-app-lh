import {ApiService} from '../../../../core/services';
import {Injectable} from '@angular/core';
type TimeSlot = { id: number; start_time: string; end_time: string; max_tickets: number };
@Injectable({ providedIn: 'root' })
export class AppointmentApiService {
  constructor(private api: ApiService) {}

  listFields$(wardId: number) {
    return this.api.get<any>('/api/appointmentfield/list', { ward_id: wardId });
  }

  listTimeSlots$(wardId: number) {
    return this.api.get<any>('/api/timeslot/list', { ward_id: wardId });
  }
}
