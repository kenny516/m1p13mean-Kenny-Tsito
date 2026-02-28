import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideImageKit } from '@imagekit/angular';
import { routes } from './app.routes';
import { authInterceptor, errorInterceptor } from './core';
import { provideZard } from '@/shared/core/provider/providezard';
import { environment } from '../environments/environment';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideZard(),
    provideImageKit({
      urlEndpoint: environment.imagekit.urlEndpoint,
    }),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideCharts(withDefaultRegisterables()),
  ],
};
