import { Component } from '@angular/core';


@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  template: `
    <footer class="bg-gray-100 mt-auto py-8 border-t">
      <div class="container mx-auto px-4 text-center">
        <p class="text-gray-600">© 2026 - Marketplace Centre Commercial</p>
        <p class="mt-2 text-gray-700">
          Développé par <strong class="text-gray-900">Kenny</strong> &
          <strong class="text-gray-900">Tsito</strong>
        </p>
        <p class="text-sm text-gray-500">Master 1 - Promotion 13</p>
        <a
          href="https://github.com/kenny516/m1p13mean-Kenny-Tsito"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-2 inline-block text-primary hover:underline"
        >
          Voir le code source
        </a>
      </div>
    </footer>
  `,
})
export class FooterComponent {}
