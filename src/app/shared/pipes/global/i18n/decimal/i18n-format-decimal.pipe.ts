import { OnDestroy, Pipe, PipeTransform } from "@angular/core";
import { DecimalPipe } from "@angular/common";
import {BaseNumberImpureI18nPipe} from '../base-number-impure-i18n.pipe';
import {BusinessI18nService, IOtpPipeI18n} from '../../../../../core/libs';
import {castFloat, castInt, validIsNumber} from '../../../../utils';


type DecimalOpts = IOtpPipeI18n & {
   suffix?: string,
}

@Pipe({
   standalone: true,
   name: 'i18nDecimal'
})
export class I18nFormatDecimalPipe  extends BaseNumberImpureI18nPipe<DecimalOpts> implements PipeTransform, OnDestroy {

   constructor(
     private decimalPipe: DecimalPipe,
     public businessI18: BusinessI18nService,
   ) {
      super(businessI18);
   }

   ngOnDestroy() {
      this.destroy()
   }


   protected formatValue(value: any, opts: DecimalOpts = {}): string | null {
      if (castFloat(value) == 0 && !opts.showZeroValue) {
         return null;
      }
      if (!validIsNumber(value)) {
         return null;
      }

      if (opts.abs){
         value = Math.abs(value);
      }

      const digitsInfo: string | undefined = `1.0-${ castInt(2) }`;

      const result = this.decimalPipe.transform(value, digitsInfo);
      const suffix = opts && opts.suffix ? opts.suffix : '';
      return `${ result }${ suffix }`;
   }

   /**
    * Optional: So sánh opts cũ - mới (shallow check)
    * để biết có cần re-format hay không
    */
   protected override isSameOpts(oldOpts?: DecimalOpts, newOpts?: DecimalOpts): boolean {
      if (oldOpts === newOpts) return true;
      if (!oldOpts || !newOpts) return false;

      return (
        oldOpts.showZeroValue === newOpts.showZeroValue &&
        oldOpts.abs === newOpts.abs &&
        oldOpts.suffix === newOpts.suffix
      );
   }
}
