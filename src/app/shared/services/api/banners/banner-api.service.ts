import {Injectable} from '@angular/core';
import {ApiService} from '../../../../core/services';
import {IResponseApi} from '../../../../core/models';
import {BannerPositionCode, IResBannerActive} from '../../../models/api';

@Injectable({providedIn: 'root'})
export class BannerApiService extends ApiService {
  getBanners(params: { positionCode: BannerPositionCode; platform?: 'miniapp' }) {
    return this.postV1<IResponseApi<IResBannerActive[]>>('/banners/active', {
      positionCode: params.positionCode,
      platform: params.platform ?? 'miniapp',
    });
  }
}
