import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Hero Section -->
      <section class="bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div class="text-center">
            <h1
              class="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl"
            >
              Bienvenue sur <span class="text-primary">MEAN Mall</span>
            </h1>
            <p class="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Votre centre commercial en ligne. Découvrez des milliers de
              produits de vendeurs locaux et faites vos achats en toute
              confiance.
            </p>
            <div class="mt-8 flex justify-center gap-4">
              @if (!isAuthenticated()) {
                <a
                  routerLink="/auth/register"
                  class="btn-primary px-8 py-3 text-lg"
                >
                  Commencer maintenant
                </a>
                <a
                  routerLink="/buyer/products"
                  class="btn-outline px-8 py-3 text-lg"
                >
                  Voir les produits
                </a>
              } @else {
                <a
                  routerLink="/buyer/products"
                  class="btn-primary px-8 py-3 text-lg"
                >
                  Explorer les produits
                </a>
                @if (user()?.role === 'SELLER') {
                  <a routerLink="/seller" class="btn-outline px-8 py-3 text-lg">
                    Ma boutique
                  </a>
                }
              }
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold text-gray-900">
              Pourquoi choisir MEAN Mall ?
            </h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- Feature 1 -->
            <div class="card p-6 text-center">
              <div
                class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">
                Paiements sécurisés
              </h3>
              <p class="text-gray-600">
                Vos transactions sont protégées grâce à notre système de
                portefeuille intégré.
              </p>
            </div>

            <!-- Feature 2 -->
            <div class="card p-6 text-center">
              <div
                class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">
                Vendeurs vérifiés
              </h3>
              <p class="text-gray-600">
                Toutes les boutiques sont validées par notre équipe avant de
                pouvoir vendre.
              </p>
            </div>

            <!-- Feature 3 -->
            <div class="card p-6 text-center">
              <div
                class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">
                Livraison rapide
              </h3>
              <p class="text-gray-600">
                Suivez vos commandes en temps réel et recevez vos produits
                rapidement.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      @if (!isAuthenticated()) {
        <section class="bg-primary py-16">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 class="text-3xl font-bold text-white">Prêt à commencer ?</h2>
            <p class="mt-4 text-lg text-white/80">
              Rejoignez des milliers d'acheteurs et vendeurs sur notre
              plateforme.
            </p>
            <div class="mt-8 flex justify-center gap-4">
              <a
                routerLink="/auth/register"
                class="btn bg-white text-primary hover:bg-gray-100 px-8 py-3"
              >
                Créer un compte acheteur
              </a>
              <a
                routerLink="/auth/register"
                class="btn border-2 border-white text-white hover:bg-white/10 px-8 py-3"
              >
                Devenir vendeur
              </a>
            </div>
          </div>
        </section>
      }
    </div>
  `,
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authService.currentUser;
  isAuthenticated = this.authService.isAuthenticated;

  ngOnInit(): void {
    // Rediriger selon le rôle si l'utilisateur est connecté
    if (this.isAuthenticated()) {
      const role = this.user()?.role;
      switch (role) {
        case 'BUYER':
          this.router.navigate(['/buyer/products']);
          break;
        case 'SELLER':
          this.router.navigate(['/seller']);
          break;
        case 'ADMIN':
          this.router.navigate(['/admin']);
          break;
      }
    }
  }
}
