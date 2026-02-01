import { Injectable, isDevMode } from '@angular/core';
import { HttpClient, provideHttpClient } from "@angular/common/http";
import { provideTransloco, Translation, TranslocoLoader, TranslocoService } from "@jsverse/transloco";
import {AppUrlService} from '../../services/app-url.service';
import {Observable} from 'rxjs';
import {environment} from '../../../../environments';

/**
 * https://jsverse.github.io/transloco/docs/getting-started/installation
 * */
@Injectable({ providedIn: 'root' })
export class TransLocoHttpLoader implements TranslocoLoader {
   constructor(
     private http: HttpClient,
     private urlSvc: AppUrlService
   ) {
   }

  getTranslation(lang: string): Observable<Translation> {
    const url = this.urlSvc.buildAssetUrl(`assets/i18n/${lang}.json`);
    return this.http.get<Translation>(url);
  }
}

export const TransLocoProviders: any[] = [
   TranslocoService,
   provideHttpClient(),
   provideTransloco({
      config: {
         availableLangs: environment.language.availableLangs,
         defaultLang: environment.language.code,
         reRenderOnLangChange: true,
         prodMode: !isDevMode(),
      },
      loader: TransLocoHttpLoader,
   }),
]

