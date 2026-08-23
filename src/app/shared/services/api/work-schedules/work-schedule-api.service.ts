import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {ApiService} from '../../../../core/services';
import {IResponseApi} from '../../../../core/models';
import {IResWorkScheduleGroup} from '../../../models/api';

/** Lịch công tác — nhóm public (tenant), không cần đăng nhập. */
@Injectable({providedIn: 'root'})
export class WorkScheduleApiService extends ApiService {
  /** Bỏ trống khoảng ngày thì BE trả về tuần hiện tại. */
  publicList(params: { fromDate?: string; toDate?: string } = {}): Observable<IResponseApi<IResWorkScheduleGroup[]>> {
    return this.postV1<IResponseApi<IResWorkScheduleGroup[]>>('/work-schedules/public-list', params);
  }
}
