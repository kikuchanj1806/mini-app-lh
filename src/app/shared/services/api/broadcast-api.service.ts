import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {PUBLIC_API_ENDPOINTS} from '../../../core/constants';
import {IResponseApi} from '../../../core/models';
import {ApiCacheService, ApiService} from '../../../core/services';
import {environment} from '../../../../environments';

export interface IPublicBroadcastChannel {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  iconUrl?: string | null;
  streamUrl?: string | null;
  sortOrder?: number | null;
}

export interface IPublicBroadcastItem {
  id: number;
  title: string;
  slug?: string | null;
  summary?: string | null;
  category?: string | null;
  channel?: IPublicBroadcastChannel | null;
  audioUrl?: string | null;
  durationSeconds?: number | null;
  isUrgent?: boolean;
  publishedAt?: string | number | null;
  scheduledAt?: string | number | null;
  createdAt?: string | number | null;
}

export interface IPublicBroadcastDetail extends IPublicBroadcastItem {
  content?: string | null;
  updatedAt?: string | number | null;
}

export interface IPublicBroadcastListResponse {
  totalPages: number;
  totalItems: number;
  page: number;
  pageSize: number;
  result: IPublicBroadcastItem[];
}

export interface IPublicBroadcastListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  channelId?: number;
  channelSlug?: string;
  category?: string;
  isUrgent?: boolean;
}

@Injectable({providedIn: 'root'})
export class BroadcastApiService {
  private static readonly LIST_CACHE_TTL_MS = 2 * 60_000;
  private static readonly CHANNEL_CACHE_TTL_MS = 10 * 60_000;

  private readonly api = inject(ApiService);
  private readonly cache = inject(ApiCacheService);
  private readonly appId = String(environment.apiConfig?.appId ?? '');

  channels(): Observable<IResponseApi<IPublicBroadcastChannel[]>> {
    const payload = this.withAppId({});

    return this.cache.wrap(
      'broadcasts.channels',
      () => this.api.postGuestRequest<IResponseApi<IPublicBroadcastChannel[]>>(
        PUBLIC_API_ENDPOINTS.BROADCAST_CHANNELS,
        payload
      ),
      {
        ttlMs: BroadcastApiService.CHANNEL_CACHE_TTL_MS,
        cacheIf: res => res?.code === 1,
      }
    );
  }

  latest(channelSlug?: string): Observable<IResponseApi<IPublicBroadcastItem | null>> {
    const payload = this.withAppId(channelSlug ? {channelSlug} : {});

    return this.cache.wrap(
      `broadcasts.latest:${JSON.stringify(payload)}`,
      () => this.api.postGuestRequest<IResponseApi<IPublicBroadcastItem | null>>(
        PUBLIC_API_ENDPOINTS.BROADCAST_LATEST,
        payload
      ),
      {
        ttlMs: BroadcastApiService.LIST_CACHE_TTL_MS,
        cacheIf: res => res?.code === 1,
      }
    );
  }

  list(params: IPublicBroadcastListParams = {}): Observable<IResponseApi<IPublicBroadcastListResponse>> {
    const payload = this.withAppId(params);

    return this.cache.wrap(
      `broadcasts.list:${JSON.stringify(payload)}`,
      () => this.api.postGuestRequest<IResponseApi<IPublicBroadcastListResponse>>(
        PUBLIC_API_ENDPOINTS.BROADCAST_PUBLIC_LIST,
        payload
      ),
      {
        ttlMs: BroadcastApiService.LIST_CACHE_TTL_MS,
        cacheIf: res => res?.code === 1,
      }
    );
  }

  detail(idOrSlug: string | number): Observable<IResponseApi<IPublicBroadcastDetail>> {
    const value = String(idOrSlug);
    const payload = /^\d+$/.test(value)
      ? {id: Number(value)}
      : {slug: value};

    return this.api.postGuestRequest<IResponseApi<IPublicBroadcastDetail>>(
      PUBLIC_API_ENDPOINTS.BROADCAST_PUBLIC_DETAIL,
      this.withAppId(payload)
    );
  }

  private withAppId<T extends object>(params: T): Record<string, unknown> {
    return {
      ...params,
      appId: this.appId,
    };
  }
}
