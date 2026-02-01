
// Danh sách danh mục
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

// Lấy danh sách sản phẩm theo danh mục
export interface IProductByCategoryParams {
  categoryId: string,
  page?: number,
  icpp?: number,
  loadAttr?: boolean,
  forceReload?: boolean // Chỉ check cho FE
}
