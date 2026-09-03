import {IAddressLocation} from '../models/global';
import {IResProduct, IResProductChild, IResProductDetail} from '../models/api';

type TicketConflictCode =
  | 'SLOT_FULL'
  | 'FIELD_DAILY_LIMIT_REACHED'
  | 'USER_DAILY_LIMIT_REACHED'
  | 'DUPLICATE_BOOKING';

/**
 * Đọc lỗi 409 nghiệp vụ (lấy số thứ tự) từ error đã được ApiService chuẩn hoá
 * (xem ApiService.handleError — errorCode/messages/status được gắn lên Error,
 * KHÔNG còn là HttpErrorResponse gốc tới đây nữa).
 */
export function parse409(err: unknown): { code?: TicketConflictCode; message?: string } | null {
  const e: any = err;
  if (!e || e.status !== 409) return null;

  return { code: e.errorCode, message: Array.isArray(e.messages) ? e.messages[0] : e.message };
}

// Dùng để nối xã, quận(huyện), tỉnh -> full address
export function fullAddress(item: { address?: string; location?: IAddressLocation }): string {
  const parts: string[] = [];

  const addr = (item.address || '').trim();
  if (addr) parts.push(addr);

  const loc = item.location || {} as IAddressLocation;
  const locParts = [
    (loc.wardName || '').trim(),
    (loc.districtName || '').trim(),
    (loc.cityName || '').trim()
  ].filter(s => !!s);

  if (locParts.length) parts.push(locParts.join(', '));

  return parts.join(', ');
}


// Dùng để convert cấu trúc product ở list product -> product detail
// => do chưa xác định được cấu trúc chuẩn
export function toProductDetail(p: IResProduct): IResProductDetail {
  const mapChild = (c: IResProduct): IResProductChild => {
    const price = c.prices?.price ?? 0;
    const priceOld = c.prices?.priceOld ?? 0;
    const childImage =
      c.image ??
      (Array.isArray(c.images?.others) && c.images.others.length > 0 ? c.images.others[0] : '');
    const qtyAvail = (c.inventory?.available ?? c.inventory?.remain ?? 0) as number;

    const size =
      (c as any)?.options?.size ??
      (Array.isArray(c.availableSizes) && c.availableSizes.length > 0 ? c.availableSizes[0] : '') ??
      '';

    const color =
      (c as any)?.options?.color ??
      (Array.isArray(c.availableColors) && c.availableColors.length > 0 ? c.availableColors[0] : '') ??
      '';

    return {
      id: c.id as number,
      code: c.code ?? '',
      name: c.name ?? '',
      image: childImage,
      price: price,
      priceOld: priceOld,
      quantityAvailable: qtyAvail,
      size: c && c.size ? c.size : '',
      color: c && c.color ? c.color : '',
    };
  };

  const children: IResProductChild[] = Array.isArray(p.childs) ? p.childs.map(mapChild) : [];

  return {
    id: p.id as number,
    parentId: p.parentId ?? '',
    code: p.code ?? '',
    name: p.name ?? '',
    status: p.status ?? 0,

    image: p.image ?? '',
    images: Array.isArray(p.images?.others) ? p.images.others : [],

    description: '',
    content: '',

    price: p.prices?.price ?? 0,
    priceOld: p.prices?.priceOld ?? 0,
    priceAfterDiscount: p.prices?.priceAfterDiscount ?? 0,
    contactPrice: p.prices?.contactPrice ?? 0,

    availableColors: Array.isArray(p.availableColors) ? p.availableColors : [],
    availableSizes: Array.isArray(p.availableSizes) ? p.availableSizes : [],

    brandId: String(p.brand?.id ?? ''),
    categoryId: String(p.category?.id ?? ''),

    childs: children,
  };
}
