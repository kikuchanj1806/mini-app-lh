import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';
import localeEn from '@angular/common/locales/en';
import localeJA from '@angular/common/locales/ja';
import {LOCALE_CODE} from './business-i18n.model';

interface LocaleDefinition {
   data: any;
   code: LOCALE_CODE;
}

const LOCALES: LocaleDefinition[] = [
   { data: localeVi, code: 'vi-VN' },
   { data: localeEn, code: 'en-US' },
   { data: localeJA, code: 'ja-JP' },
];

export function registerLocales() {
   LOCALES.forEach(locale => {
      registerLocaleData(locale.data, locale.code);
   });
}
