import {Injectable} from '@angular/core';
import {ApiService} from '../../../../core/services';
import {IResponseApi} from '../../../../core/models';
import {Observable} from 'rxjs';
import {IResOfficialGroup, IResOfficialPublicDetail} from '../../../models/api';

/** Danh bạ cán bộ — nhóm public (tenant), không cần đăng nhập. */
@Injectable({providedIn: 'root'})
export class OfficialApiService extends ApiService {
  publicList(params: { keyword?: string; departmentId?: number } = {}): Observable<IResponseApi<IResOfficialGroup[]>> {
    return this.postV1<IResponseApi<IResOfficialGroup[]>>('/officials/public-list', params);
  }

  publicDetail(id: number): Observable<IResponseApi<IResOfficialPublicDetail>> {
    return this.postV1<IResponseApi<IResOfficialPublicDetail>>('/officials/public-detail', {id});
  }
}
