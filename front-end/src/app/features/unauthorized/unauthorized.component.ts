import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="text-center">
        <h1 class="text-6xl font-bold text-gray-900">403</h1>
        <h2 class="mt-4 text-2xl font-semibold text-gray-700">Accès non autorisé</h2>
        <p class="mt-2 text-gray-600">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <a routerLink="/" class="btn-primary mt-6 inline-block">
          Retour à l'accueil
        </a>
      </div>
    </div>
  `,
})
export class UnauthorizedComponent {}
