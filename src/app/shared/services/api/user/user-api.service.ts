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

export interface IResTthcVideoItem {
  id: number;
  title: string;
  excerpt?: string | null;      // mô tả ngắn
  thumbnail?: string | null;    // ảnh đại diện
  video_url?: string | null;    // link video (youtube/mp4)
  published_at?: number | null; // unix seconds (nếu có)
  created_at?: number | null;   // unix seconds (nếu có)
}

export type TthcVideoListItemVM = {
  id: number;
  title: string;
  subtitle: string;
  thumbnail: string | null;
  publishedMs: number | null;
  raw: IResTthcVideoItem;
};

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

  getWardDetail(params: { ward_id: number }) {
    return this.get<any>(`/api/wards/${params.ward_id}`, {});
  }

  list = (params: any) => {
    return this.get<IResponseApiZma<IResTthcVideoItem[]>>('', params);
  };
}
