import {Injectable} from '@angular/core';
import {ApiService} from '../../../../core/services';
import {
  IResPhoneNumber,
  ISendMessageZmaParams,
  IUserFeedBackRequestParams,
  IUserPhoneRequestParams, IZaloSyncUserPayload
} from '../../../models/global';
import {IResponseApi, IResponseApiZma} from '../../../../core/models';
import {uriApiConst} from '../../../constants';

@Injectable({providedIn: 'root'})
export class UserApiService extends ApiService {

  getPhoneNumber = (params: IUserPhoneRequestParams) => {
    return this.post<IResponseApiZma<IResPhoneNumber>>(uriApiConst.user.phone, {...params});
  };

  syncZaloUser = (payload: IZaloSyncUserPayload) => {
    return this.post<IResponseApi<any>>('/api/zma/users/sync', payload);
  };

  syncAuth = (payload: { appId: string; zaloAccessToken: string, phone?: number }) => {
    return this.post<IResponseApi<any>>('/api/zma/auth/sync', payload);
  };

  sendFeedback = (params: IUserFeedBackRequestParams) => {
    return this.post<IResponseApi>(uriApiConst.user.feedback, params)
  }

  sendMessageZma = (params: ISendMessageZmaParams) => {
    return this.post<IResponseApi>(uriApiConst.user.sendMessageZma, params)
  }
}
