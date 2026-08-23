import {Injectable} from '@angular/core';
import {ApiService} from '../../../../core/services';
import {IResPage, IResponseApi} from '../../../../core/models';

export const FEEDBACK_FIELDS = [
  { value: 'an_ninh', label: 'An ninh trật tự' },
  { value: 'giao_thong', label: 'Giao thông' },
  { value: 'moi_truong', label: 'Môi trường' },
  { value: 'ha_tang', label: 'Hạ tầng' },
  { value: 'thu_tuc', label: 'Thủ tục hành chính' },
  { value: 'dat_dai', label: 'Đất đai' },
  { value: 'khac', label: 'Khác' },
] as const;

export const FEEDBACK_STATUS_LABEL: Record<string, string> = {
  new: 'Tiếp nhận',
  processing: 'Đang xử lý',
  done: 'Đã xử lý',
  rejected: 'Từ chối',
};

export interface IResUpload {
  id: number;
  url: string;
  filePath: string;
}

export interface IReqCreateFeedback {
  field: string;
  title: string;
  content: string;
  location?: string;
  citizenName?: string;
  phone?: string;
  fileIds: number[];
}

export interface IFeedbackPublicItem {
  id: number;
  code: string;
  field: string;
  title: string;
  location: string | null;
  status: string;
  coverImageUrl: string | null;
  hasReply: boolean;
  createdAt: number;
}

export interface IFeedbackPublicDetail extends IFeedbackPublicItem {
  content: string;
  reply: string | null;
  repliedAt: number | null;
  images: { id: number; url: string }[];
}

export interface IFeedbackMyDetail extends IFeedbackPublicDetail {
  citizenName?: string | null;
  phone?: string | null;
}

export type IResFeedbackItem = IFeedbackPublicItem;

@Injectable({ providedIn: 'root' })
export class FeedbackApiService extends ApiService {
  publicList(params?: { field?: string; page?: number; pageSize?: number }) {
    return this.postV1<IResponseApi<IResPage<IFeedbackPublicItem>>>('/feedbacks/public-list', params ?? {});
  }

  publicDetail(id: number) {
    return this.postV1<IResponseApi<IFeedbackPublicDetail>>('/feedbacks/public-detail', {id});
  }

  upload(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('name', file.name);
    fd.append('type', '50');
    return this.uploadV1<IResponseApi<IResUpload>>('/customer/upload', fd);
  }

  createFeedback(payload: IReqCreateFeedback) {
    return this.postV1<IResponseApi<IFeedbackMyDetail>>('/customer/feedbacks/create', payload);
  }

  myList(params?: { status?: string; page?: number; pageSize?: number }) {
    return this.postV1<IResponseApi<IResPage<IFeedbackPublicItem>>>('/customer/feedbacks/my-list', params ?? {});
  }

  myDetail(id: number) {
    return this.postV1<IResponseApi<IFeedbackMyDetail>>('/customer/feedbacks/my-detail', {id});
  }
}
