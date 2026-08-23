export interface IResDataDefault<T = any[]> {
  totalPages: number,
  totalItems: number,
  page: number,
  pageSize?: number,
  result: T
}

export interface IResPage<T> {
  totalPages: number;
  totalItems: number;
  page: number;
  pageSize: number;
  result: T[];
}

export interface IResponseApi<T = IResDataDefault, TMess = any[]> {
  code: number,
  errorCode: string | null,
  statusCode?: number, // Header status code
  messages: TMess,
  data: T,
}

/** @deprecated Chỉ giữ cho các endpoint legacy /api/zma hoặc API cũ chưa migrate. */
export interface IResponseApiZma<T = IResDataDefault, TMess = any[]> {
  status: string,
  data: T,
  http_code: number
}
