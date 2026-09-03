import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {ApiService} from '../../../../core/services';
import {IResPage, IResponseApi} from '../../../../core/models';
import {IResProcedureCategory, IResProcedureRef} from '../procedures/procedure-api.service';

export interface IReqCreateDvcQuestion {
  question: string;
  procedureId?: number;
  categoryId?: number;
  citizenName?: string;
  phone?: string;
}

export interface IResDvcQuestionPublicItem {
  id: number;
  code: string;
  procedure: IResProcedureRef | null;
  category: IResProcedureCategory | null;
  question: string;
  answer: string | null;
  isFaq: boolean;
  createdAt: number;
  answeredAt: number | null;
}

export type DvcQuestionStatus = 'new' | 'processing' | 'answered' | 'rejected';

export interface IResDvcQuestionMyItem {
  id: number;
  code: string;
  procedure: IResProcedureRef | null;
  question: string;
  status: DvcQuestionStatus;
  answer: string | null;
  answeredAt: number | null;
  isPublic: boolean;
  createdAt: number;
}

/** Hỏi đáp dịch vụ công — danh sách công khai không cần đăng nhập; gửi câu hỏi cần đăng nhập Zalo. */
@Injectable({providedIn: 'root'})
export class DvcQuestionApiService extends ApiService {
  /** `onlyFaq: true` -> dùng cho màn "Câu hỏi thường gặp". */
  publicList(params: { onlyFaq?: boolean; procedureId?: number; page?: number; pageSize?: number } = {}): Observable<IResponseApi<IResPage<IResDvcQuestionPublicItem>>> {
    return this.postV1<IResponseApi<IResPage<IResDvcQuestionPublicItem>>>('/dvc-questions/public-list', params);
  }

  create(payload: IReqCreateDvcQuestion): Observable<IResponseApi<IResDvcQuestionMyItem>> {
    return this.postV1<IResponseApi<IResDvcQuestionMyItem>>('/customer/dvc-questions/create', payload);
  }

  myList(params: { page?: number; pageSize?: number } = {}): Observable<IResponseApi<IResPage<IResDvcQuestionMyItem>>> {
    return this.postV1<IResponseApi<IResPage<IResDvcQuestionMyItem>>>('/customer/dvc-questions/my-list', params);
  }
}
