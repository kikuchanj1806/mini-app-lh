import {Injectable} from '@angular/core';
import {ApiService} from '../../../../core/services';
import {IResPage, IResponseApi} from '../../../../core/models';
import {Observable} from 'rxjs';
import {IHomeContentSection, IPostCategoryMenuItem, IResHomeContent, IResPostDetail, IResPostListItem} from '../../../models/api';

@Injectable({providedIn: 'root'})
export class NewApiService extends ApiService {
  publicList(params: {
    keyword?: string;
    categoryId?: number;
    categorySlug?: string;
    includeChildren?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    return this.postV1<IResponseApi<IResPage<IResPostListItem>>>('/posts/public-list', params);
  }

  publicDetail(idOrSlug: { id?: number; slug?: string }): Observable<IResponseApi<IResPostDetail>> {
    return this.postV1<IResponseApi<IResPostDetail>>('/posts/public-detail', idOrSlug);
  }

  categoryMenu(): Observable<IResponseApi<IPostCategoryMenuItem[]>> {
    return this.postV1<IResponseApi<IPostCategoryMenuItem[]>>('/post-categories/menu', {});
  }

  homeContent(): Observable<IResponseApi<IResHomeContent>> {
    return this.postV1<IResponseApi<IResHomeContent>>('/miniapp/home-content', {});
  }
}
