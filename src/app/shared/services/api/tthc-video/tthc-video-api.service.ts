import {Injectable} from '@angular/core';
import {ApiService} from '../../../../core/services';
import {IResponseApiZma} from '../../../../core/models';
import {IResTthcVideoItem} from '../user/user-api.service';


@Injectable({providedIn: 'root'})
export class TthcVideoApiService extends ApiService {
  listPublic = (params: any) => {
    return this.get<IResponseApiZma<IResTthcVideoItem[]>>('/api/public/tthc-videos', params);
  };
}
