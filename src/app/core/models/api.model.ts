export interface IResDataDefault<T = any[]> {
  totalPages: number,
  totalItems: number,
  page: number,
  result: T
}

export interface IResponseApi<T = IResDataDefault, TMess = any[]> {
  code: number,
  errorCode: string | null,
  statusCode?: number, // Header status code
  messages: TMess,
  data: T,
}
