import { Params } from "@angular/router";

export const isArray = Array.isArray || ((arr) => arr && typeof arr.length === 'number');

export function isObject(o: any): boolean {
   return o != null && typeof o === 'object'
}

export function castFloat(value: string | number | any): number {
   if (isNaN(value) || !value) {
      return 0;
   }
   return parseFloat(String(value));
}

export function castFloatFixed(value: string | number) {
   return parseFloat(String(value)).toFixed(2);
}

export function castInt(value: string | number | any): number {
   if (isNaN(value) || !value) {
      return 0;
   }
   return parseInt(String(value));
}

export function castString(value: string | number): string {
   return String(value);
}


export function arraysAreEqual(arrA: any[], arrB: any[]) {
   if (!isArray(arrA) || !isArray(arrB)) {
      return false;
   }
   if (arrA.length !== arrB.length) {
      return false;
   }
   const allElementsInAExistInB = arrA.every(itemA => arrB.includes(itemA));
   const allElementsInBExistInA = arrB.every(itemB => arrA.includes(itemB));
   return allElementsInAExistInB && allElementsInBExistInA;
}


export function parseUrlFromParamsUri(baseUrl?: string, queryParams?: Params) {
   if (!baseUrl) {
      return '';
   }
   const searchParams = new URLSearchParams(queryParams ? queryParams : {});
   return `${ baseUrl }?${ searchParams.toString() }`;
}



export function convertValueToArray(value: any) {
   if (!value && !isArray(value)) {
      return [];
   }
   if (value && !isArray(value)) {
      return [value]
   }
   return value
}


export function flattenUriConsts(obj: Record<any, any>): string[] {
   let result: string[] = [];
   for (const key in obj) {
      if (typeof obj[key] === 'object') {
         result = result.concat(flattenUriConsts(obj[key]));
      } else {
         result.push(obj[key]);
      }
   }
   return result;
}

/** Chia và làm tròn lên — hay dùng để tính số trang từ limit & totalItems. */
export function ceilDivision(dividend: number, divisor: number) {
   if (!dividend || !dividend) return 0;

   if (dividend < divisor) {
      return 1;
   }

   return Math.ceil(dividend / divisor);
}
