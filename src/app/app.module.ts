import {DEFAULT_CURRENCY_CODE, inject, LOCALE_ID, NgModule, provideAppInitializer} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouterModule} from '@angular/router';
import {APP_BASE_HREF} from '@angular/common';
import {AppComponent} from "./app.component";
import {HttpClientModule} from "@angular/common/http";
import {routes} from "./app.routes";
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {CoreModule} from './core/core.module';
import {SharedCommonModule} from './shared';
import {Select} from 'primeng/select';
import {environment} from '../environments';
import {AppConfigService} from './core/services/app-config.service';
import {BusinessConfigService} from './core/services/business-config.service';
import {AppService} from './core/services';
import {LayoutComponent} from './layouts/layout.component';
import {AppFooterComponent} from './shared/components/footer/footer.component';
import {AppHeaderComponent} from './shared/components/header/header.component';
import {FloatingAssistComponent} from "./shared/components/actions/floating-assist/floating-assist.component";
import {AppLoadDebugOverlayComponent} from './shared/components/debug/app-load-debug-overlay.component';
import {markAppLoad, measureInit} from './core/utils/app-load-timer.util';


@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    AppFooterComponent,
    AppHeaderComponent
  ],
	 imports: [
		  CoreModule,
		  BrowserModule,
		  BrowserAnimationsModule,
		  SharedCommonModule,
		  HttpClientModule,
		  RouterModule.forRoot(routes, {
				useHash: false,
		  }),
		  Select,
		  FloatingAssistComponent,
		  AppLoadDebugOverlayComponent,

	 ],
  providers: [
    {provide: APP_BASE_HREF, useValue: environment.zaloBaseHref},
    {provide: LOCALE_ID, useValue: 'vi-VN'},
    {provide: DEFAULT_CURRENCY_CODE, useValue: 'VND'},
    // Hai initializer dưới đây CHẶN render (app trắng màn tới khi cả hai xong) nên được bọc
    // `measureInit` để tách bạch phần chờ mạng ra khỏi phần bootstrap Angular.
    provideAppInitializer(() => measureInit('init:app-config', inject(AppConfigService).load$())),
    // Branding/OA id/feature flags theo `appId`. `load()` không bao giờ reject nên app vẫn mở được
    // khi mất mạng — chỉ chạy bằng giá trị dự phòng trong environment.
    provideAppInitializer(() => measureInit('init:business-config', inject(BusinessConfigService).load())),
    AppService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {
    // Chạy TRƯỚC các APP_INITIALIZER. Khoảng từ `bootstrap:start` tới đây chính là chi phí dựng
    // platform + eval cây module (JS parse), không dính gì tới mạng.
    markAppLoad('ng-module:constructed');
  }
}
