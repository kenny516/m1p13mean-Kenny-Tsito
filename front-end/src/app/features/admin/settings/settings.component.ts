import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, ToastService } from '@/core';
import { Settings, SETTINGS_GROUPS } from '@/core/models/settings.model';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardLabelComponent } from '@/shared/components/label';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { ZardSpinnerComponent } from '@/shared/components/spinner';
import { ZardSwitchComponent } from '@/shared/components/switch';
import { ZardSeparatorComponent } from '@/shared/components/separator';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardInputDirective,
    ZardLabelComponent,
    ZardIconComponent,
    ZardSkeletonComponent,
    ZardSpinnerComponent,
    ZardSwitchComponent,
    ZardSeparatorComponent,
  ],
  template: `
    <div class="min-h-screen bg-muted/30 py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-foreground">
            Paramètres de la plateforme
          </h1>
          <p class="mt-1 text-muted-foreground">
            Configurez les paramètres globaux de la marketplace
          </p>
        </div>

        @if (isLoading()) {
          <!-- Loading State -->
          <div class="space-y-6">
            @for (i of [1, 2, 3, 4]; track i) {
              <z-card class="p-6">
                <z-skeleton class="h-6 w-1/3 mb-4" />
                <div class="space-y-4">
                  <z-skeleton class="h-10 w-full" />
                  <z-skeleton class="h-10 w-full" />
                </div>
              </z-card>
            }
          </div>
        } @else if (settings()) {
          <form (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- Section Commission -->
            <z-card class="overflow-hidden">
              <div class="px-6 py-4 bg-muted/50 border-b border-border">
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-lg bg-primary/10">
                    <z-icon zType="percent" class="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 class="text-lg font-semibold text-foreground">
                      Commission
                    </h2>
                    <p class="text-sm text-muted-foreground">
                      Paramètres de commission des boutiques
                    </p>
                  </div>
                </div>
              </div>
              <div class="p-6 space-y-4">
                <div>
                  <z-label for="defaultCommissionRate">
                    Taux de commission par défaut (%)
                  </z-label>
                  <div class="flex items-center gap-2 mt-1">
                    <input
                      z-input
                      type="number"
                      id="defaultCommissionRate"
                      [(ngModel)]="formData.defaultCommissionRate"
                      name="defaultCommissionRate"
                      min="0"
                      max="100"
                      step="0.1"
                      class="w-32"
                    />
                    <span class="text-muted-foreground">%</span>
                  </div>
                  <p class="mt-1 text-sm text-muted-foreground">
                    Ce taux sera appliqué par défaut aux nouvelles boutiques
                  </p>
                </div>
              </div>
            </z-card>

            <!-- Section Panier -->
            <z-card class="overflow-hidden">
              <div class="px-6 py-4 bg-muted/50 border-b border-border">
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-lg bg-orange-500/10">
                    <z-icon
                      zType="shopping-cart"
                      class="h-5 w-5 text-orange-500"
                    />
                  </div>
                  <div>
                    <h2 class="text-lg font-semibold text-foreground">Panier</h2>
                    <p class="text-sm text-muted-foreground">
                      Durée de vie et paramètres du panier
                    </p>
                  </div>
                </div>
              </div>
              <div class="p-6 space-y-4">
                <div>
                  <z-label for="cartTTLMinutes">
                    Durée de vie du panier (minutes)
                  </z-label>
                  <div class="flex items-center gap-2 mt-1">
                    <input
                      z-input
                      type="number"
                      id="cartTTLMinutes"
                      [(ngModel)]="formData.cartTTLMinutes"
                      name="cartTTLMinutes"
                      min="5"
                      max="1440"
                      class="w-32"
                    />
                    <span class="text-muted-foreground">minutes</span>
                  </div>
                  <p class="mt-1 text-sm text-muted-foreground">
                    Le stock réservé sera libéré après cette durée (5 min - 24h)
                  </p>
                </div>
              </div>
            </z-card>

            <!-- Section Stock -->
            <z-card class="overflow-hidden">
              <div class="px-6 py-4 bg-muted/50 border-b border-border">
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-lg bg-blue-500/10">
                    <z-icon zType="package" class="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h2 class="text-lg font-semibold text-foreground">Stock</h2>
                    <p class="text-sm text-muted-foreground">
                      Seuils d'alerte de stock
                    </p>
                  </div>
                </div>
              </div>
              <div class="p-6 space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <z-label for="lowStockThreshold">
                      Seuil d'alerte stock bas
                    </z-label>
                    <input
                      z-input
                      type="number"
                      id="lowStockThreshold"
                      [(ngModel)]="formData.lowStockThreshold"
                      name="lowStockThreshold"
                      min="0"
                      class="mt-1"
                    />
                    <p class="mt-1 text-sm text-muted-foreground">
                      Alerte quand le stock passe sous ce seuil
                    </p>
                  </div>
                  <div>
                    <z-label for="outOfStockThreshold">
                      Seuil de rupture de stock
                    </z-label>
                    <input
                      z-input
                      type="number"
                      id="outOfStockThreshold"
                      [(ngModel)]="formData.outOfStockThreshold"
                      name="outOfStockThreshold"
                      min="0"
                      class="mt-1"
                    />
                    <p class="mt-1 text-sm text-muted-foreground">
                      Produit considéré en rupture sous ce seuil
                    </p>
                  </div>
                </div>
              </div>
            </z-card>

            <!-- Section Général -->
            <z-card class="overflow-hidden">
              <div class="px-6 py-4 bg-muted/50 border-b border-border">
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-lg bg-gray-500/10">
                    <z-icon zType="settings" class="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <h2 class="text-lg font-semibold text-foreground">
                      Général
                    </h2>
                    <p class="text-sm text-muted-foreground">
                      Paramètres généraux de la plateforme
                    </p>
                  </div>
                </div>
              </div>
              <div class="p-6 space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <z-label for="platformName">Nom de la plateforme</z-label>
                    <input
                      z-input
                      type="text"
                      id="platformName"
                      [(ngModel)]="formData.platformName"
                      name="platformName"
                      class="mt-1"
                    />
                  </div>
                  <div>
                    <z-label for="currency">Devise</z-label>
                    <input
                      z-input
                      type="text"
                      id="currency"
                      [(ngModel)]="formData.currency"
                      name="currency"
                      class="mt-1"
                    />
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <z-label for="contactEmail">Email de contact</z-label>
                    <input
                      z-input
                      type="email"
                      id="contactEmail"
                      [(ngModel)]="formData.contactEmail"
                      name="contactEmail"
                      class="mt-1"
                      placeholder="contact@example.com"
                    />
                  </div>
                  <div>
                    <z-label for="supportEmail">Email de support</z-label>
                    <input
                      z-input
                      type="email"
                      id="supportEmail"
                      [(ngModel)]="formData.supportEmail"
                      name="supportEmail"
                      class="mt-1"
                      placeholder="support@example.com"
                    />
                  </div>
                </div>
              </div>
            </z-card>

            <!-- Section Paiement -->
            <z-card class="overflow-hidden">
              <div class="px-6 py-4 bg-muted/50 border-b border-border">
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-lg bg-green-500/10">
                    <z-icon zType="credit-card" class="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <h2 class="text-lg font-semibold text-foreground">
                      Paiement
                    </h2>
                    <p class="text-sm text-muted-foreground">
                      Paramètres de paiement et wallet
                    </p>
                  </div>
                </div>
              </div>
              <div class="p-6 space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <z-label for="minOrderAmount">
                      Montant minimum commande
                    </z-label>
                    <div class="flex items-center gap-2 mt-1">
                      <input
                        z-input
                        type="number"
                        id="minOrderAmount"
                        [(ngModel)]="formData.minOrderAmount"
                        name="minOrderAmount"
                        min="0"
                        class="flex-1"
                      />
                      <span class="text-muted-foreground text-sm">{{
                        formData.currency
                      }}</span>
                    </div>
                  </div>
                  <div>
                    <z-label for="maxOrderAmount">
                      Montant maximum commande
                    </z-label>
                    <div class="flex items-center gap-2 mt-1">
                      <input
                        z-input
                        type="number"
                        id="maxOrderAmount"
                        [(ngModel)]="formData.maxOrderAmount"
                        name="maxOrderAmount"
                        min="0"
                        class="flex-1"
                      />
                      <span class="text-muted-foreground text-sm">{{
                        formData.currency
                      }}</span>
                    </div>
                    <p class="mt-1 text-xs text-muted-foreground">
                      0 = pas de limite
                    </p>
                  </div>
                  <div>
                    <z-label for="minWithdrawalAmount">
                      Retrait minimum wallet
                    </z-label>
                    <div class="flex items-center gap-2 mt-1">
                      <input
                        z-input
                        type="number"
                        id="minWithdrawalAmount"
                        [(ngModel)]="formData.minWithdrawalAmount"
                        name="minWithdrawalAmount"
                        min="0"
                        class="flex-1"
                      />
                      <span class="text-muted-foreground text-sm">{{
                        formData.currency
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </z-card>

            <!-- Section Maintenance -->
            <z-card class="overflow-hidden">
              <div class="px-6 py-4 bg-muted/50 border-b border-border">
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-lg bg-red-500/10">
                    <z-icon zType="tool" class="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h2 class="text-lg font-semibold text-foreground">
                      Maintenance
                    </h2>
                    <p class="text-sm text-muted-foreground">
                      Mode maintenance de la plateforme
                    </p>
                  </div>
                </div>
              </div>
              <div class="p-6 space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <z-label>Mode maintenance</z-label>
                    <p class="text-sm text-muted-foreground">
                      Active le mode maintenance pour tous les utilisateurs
                    </p>
                  </div>
                  <z-switch
                    [(ngModel)]="formData.maintenanceMode"
                    name="maintenanceMode"
                  />
                </div>
                @if (formData.maintenanceMode) {
                  <div>
                    <z-label for="maintenanceMessage">
                      Message de maintenance
                    </z-label>
                    <textarea
                      z-input
                      id="maintenanceMessage"
                      [(ngModel)]="formData.maintenanceMessage"
                      name="maintenanceMessage"
                      rows="3"
                      class="mt-1 w-full"
                      placeholder="Message affiché aux utilisateurs..."
                    ></textarea>
                  </div>
                }
              </div>
            </z-card>

            <!-- Actions -->
            <div class="flex justify-end gap-4 pt-4">
              <button
                z-button
                type="button"
                zType="outline"
                (click)="resetForm()"
                [disabled]="isSaving()"
              >
                Annuler les modifications
              </button>
              <button z-button type="submit" [disabled]="isSaving()">
                @if (isSaving()) {
                  <z-spinner class="mr-2 h-4 w-4" />
                  Enregistrement...
                } @else {
                  <z-icon zType="check" class="mr-2" />
                  Enregistrer
                }
              </button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
})
export class AdminSettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private toastService = inject(ToastService);

  settings = signal<Settings | null>(null);
  isLoading = signal(false);
  isSaving = signal(false);

  formData = {
    defaultCommissionRate: 10,
    cartTTLMinutes: 30,
    lowStockThreshold: 10,
    outOfStockThreshold: 0,
    currency: 'MGA',
    platformName: 'Marketplace',
    maintenanceMode: false,
    maintenanceMessage: '',
    contactEmail: '',
    supportEmail: '',
    minOrderAmount: 0,
    maxOrderAmount: 0,
    minWithdrawalAmount: 10000,
  };

  groups = SETTINGS_GROUPS;

  async ngOnInit(): Promise<void> {
    await this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    this.isLoading.set(true);
    try {
      const settings = await this.settingsService.getSettings();
      this.settings.set(settings);
      this.populateForm(settings);
    } catch (error) {
      this.toastService.error('Erreur lors du chargement des paramètres');
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  populateForm(settings: Settings): void {
    this.formData = {
      defaultCommissionRate: settings.defaultCommissionRate,
      cartTTLMinutes: settings.cartTTLMinutes,
      lowStockThreshold: settings.lowStockThreshold,
      outOfStockThreshold: settings.outOfStockThreshold,
      currency: settings.currency,
      platformName: settings.platformName,
      maintenanceMode: settings.maintenanceMode,
      maintenanceMessage: settings.maintenanceMessage || '',
      contactEmail: settings.contactEmail || '',
      supportEmail: settings.supportEmail || '',
      minOrderAmount: settings.minOrderAmount,
      maxOrderAmount: settings.maxOrderAmount,
      minWithdrawalAmount: settings.minWithdrawalAmount,
    };
  }

  resetForm(): void {
    if (this.settings()) {
      this.populateForm(this.settings()!);
      this.toastService.info('Modifications annulées');
    }
  }

  async onSubmit(): Promise<void> {
    this.isSaving.set(true);
    try {
      const settings = await this.settingsService.updateSettings(this.formData);
      this.settings.set(settings);
      this.toastService.success('Paramètres enregistrés avec succès');
    } catch (error) {
      this.toastService.error("Erreur lors de l'enregistrement des paramètres");
      console.error(error);
    } finally {
      this.isSaving.set(false);
    }
  }
}
