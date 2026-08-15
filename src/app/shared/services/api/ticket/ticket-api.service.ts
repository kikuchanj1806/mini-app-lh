import {Injectable} from '@angular/core';
import {ApiService} from '../../../../core/services';
import {IResponseApi} from '../../../../core/models';

export interface IZmaTicket {
  id: number;
  orderNumber: number;
  ticketCode: string;
  qrToken: string;
  status: number;

  wardName?: string;
  serviceName?: string;
  startTime?: string; // "07:00"
  endTime?: string;   // "08:30"
  appointmentDate?: string; // "2026-04-02"
  createdAt?: number;
}

export interface IZmaTicketApi {
  id: number;
  orderNumber: string | number;
  ticketCode: string;
  qrToken: string;
  status: string | number;

  createdAt?: number;
  created_at?: number;
  updatedAt?: number;
  updatedById?: number | null;
  appointmentDate?: string;
  appointment_date?: string;

  ward?: { id: number; name: string };
  user?: { id: number; name: string };

  serviceField?: { id: number; name?: string; title?: string };
  timeSlot?: { id: number; startTime?: string; endTime?: string; start_time?: string; end_time?: string };
}

export type ITicketDetailUI = {
  id: number;
  orderNumber: number;
  fieldIndex: number;
  fieldName: string;
  timeRange: string;
  statusText: string;
  createdAtText: string;
  qrText: string;
  ticketCode: string;
};

@Injectable({ providedIn: 'root' })
export class ZmaTicketApiService {
  constructor(private api: ApiService) {}

  createTicket$(payload: { ward_id: number; service_field_id: number; time_slot_id: number; message_token?: string }) {
    return this.api.post<any>('/api/zma/tickets', payload);
  }

  myTickets(params?: { date?: string }) {
    return this.api.get<IResponseApi<any[]>>('/api/zma/tickets/me', params);
  }

  showTicket(id: number) {
    return this.api.get<IResponseApi<any>>(`/api/zma/tickets/${id}`);
  }
}
