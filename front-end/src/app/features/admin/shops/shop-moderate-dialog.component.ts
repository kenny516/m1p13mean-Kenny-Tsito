import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Shop, ShopStatus } from '@/core/models';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardLabelComponent } from '@/shared/components/label';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardSelectImports } from '@/shared/components/select';
import { Z_MODAL_DATA, ZardDialogRef } from '@/shared/components/dialog';

type ShopWithSeller = Shop & {
  sellerId: {
    _id: string;
    email?: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
};

export interface ModerateDialogData {
  shop: ShopWithSeller;
  initialStatus: ShopStatus;
  onConfirm?: (result: ModerateDialogResult) => void;
}

export interface ModerateDialogResult {
  status: ShopStatus;
  rejectionReason?: string;
}

@Component({
  selector: 'app-shop-moderate-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardLabelComponent,
    ZardInputDirective,
    ...ZardSelectImports,
  ],
  template: `
    <div class="space-y-4">
      <!-- Informations du shop -->
      <div class="p-3 bg-muted/50 rounded-lg">
        <p class="text-sm">
          <span class="text-muted-foreground">Boutique:</span>
          <span class="ml-2 font-medium">{{ shop.name }}</span>
        </p>
        <p class="text-sm mt-1">
          <span class="text-muted-foreground">Vendeur:</span>
          <span class="ml-2">{{ getSellerName() }}</span>
        </p>
      </div>

      <!-- Sélection du statut -->
      <div class="space-y-2">
        <z-label>Nouveau statut</z-label>
        <z-select
          [(zValue)]="selectedStatus"
          (zSelectionChange)="onStatusChange()"
          class="w-full"
        >
          <z-select-item zValue="ACTIVE">
            <div class="flex items-center gap-2">
              <z-icon zType="check" class="h-4 w-4 text-green-600" />
              Active (visible aux acheteurs)
            </div>
          </z-select-item>
          <z-select-item zValue="PENDING">
            <div class="flex items-center gap-2">
              <z-icon zType="clock" class="h-4 w-4 text-yellow-600" />
              En attente de validation
            </div>
          </z-select-item>
          <z-select-item zValue="REJECTED">
            <div class="flex items-center gap-2">
              <z-icon zType="x" class="h-4 w-4 text-destructive" />
              Rejetée
            </div>
          </z-select-item>
          <z-select-item zValue="ARCHIVED">
            <div class="flex items-center gap-2">
              <z-icon zType="archive" class="h-4 w-4 text-muted-foreground" />
              Archivée
            </div>
          </z-select-item>
        </z-select>
      </div>

      <!-- Raison du rejet (visible seulement si REJECTED) -->
      @if (selectedStatus === 'REJECTED') {
        <div class="space-y-2">
          <z-label for="rejectionReason">
            Raison du rejet
            <span class="text-destructive">*</span>
          </z-label>
          <textarea
            z-input
            id="rejectionReason"
            [(ngModel)]="rejectionReason"
            rows="3"
            placeholder="Expliquez pourquoi cette boutique est rejetée..."
            class="w-full resize-none"
          ></textarea>
          @if (showError()) {
            <p class="text-sm text-destructive">
              La raison du rejet est obligatoire
            </p>
          }
        </div>
      }

      <!-- Message de confirmation -->
      @if (selectedStatus === 'ACTIVE') {
        <div
          class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
        >
          <div class="flex items-start gap-2">
            <z-icon
              zType="circle-check"
              class="h-5 w-5 text-green-600 mt-0.5"
            />
            <div>
              <p class="text-sm text-green-800 dark:text-green-200">
                La boutique sera activée et visible par les acheteurs.
              </p>
            </div>
          </div>
        </div>
      } @else if (selectedStatus === 'PENDING') {
        <div
          class="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
        >
          <div class="flex items-start gap-2">
            <z-icon
              zType="clock"
              class="h-5 w-5 text-yellow-600 mt-0.5"
            />
            <div>
              <p class="text-sm text-yellow-800 dark:text-yellow-200">
                La boutique sera remise en attente de validation.
              </p>
            </div>
          </div>
        </div>
      } @else if (selectedStatus === 'REJECTED') {
        <div
          class="p-3 bg-destructive/10 rounded-lg border border-destructive/20"
        >
          <div class="flex items-start gap-2">
            <z-icon
              zType="circle-alert"
              class="h-5 w-5 text-destructive mt-0.5"
            />
            <div>
              <p class="text-sm text-destructive">
                Le vendeur sera notifié du rejet et pourra soumettre à nouveau
                après modifications.
              </p>
            </div>
          </div>
        </div>
      } @else if (selectedStatus === 'ARCHIVED') {
        <div
          class="p-3 bg-muted rounded-lg border border-border"
        >
          <div class="flex items-start gap-2">
            <z-icon
              zType="archive"
              class="h-5 w-5 text-muted-foreground mt-0.5"
            />
            <div>
              <p class="text-sm text-muted-foreground">
                La boutique sera archivée et ne sera plus visible.
              </p>
            </div>
          </div>
        </div>
      }

      <!-- Actions -->
      <div class="flex justify-end gap-2 pt-2">
        <button z-button zType="outline" (click)="cancel()">Annuler</button>
        <button
          z-button
          [zType]="selectedStatus === 'REJECTED' ? 'destructive' : 'default'"
          (click)="confirm()"
          [disabled]="isSubmitting()"
        >
          @if (isSubmitting()) {
            <z-icon zType="loader-circle" class="mr-2 animate-spin" />
          }
          Confirmer
        </button>
      </div>
    </div>
  `,
})
export class ShopModerateDialogComponent {
  private dialogRef = inject(ZardDialogRef);
  private data = inject<ModerateDialogData>(Z_MODAL_DATA);

  selectedStatus: ShopStatus = this.data.initialStatus;
  rejectionReason = '';
  showError = signal(false);
  isSubmitting = signal(false);

  get shop(): ShopWithSeller {
    return this.data.shop;
  }

  getSellerName(): string {
    if (typeof this.shop.sellerId === 'string') {
      return 'Vendeur inconnu';
    }
    const seller = this.shop.sellerId;
    if (seller.profile?.firstName || seller.profile?.lastName) {
      return `${seller.profile.firstName || ''} ${seller.profile.lastName || ''}`.trim();
    }
    return seller.email || 'Vendeur inconnu';
  }

  onStatusChange(): void {
    this.showError.set(false);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    // Validation
    if (this.selectedStatus === 'REJECTED' && !this.rejectionReason.trim()) {
      this.showError.set(true);
      return;
    }

    this.isSubmitting.set(true);

    const result: ModerateDialogResult = {
      status: this.selectedStatus,
      rejectionReason:
        this.selectedStatus === 'REJECTED'
          ? this.rejectionReason.trim()
          : undefined,
    };

    this.dialogRef.close();

    if (this.data.onConfirm) {
      this.data.onConfirm(result);
    }
  }
}
