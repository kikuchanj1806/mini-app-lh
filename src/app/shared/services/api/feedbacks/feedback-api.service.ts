import {Injectable} from '@angular/core';
import {ApiService} from '../../../../core/services';

export interface IResUpload {
  status: 'success' | 'error';
  path: string;
  url: string;
}

export interface IReqCreateFeedback {
  ward_id: number;
  title: string;
  content: string;
  image: string | null; // lưu PATH hoặc null
}

export interface IResFeedbackItem {
  id: number;
  ward_id: number;
  user_id: number;
  title: string;
  content: string;
  image: string | null;
  status: number;
  created_at?: number;
  updated_at?: number;
}


export interface IResponseApi<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

export interface IReqUploadZma {
  wardId: number;          // hoặc ward_id tuỳ BE
  type?: number;           // default = 1
  psName?: string;         // default = 's'
  itemName?: string;       // default = 's'
}

@Injectable({ providedIn: 'root' })
export class FeedbackApiService extends ApiService {
  uploadFile = (fileData: FormData) => {
    const endpoint = '/api/zma/upload';
    return this.postFormDataRequestProgress<IResUpload>(endpoint, fileData);
  };
  createFeedback(payload: IReqCreateFeedback) {
    return this.post<IResponseApi<IResFeedbackItem>>('/api/zma/feedbacks', payload);
  }
}
