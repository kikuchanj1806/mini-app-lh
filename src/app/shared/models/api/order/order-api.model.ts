// Thông tin vận chuyển
export interface IOrderCarrier {
  id: number;
  logo: string;
  serviceId: number;
  serviceName: string;
  serviceCode: string;
  serviceDesc: string;
  declaredFee: number;
  customerShipFee: number;
}

export interface IOrderProduct {
  productId: string;
  quantity: number;
  price: number;
  weight?: number;
}

export interface ISaveOrderParams {
  customer: {
    name: string;
    mobile: string;
    address: string;
  };
  location: {
    cityId: number;
    districtId: number;
    wardId: number;
  };
  orders: {
    couponCode: string;
    couponValue: number; //Chỉ dùng ở FE
    description: string;
    totalOrderAmount: number;
    carrier: IOrderCarrier;
    products: IOrderProduct[];
  };
}

export interface IResCalculateFee {
  carrierId: number;
  carrierName: string;
  logo: string;
  serviceId: number;
  serviceName: string;
  serviceDescription: string;
  declaredFee: number;
  customerShipFee: number;
}

export interface ICalculateFeeParams {
  weight?: number, //Khối lượng đơn hàng
  totalMoney: number, //Tổng giá trị sản phẩm
  products: string, // Sản phẩm trong đơn
  discount?: number, // Chiết khấu đơn hàng theo số tiền
  totalCod?: number, //Tổng tiền phải thu khách hàng
  toCityId: number, //ID tỉnh/thành phố người nhận
  toDistrictId: number //ID quận/huyện người nhận
  toWardId: number //ID xã người nhận
}

export interface ICheckVoucherParams {
  voucherCode: string[],
  totalMoney: number,
  productIds: string
}

export interface IResCheckVoucher {
  code: string;
  valid: 0 | 1;                 // 1 = hợp lệ, 0 = không hợp lệ
  value?: number;               // chỉ có khi valid = 1
  useCouponPromotion?: 1;       // = 1 nếu là coupon promotion
  productPrice?: Record<string, number> | number[]; // có khi là promotion theo sp/danh mục
  totalMoney?: number;          // tổng tiền sau/cho lần áp mã
  reason?: string;              // chỉ có khi valid = 0 (message)
}

// Đăng kí hmac
export interface IPaymentHMACParams {
  amount: number;
  item: PaymentItem[];
  desc: string;
  extradata: ExtraData;
  method: 'BANK_SANDBOX' | string;
}

export interface PaymentItem {
  id: string;
  price: number;
  quantity: number;
}

export interface ExtraData {
  subtotal: number;
  shippingFee: number;
}

// Interface API Tracking
export interface ITrackingOrderParams {
  mobile: string,
  status?: number
}

export interface IResOrderTracking {
  id: string;
  customer: IResCustomer;
  shipToCityLocationId: string;
  shipToDistrictLocationId: string;
  shipToWardLocationId: string;
  shipFee: string;
  customerShipFee: string;
  createdDate: number;
  createdTime: string;
  status: number;
  description: string;
  calculateTotalMoney: number;
  estimatedPrice: number;
  moneyDiscount: number;
  paymentMethod: string;
  products: IResProductTrackingDetail[];
}

export interface IResProductTrackingDetail {
  id: number;
  code: string;
  name: string;
  otherName: string;
  status: string;
  prices: IProductLitePrices;
  image: string;
  attribute: {
    color: string,
    size: string
  };
  quantity: number;
}

export interface IProductLitePrices {
  contactPrice: number;
  price: number;
  wholesale: number;
  priceOld: number;
  priceAfterDiscount: number;
  calcDiscountPercent: number;
}

export interface IResCustomer {
  name: string;
  mobile: string;
  email: string;
  address: string;
}

export interface ITrackingOrderDetailParams {
  id: number,
}

export interface IStatusTrackingOrderParams {
  mobile: string,
  act: string
}

export interface IResStatusTrackingOrder {
  status: number,
  count: number
}
