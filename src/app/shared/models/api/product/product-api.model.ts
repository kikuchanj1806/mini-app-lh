// Danh sách sản phẩm
export interface ISearchProductParams {
  limit?: number,
  loadAttr?: boolean,
  icpp?: number;
  page?: number;
}

export interface IResProduct {
  id: number;
  parentId: string;
  code: string;
  name: string;
  status: number;
  category: IResCategory;
  prices: IResPrices;
  vat: number;
  image: string;
  images: IResImages;
  brand: IResBrand;
  type: number;
  unit: string;
  inventory: IResInventory;
  createdDateTime: string;
  availableColors: string[],
  availableSizes: string[]
  childs: IResProduct[];
  options: any,
  size?: string, // CHỉ sử dụng ở FE
  color?: string // CHỉ sử dụng ở FE
}

export interface ISearchProductResponse {
  totalPages: number;
  totalItems: number;
  page: number;
  pageSize: number;
  category?: any;
  result: IResProduct[];
}

interface IResCategory {
  id: number;
  name: string;
}

interface IResPrices {
  contactPrice: number;
  price: number;
  wholesale: number;
  priceOld: number;
  priceAfterDiscount: number;
  calcDiscountPercent: number;
}

interface IResImages {
  others: string[];
}

interface IResBrand {
  id: number;
  name: string;
}

interface IResInventory {
  remain: number;
  shipping: number;
  damaged: number;
  holding: number;
  available: number;
}

// Chi tiết sản phẩm

export interface IProductDetailParams {
  id: number
}
export interface IResProductDetail {
  id: number;
  parentId: string;
  code: string;
  name: string;
  status: number;
  image: string;
  images: string[];
  description: string;
  content: string;
  price: number;
  priceOld: number;
  priceAfterDiscount: number;
  contactPrice: number;
  availableColors: string[] | null;
  availableSizes: string[] | null;
  brandId: string;
  categoryId: string;
  childs: IResProductChild[];
}

export interface IResProductChild {
  id: number;
  code: string;
  name: string;
  image: string;
  price: number;
  priceOld: number;
  quantityAvailable: number;
  size: string;
  color: string;
}

// related product
export interface IRelatedProductParams {
  loadAttr: boolean;
  limit: number;
  id: number;
  isUpSale?: boolean;
  categoryId?: number;
  excludedIds?: number[];
}

// Flash sale
export interface IProductPromotionParams {
  limit?: number,
  loadAttr?: number
}

export interface IResProductPromotion {
  product: IResProduct[],
  promotion: IResPromotion
}

export interface IResPromotion {
  id: string;
  image: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  banner: string;
}
