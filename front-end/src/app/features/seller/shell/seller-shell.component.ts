import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';

@Component({
  selector: 'app-seller-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ZardCardComponent,
    ZardButtonComponent,
  ],
  template: `
    <div class="min-h-screen bg-muted/30 py-6">
      <div class="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div class="grid gap-6 lg:grid-cols-[280px_1fr]">
          <z-card class="h-fit p-4 lg:sticky lg:top-24">
            <div class="mb-4 space-y-1 border-b border-border pb-4">
              <h2 class="text-lg font-semibold text-foreground">Espace vendeur</h2>
              <p class="text-sm text-muted-foreground">Gérez vos boutiques, produits et stock.</p>
            </div>

            <nav class="space-y-2">
              <a
                z-button
                zType="ghost"
                class="w-full justify-start rounded-md"
                routerLink="/seller/shops"
                routerLinkActive="bg-muted"
                [routerLinkActiveOptions]="{ exact: true }"
              >
                Mes boutiques
              </a>
              <a
                z-button
                zType="ghost"
                class="w-full justify-start rounded-md"
                routerLink="/seller/products"
                routerLinkActive="bg-muted"
                [routerLinkActiveOptions]="{ exact: true }"
              >
                Produits
              </a>
              <a
                z-button
                zType="ghost"
                class="w-full justify-start rounded-md"
                routerLink="/seller/stock-movements"
                routerLinkActive="bg-muted"
                [routerLinkActiveOptions]="{ exact: true }"
              >
                Mouvements de stock
              </a>
              <a
                z-button
                zType="ghost"
                class="w-full justify-start rounded-md"
                routerLink="/seller/stock-movement-lines"
                routerLinkActive="bg-muted"
                [routerLinkActiveOptions]="{ exact: true }"
              >
                Lignes de mouvement
              </a>
            </nav>

            <div class="mt-4 border-t border-border pt-4">
              <a z-button zType="outline" class="w-full" routerLink="/">Retour au catalogue</a>
            </div>
          </z-card>

          <div class="min-w-0">
            <router-outlet />
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SellerShellComponent {}
