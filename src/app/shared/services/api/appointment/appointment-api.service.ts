import {ApiService} from '../../../../core/services';
import {Injectable} from '@angular/core';
import {IResponseApi} from '../../../../core/models';

export interface IAppointmentFieldOption {
  id: number;
  name: string;
  code: string | null;
  dailyLimit: number;
  isActive: boolean;
  remaining: number;
}

export interface IAppointmentTimeSlotOption {
  id: number;
  startTime: string;
  endTime: string;
  maxTickets: number;
  isActive: boolean;
  remaining: number;
  alreadyBooked: boolean;
}

/**
 * Danh mục Lĩnh vực / Khung giờ cho khách chọn khi lấy số — cả 2 endpoint đều yêu cầu đăng
 * nhập (auth:customer) vì `remaining`/`alreadyBooked` tính theo đúng khách đang gọi.
 */
@Injectable({ providedIn: 'root' })
export class AppointmentApiService {
  constructor(private api: ApiService) {}

  listFields$() {
    return this.api.post<IResponseApi<IAppointmentFieldOption[]>>('/api/v1/customer/appointment-fields/list', {});
  }

  /** Sức chứa khung giờ (R3) tính theo (ngày, field, slot) — luôn cần fieldId đã chọn trước. */
  listTimeSlots$(fieldId: number) {
    return this.api.post<IResponseApi<IAppointmentTimeSlotOption[]>>(
      '/api/v1/customer/appointment-time-slots/list',
      { fieldId },
    );
  }
}
