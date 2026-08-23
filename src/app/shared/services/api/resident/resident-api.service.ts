import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {ApiService} from '../../../../core/services';
import {IResponseApi} from '../../../../core/models';
import {IReqResidentChangePayload, IReqResidentDeclare, IResAreaOption, IResMyResident} from '../../../models/api';

@Injectable({providedIn: 'root'})
export class ResidentApiService extends ApiService {
  myProfile(): Observable<IResponseApi<IResMyResident | null>> {
    return this.postV1<IResponseApi<IResMyResident | null>>('/customer/residents/my-profile', {});
  }

  declare(payload: IReqResidentDeclare): Observable<IResponseApi<IResMyResident>> {
    return this.postV1<IResponseApi<IResMyResident>>('/customer/residents/declare', payload);
  }

  requestChange(payload: IReqResidentChangePayload): Observable<IResponseApi<IResMyResident>> {
    return this.postV1<IResponseApi<IResMyResident>>('/customer/residents/request-change', {payload});
  }

  areaOptions(): Observable<IResponseApi<IResAreaOption[]>> {
    return this.postV1<IResponseApi<IResAreaOption[]>>('/customer/areas/options', {});
  }
}
