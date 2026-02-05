import {Injectable} from '@angular/core';
import {ApiService} from '../../../../core/services';
import {IResponseApi} from '../../../../core/models';
import {IResBanner} from '../../../models/api';

@Injectable({providedIn: 'root'})
export class BannerApiService extends ApiService {
  getBanners(params: { ward_id: number, position_key: string }) {
    return this.get<IResponseApi<IResBanner[]>>('/api/public/banners', params);
  }
}
