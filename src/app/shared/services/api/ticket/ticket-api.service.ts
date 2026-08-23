import {Injectable} from '@angular/core';
import {ApiService} from '../../../../core/services';
import {IResponseApi} from '../../../../core/models';
import {TicketStatus} from '../../../utils';

export interface IZmaTicketFieldRef {
  id: number;
  name: string;
}

export interface IZmaTicketTimeSlotRef {
  id: number;
  startTime: string;
  endTime: string;
}

/** Khớp thẳng camelCase trả về từ AppointmentTicket::toMyListItem()/toMyDetail() phía BE. */
export interface IZmaTicket {
  id: number;
  ticketCode: string;
  orderNumber: number;
  ticketDate: string; // "2026-08-16"
  status: TicketStatus;
  field: IZmaTicketFieldRef | null;
  timeSlot: IZmaTicketTimeSlotRef | null;
  createdAt: number; // epoch ms
}

export interface IZmaTicketDetail extends IZmaTicket {
  qrToken: string;
  updatedAt: number;
}

export interface IZmaTicketListData {
  totalPages: number;
  totalItems: number;
  page: number;
  pageSize: number;
  result: IZmaTicket[];
}

@Injectable({ providedIn: 'root' })
export class ZmaTicketApiService {
  constructor(private api: ApiService) {}

  createTicket$(payload: { fieldId: number; timeSlotId: number; idempotencyKey: string }) {
    return this.api.post<IResponseApi<IZmaTicketDetail>>('/api/v1/customer/appointment-tickets/create', payload);
  }

  myTickets(params?: { ticketDate?: string }) {
    return this.api.post<IResponseApi<IZmaTicketListData>>('/api/v1/customer/appointment-tickets/my-list', params ?? {});
  }

  showTicket(id: number) {
    return this.api.post<IResponseApi<IZmaTicketDetail>>('/api/v1/customer/appointment-tickets/detail', { id });
  }
}
