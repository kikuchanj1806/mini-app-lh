import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {IResponseApiM, IResQuestion, IResQuestionSet} from '../../../models/feature-specific/game/question.model';
import {ApiService} from '../../../../core/services';

export interface IReqSubmitQuizResult {
  ward_id: number;
  question_set_id?: number; // nếu BE chưa có cột thì bỏ
  correct_count: number;
  duration_seconds: number;
}

export interface IResQuizResult {
  id: number;
  ward_id: number;
  user_id: number;
  correct_count: number;
  duration_seconds: number;
  created_at?: number;
}

export interface IResQuizRankingItem {
  id: number;
  ward_id: number;
  user_id: number;
  user_name: string;
  correct_count: number;
  duration_seconds: number;
  created_at: string; // ISO string
}

@Injectable({ providedIn: 'root' })
export class QuestionSetApiService extends ApiService {
  listSet(params: { ward_id: number }): Observable<IResponseApiM<IResQuestionSet[]>> {
    return this.get<IResponseApiM<IResQuestionSet[]>>('/api/question-sets/list', params);
  }

  listQues(params: { ward_id: number; question_set_id: number }): Observable<IResponseApiM<IResQuestion[]>> {
    return this.get<IResponseApiM<IResQuestion[]>>('/api/questions/list', params);
  }

  storeZma(payload: IReqSubmitQuizResult): Observable<IResponseApiM<IResQuizResult>> {
    return this.post<IResponseApiM<IResQuizResult>>('/api/zma/quiz-results-zma', payload);
  }

  ranking(params: { ward_id: number; limit?: number }): Observable<IResponseApiM<IResQuizRankingItem[]>> {
    return this.get<IResponseApiM<IResQuizRankingItem[]>>('/api/zma/quiz-results-zma/ranking', params);
  }
}
