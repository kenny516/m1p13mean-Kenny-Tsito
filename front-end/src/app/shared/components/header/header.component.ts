import { Component, inject, OnInit } from '@angular/core';

import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, CartService } from '../../../core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <a [routerLink]="getHomeRoute()" class="flex items-center space-x-2">
            <span class="text-2xl">🛒</span>
            <span class="text-xl font-bold text-gray-900">MEAN Mall</span>
          </a>

          <!-- Navigation -->
          <nav class="hidden md:flex items-center space-x-8">
            <a
              [routerLink]="getHomeRoute()"
              routerLinkActive="text-primary"
              [routerLinkActiveOptions]="{ exact: true }"
              class="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Accueil
            </a>
            @if (showProductsMenu()) {
              <a
                routerLink="/buyer/products"
                routerLinkActive="text-primary"
                class="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Produits
              </a>
            }
          </nav>

          <!-- Actions utilisateur -->
          <div class="flex items-center space-x-4">
            @if (isAuthenticated()) {
              @if (user(); as userData) {
                <!-- Panier (pour les acheteurs) -->
                @if (userData.role === 'BUYER') {
                  <a
                    routerLink="/buyer/cart"
                    class="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    @if (cartItemCount() > 0) {
                      <span
                        class="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1"
                      >
                        {{ cartItemCount() > 99 ? '99+' : cartItemCount() }}
                      </span>
                    }
                  </a>
                }

                <!-- Menu utilisateur -->
                <div class="relative group">
                  <button
                    class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div
                      class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium"
                    >
                      {{ getInitials(userData) }}
                    </div>
                    <span
                      class="hidden sm:block text-sm font-medium text-gray-700"
                    >
                      {{ userData.profile.firstName }}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  <!-- Dropdown menu -->
                  <div
                    class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
                  >
                    <div class="py-2">
                      <a
                        routerLink="/profile"
                        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Mon profil
                      </a>

                      @if (userData.role === 'SELLER') {
                        <a
                          routerLink="/seller"
                          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Ma boutique
                        </a>
                      }

                      @if (userData.role === 'ADMIN') {
                        <a
                          routerLink="/admin"
                          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Administration
                        </a>
                      }

                      @if (userData.role === 'BUYER') {
                        <a
                          routerLink="/buyer/orders"
                          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Mes commandes
                        </a>
                      }

                      <hr class="my-2" />

                      <button
                        (click)="logout()"
                        class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Se déconnecter
                      </button>
                    </div>
                  </div>
                </div>
              }
            } @else {
              <a routerLink="/auth/login" class="btn-outline">Connexion</a>
              <a routerLink="/auth/register" class="btn-primary">Inscription</a>
            }
          </div>
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  private cartService = inject(CartService);

  user = this.authService.currentUser;
  isAuthenticated = this.authService.isAuthenticated;
  cartItemCount = this.cartService.cartItemCount;

  ngOnInit(): void {
    // Charger le panier si l'utilisateur est un BUYER connecté
    if (this.isAuthenticated() && this.user()?.role === 'BUYER') {
      this.cartService.getCart().catch(() => {
        // Ignorer si le panier n'existe pas encore
      });
    }
  }

  getInitials(user: {
    profile?: { firstName?: string; lastName?: string };
  }): string {
    const firstName = user.profile?.firstName || '';
    const lastName = user.profile?.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
  }

  logout(): void {
    this.cartService.resetCart();
    this.authService.logout();
  }

  getHomeRoute(): string {
    if (!this.isAuthenticated()) return '/';

    const role = this.user()?.role;
    if (role === 'SELLER') return '/seller';
    if (role === 'BUYER') return '/buyer/products';
    if (role === 'ADMIN') return '/admin';
    return '/';
  }

  showProductsMenu(): boolean {
    if (!this.isAuthenticated()) return true;
    return this.user()?.role !== 'BUYER';
  }
}
