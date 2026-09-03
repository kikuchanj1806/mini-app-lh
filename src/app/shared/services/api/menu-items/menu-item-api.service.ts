import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {IResponseApi} from '../../../../core/models';
import {ApiService} from '../../../../core/services';

export interface IResMenuItemActive {
  id: number;
  label: string;
  description: string | null;
  icon: string | null;
  iconClass: string | null;
  actionType: 'route' | 'url' | 'webview' | 'post_category' | 'post_detail' | 'procedure_list' | 'procedure_detail' | 'phone' | 'oa' | 'none';
  linkType: 'route' | 'url' | 'webview' | 'phone' | 'none';
  link: string | null;
  ref: { type: string; id: number; slug?: string; name?: string; title?: string } | null;
}

@Injectable({providedIn: 'root'})
export class MenuItemApiService extends ApiService {
  active(groupKey = 'home_utilities'): Observable<IResponseApi<IResMenuItemActive[]>> {
    return this.postV1<IResponseApi<IResMenuItemActive[]>>('/menu-items/active', {groupKey});
  }
}
