// Danh sách tin tức
export interface ISearchNewsListParam {
  limit: number;
}

export interface IResNewsList {
  id: number;
  title: string;
  intro: string;
  image: string;
  categoryId: number;
  publishedDate: string;
  content: string;
  fullName: string;
  hits: number;
}

// Chi tiết tin tức
export interface INewDetailParams {
  id: number
}
export type IResNewsDetail = IResNewsList;

// Lấy danh sách danh mục tin tức
export interface IGetCategoryNewsParams {
  parentId?: number
}
export interface IResGetCategoryNews {
  id: number;
  name: string;
  imageUri: string;
  childs: IResGetCategoryNews[];
  parentId: number,
  description: string;
}
