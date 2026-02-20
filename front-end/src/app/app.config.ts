import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor, errorInterceptor } from './core';import { provideZard } from '@/shared/core/provider/providezard';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // provideZard is an application provider and must not be passed as an HTTP interceptor
    provideZard(),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
  ],
};
