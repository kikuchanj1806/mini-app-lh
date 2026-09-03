import 'zone.js';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { markAppLoad } from './app/core/utils/app-load-timer.util';

markAppLoad('bootstrap:start');

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .then(() => markAppLoad('bootstrap:done'))
  .catch(err => console.error(err));
