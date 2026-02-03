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
import {AppService} from './core/services';
import {LayoutComponent} from './layouts/layout.component';
import {AppFooterComponent} from './shared/components/footer/footer.component';
import {AppHeaderComponent} from './shared/components/header/header.component';
import {FloatingAssistComponent} from "./shared/components/actions/floating-assist/floating-assist.component";


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

	 ],
  providers: [
    {provide: APP_BASE_HREF, useValue: environment.zaloBaseHref},
    {provide: LOCALE_ID, useValue: 'vi-VN'},
    {provide: DEFAULT_CURRENCY_CODE, useValue: 'VND'},
    provideAppInitializer(() => inject(AppConfigService).load$()),
    AppService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
