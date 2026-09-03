import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {ApiService} from '../../../../core/services';
import {IResPage, IResponseApi} from '../../../../core/models';

export interface IResProcedureCategory {
  id: number;
  code: string;
  name: string;
}

export interface IResProcedureRef {
  id: number;
  code: string | null;
  name: string;
}

export interface IResProcedurePublicItem {
  id: number;
  category: IResProcedureCategory | null;
  code: string | null;
  name: string;
  serviceLevel: 'toan_trinh' | 'mot_phan' | null;
  summary: string | null;
  hasOnlineSubmit: boolean;
}

export interface IResProcedurePublicDetail extends IResProcedurePublicItem {
  documents: string[];
  feeText: string | null;
  durationText: string | null;
  submitPlace: string | null;
  legalBasis: string | null;
  onlineUrl: string | null;
  onlineMode: 'webview' | 'browser' | 'none';
  formFileUrl: string | null;
}

/** Thủ tục hành chính (TTHC) — tra cứu công khai, không cần đăng nhập. */
@Injectable({providedIn: 'root'})
export class ProcedureApiService extends ApiService {
  categoryOptions(): Observable<IResponseApi<IResProcedureCategory[]>> {
    return this.postV1<IResponseApi<IResProcedureCategory[]>>('/procedure-categories/options', {});
  }

  publicList(params: { keyword?: string; categoryId?: number; page?: number; pageSize?: number } = {}): Observable<IResponseApi<IResPage<IResProcedurePublicItem>>> {
    return this.postV1<IResponseApi<IResPage<IResProcedurePublicItem>>>('/procedures/public-list', params);
  }

  publicDetail(id: number): Observable<IResponseApi<IResProcedurePublicDetail>> {
    return this.postV1<IResponseApi<IResProcedurePublicDetail>>('/procedures/public-detail', {id});
  }
}
