import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent, FooterComponent, ToastComponent } from './shared';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastComponent],
  template: `
    <div class="flex flex-col min-h-screen">
      <app-header class="sticky top-0 z-50" />
      <main class="flex-1">
        <router-outlet />
      </main>
      <app-footer />
      <app-toast />
    </div>
  `,
})
export class AppComponent {
  title = 'mean-mall';
}
