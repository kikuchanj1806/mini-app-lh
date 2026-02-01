import { OnDestroy, Pipe, PipeTransform } from "@angular/core";
import {BaseNumberImpureI18nPipe} from '../base-number-impure-i18n.pipe';
import {BusinessI18nService, IOtpPipeI18n} from '../../../../../core/libs';
import {IntegerOpts} from '../number/i18n-format-integer.pipe';
import {DecimalPipe} from '@angular/common';
import {castFloat, validIsNumber} from '../../../../utils';

type PercentDecimalOpts = IOtpPipeI18n & {
   notSuffix?: boolean,
}

@Pipe({
   standalone: true,
   name: 'i18nPercentDecimal'
})
export class I18nFormatPercentDecimalPipe  extends BaseNumberImpureI18nPipe<IntegerOpts> implements PipeTransform, OnDestroy {

   constructor(
     private decimalPipe: DecimalPipe,
     businessI18nService: BusinessI18nService,
   ) {
      super(businessI18nService);
   }

   ngOnDestroy() {
      this.destroy()
   }


   protected formatValue(value: any, opts: PercentDecimalOpts = {}): string | null {
      if (castFloat(value) == 0 && !opts.showZeroValue) {
         return null;
      }
      if (!validIsNumber(value)) {
         return null;
      }

      if (opts.abs){
         value = Math.abs(value);
      }

      const digitsInfo: string | undefined = `1.0-2`;

      const result = this.decimalPipe.transform(value, digitsInfo);

      let suffix = '%';
      if (opts && opts.notSuffix) {
         suffix = '';
      }

      return `${ result }${ suffix }`;
   }

   /**
    * Optional: So sánh opts cũ - mới (shallow check)
    * để biết có cần re-format hay không
    */
   protected override isSameOpts(oldOpts?: PercentDecimalOpts, newOpts?: PercentDecimalOpts): boolean {
      if (oldOpts === newOpts) return true;
      if (!oldOpts || !newOpts) return false;

      return (
        oldOpts.showZeroValue === newOpts.showZeroValue &&
        oldOpts.abs === newOpts.abs &&
        oldOpts.notSuffix === newOpts.notSuffix
      );
   }
}
