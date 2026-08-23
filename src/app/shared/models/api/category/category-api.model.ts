
export interface ILoadCategoryParams {
  parentId?: number
}
export interface IResLoadCategory {
  id: string;
  parentId: string;
  code: string;
  name: string;
  viewLink: string;
  image: string;
  description: string;
  childs?: IResLoadCategory[];
}

export interface IProductByCategoryParams {
  categoryId: string,
  page?: number,
  icpp?: number,
  loadAttr?: boolean,
  forceReload?: boolean // Chỉ check cho FE
}
