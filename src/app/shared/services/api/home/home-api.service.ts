import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {ApiService} from '../../../../core/services';
import {IResponseApi} from '../../../../core/models';
import {IResHomeAbove, IResHomeBelow} from '../../../models/api';

@Injectable({providedIn: 'root'})
export class HomeApiService extends ApiService {
  above(): Observable<IResponseApi<IResHomeAbove>> {
    return this.postV1<IResponseApi<IResHomeAbove>>('/miniapp/home/above', {});
  }

  below(): Observable<IResponseApi<IResHomeBelow>> {
    return this.postV1<IResponseApi<IResHomeBelow>>('/miniapp/home/below', {});
  }
}
