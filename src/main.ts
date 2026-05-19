import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { enableProdMode, importProvidersFrom, isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { MessageService } from 'primeng/api';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { apiBaseUrlInterceptor } from './app/core/http/api-base-url.interceptor';
import { isElectronRuntime, renderBrowserBlocked } from './app/core/runtime/electron-only';

registerLocaleData(localePt);

if (!isDevMode()) {
  enableProdMode();
}

if (!isElectronRuntime()) {
  renderBrowserBlocked();
} else {
  bootstrapApplication(AppComponent, {
    providers: [
      provideAnimations(),
      provideHttpClient(withInterceptors([apiBaseUrlInterceptor])),
      provideRouter(routes, withComponentInputBinding()),
      MessageService,
      importProvidersFrom(ServiceWorkerModule.register('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000'
      }))
    ]
  }).catch((error: unknown) => console.error(error));
}
