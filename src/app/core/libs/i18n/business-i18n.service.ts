import { Injectable } from '@angular/core';
import * as moment from "moment";
import { BehaviorSubject } from "rxjs";
import {
  IBusinessI18nConfig,
  LANGUAGE_ITEM,
  LOCALE_CODE,
  LOCALE_TO_MAPPING_SERVER,
  PERCENT_DECIMAL_DEFAULT
} from './business-i18n.model';
import {ApiService, NotifyService, ZmaNativeStorageService} from '../../services';
import { TranslocoService } from "@jsverse/transloco";
import {ISelectOption} from '../../models/app.model';
import {environment} from '../../../../environments';


@Injectable({
   providedIn: 'root',
})
export class BusinessI18nService {
   isLoadLocaleConfig = false;

   private languageSubject = new BehaviorSubject<LOCALE_CODE>(
     environment.language.code as LOCALE_CODE
   )
   language$ = this.languageSubject.asObservable();

   private configsSubject = new BehaviorSubject<IBusinessI18nConfig>(this.getConfigDefault())
   configs$ = this.configsSubject.asObservable();

   constructor(
     private _transLoco: TranslocoService,
     private _apiService: ApiService,
     private notifyService: NotifyService,
     private zmaStorage: ZmaNativeStorageService,
   ) {
      this.initialize();
   }

   private initialize() {
      let langDefault = this.zmaStorage.getPure('languageDefault');

      const language = langDefault && typeof langDefault === 'string' ? langDefault : environment.language.code;

      this.setLanguage(language, true);
   }

   getLocaleConfigs(): IBusinessI18nConfig {
      return this.configsSubject.value;
   }

   setLocaleConfigs(newConfigs: IBusinessI18nConfig): void {
      this.configsSubject.next(newConfigs);
   }

   getLocale(): string {
      const { locale } = this.getLocaleConfigs()
      return locale;
   }

   private getConfigDefault(): IBusinessI18nConfig {
      return {
         locale: 'vi-VN',
         currency: {
            code: 'VND',
            display: '',
         },
         timezone: 'Asia/Ho_Chi_Minh',
         percentDecimals: PERCENT_DECIMAL_DEFAULT
      }
   }

   private _getLocaleCodeMapping(locale: string) {
      return LOCALE_TO_MAPPING_SERVER[locale.toLowerCase()] as LOCALE_CODE;
   }

   // TODO: gọi API lấy cài đặt locale của đơn vị, hiện chưa implement.
   loadBusinessLocaleSettings() {
      if (this.isLoadLocaleConfig) {
         return;
      }
   }


   setLanguage(code: string, isDefault = false) {
      if (!code){
         code = environment.language.code;
      }
      if (!isDefault) {
         this.notifyService.success('common.notify.settingSuccess');
      }

      moment.locale(code);
      this.languageSubject.next(code as LOCALE_CODE);
      this._transLoco.setActiveLang(code);
      this.zmaStorage.setPure('languageDefault', code);
   }

   getLanguages(): ISelectOption[] {
      return environment.language.availableLangs.map(item => {
         return {
            value: item.id,
            label: item.label,
         }
      })
   }

   getLanguage(): LANGUAGE_ITEM | undefined {
      return environment.language.availableLangs.find(l => l.id == this.getLanguageCode())
   }

   getLanguageCode(): LOCALE_CODE {
      return this.languageSubject.value;
   }

}
