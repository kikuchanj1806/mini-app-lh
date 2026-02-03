import {Injectable} from '@angular/core';
import {ApiService} from '../../../../core/services';
import {IResponseApi} from '../../../../core/models';
import {Observable} from 'rxjs';

export interface INewsCategory {
  id: number;
  name: string;
}

export interface INewsWard {
  id: number;
  name: string;
}

export interface IResNewsItem {
  id: number;
  title: string;
  status: number;
  published_at: number;
  expired_at: string | null;
  thumbnail: string | null;
  excerpt: string | null;
  content: string | null;
  category: INewsCategory;
  ward: INewsWard;
  created_at: number; // unix seconds
  updated_at: number; // unix seconds
}

@Injectable({providedIn: 'root'})
export class NewApiService extends ApiService {
  newsList(params: any) {
    return this.get<IResponseApi<IResNewsItem[]>>('/api/news', params);
  }

  newsDetail(id: number): Observable<IResponseApi<IResNewsItem>> {
    return this.get<IResponseApi<IResNewsItem>>(`/api/news/${id}`, {});
  }
}
