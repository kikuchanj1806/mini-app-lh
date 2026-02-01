import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'productPriceHtml',
  standalone: true
})
export class ProductPriceHtmlPipe implements PipeTransform {

  transform(product: any): string {
    if (!product || !product.prices) return '<span class="price fw-semibold">Liên hệ</span>';

    const { price, priceOld, priceAfterDiscount, contactPrice, calcDiscountPercent } = product.prices;

    if (contactPrice || !price) return '<span class="price fw-semibold">Liên hệ</span>';

    let html = '';

    // Hiển thị % giảm
    if (calcDiscountPercent && calcDiscountPercent > 0) {
      html += `<span class="discount-pill">Giảm ${calcDiscountPercent}%</span>`;
    }

    // Có giá khuyến mãi
    if (priceAfterDiscount) {
      html += `<div class="prices">
                <span class="text-muted text-decoration-line-through">${this.format(price)}</span>
                <span class="price fw-semibold">${this.format(priceAfterDiscount)}</span>
              </div>`;
      return html;
    }

    // Có giá cũ
    if (priceOld) {
      html += `<div class="prices">
                <span class="text-muted text-decoration-line-through">${this.format(priceOld)}</span>
                <span class="price fw-semibold">${this.format(price)}</span>
              </div>`;
      return html;
    }

    // Chỉ có giá mới
    html += `<div class="prices">
              <span class="price fw-semibold">${this.format(price)}</span>
            </div>`;
    return html;
  }

  private format(value: number): string {
    if (value == null || isNaN(value)) return '';
    return value.toLocaleString('vi-VN') + '₫';
  }
}
