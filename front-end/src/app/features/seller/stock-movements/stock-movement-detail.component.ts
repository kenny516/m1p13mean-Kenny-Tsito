import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastService } from '@/core/services';
import { StockMovementService } from '@/core/services/stock-movement.service';
import { MOVEMENT_TYPES } from '@/core/models/stock-movement.constants';
import {
  SaleStatus,
  StockMovement,
  StockMovementLine,
} from '@/core/models/stock-movement.model';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { DataTableColumn, DataTableComponent } from '@/shared/components/data-table';
import { ZardSelectImports } from '@/shared/components/select';

@Component({
  selector: 'app-stock-movement-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ZardCardComponent,
    ZardButtonComponent,
    ...ZardSelectImports,
    DataTableComponent,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Détail du mouvement</h1>
          @if (movement(); as current) {
            <p class="text-muted-foreground">{{ current.reference }} · {{ current.movementType }}</p>
          }
        </div>
        <a z-button zType="outline" routerLink="/seller/stock-movements">Retour</a>
      </div>

      @if (movement(); as current) {
        <z-card class="p-4">
          <div class="grid gap-4 md:grid-cols-4">
            <div>
              <p class="text-sm text-muted-foreground">Référence</p>
              <p class="font-medium">{{ current.reference }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Type</p>
              <p class="font-medium">{{ current.movementType }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Direction</p>
              <p class="font-medium">{{ current.direction }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Montant total</p>
              <p class="font-medium">{{ current.totalAmount | number: '1.0-0' }} MGA</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Créé le</p>
              <p class="font-medium">{{ current.createdAt | date: 'dd/MM/yyyy HH:mm' }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Date métier</p>
              <p class="font-medium">{{ current.date ? (current.date | date: 'dd/MM/yyyy HH:mm') : '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Dernière mise à jour</p>
              <p class="font-medium">{{ current.updatedAt ? (current.updatedAt | date: 'dd/MM/yyyy HH:mm') : '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Panier</p>
              <p class="font-medium">{{ current.cartId || current.sale?.cartId || '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Effectué par</p>
              <p class="font-medium">{{ displayActor(current.performedBy) }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Boutique(s)</p>
              <p class="font-medium">{{ displayMovementShops(current) }}</p>
            </div>
          </div>

          @if (current.note) {
            <div class="mt-4">
              <p class="text-sm text-muted-foreground">Note</p>
              <p class="font-medium">{{ current.note }}</p>
            </div>
          }

          @if (current.movementType === movementTypes.SALE && current.sale) {
            <div class="mt-4 rounded-md border border-border p-4 space-y-3">
              <h2 class="font-semibold">Informations vente</h2>
              <div class="grid gap-3 md:grid-cols-2">
                <div>
                  <p class="text-sm text-muted-foreground">Panier</p>
                  <p class="font-medium">{{ current.sale.cartId }}</p>
                </div>
                <div>
                  <p class="text-sm text-muted-foreground">Paiement</p>
                  <p class="font-medium">{{ current.sale.paymentMethod }}</p>
                </div>
                @if (current.sale.paymentTransaction) {
                  <div>
                    <p class="text-sm text-muted-foreground">Transaction</p>
                    <p class="font-medium">{{ current.sale.paymentTransaction }}</p>
                  </div>
                }
                <div>
                  <p class="text-sm text-muted-foreground">Statut</p>
                  <p class="font-medium">{{ current.sale.status }}</p>
                </div>
              </div>

              <div class="grid gap-3 md:grid-cols-3">
                <div>
                  <p class="text-sm text-muted-foreground">Confirmée le</p>
                  <p class="font-medium">{{ current.sale.confirmedAt ? (current.sale.confirmedAt | date: 'dd/MM/yyyy HH:mm') : '-' }}</p>
                </div>
                <div>
                  <p class="text-sm text-muted-foreground">Livrée le</p>
                  <p class="font-medium">{{ current.sale.deliveredAt ? (current.sale.deliveredAt | date: 'dd/MM/yyyy HH:mm') : '-' }}</p>
                </div>
              </div>

              <div>
                <p class="text-sm text-muted-foreground">Adresse de livraison</p>
                <p class="font-medium">
                  {{ current.sale.deliveryAddress.street }},
                  {{ current.sale.deliveryAddress.city }}
                  @if (current.sale.deliveryAddress.postalCode) {
                    · {{ current.sale.deliveryAddress.postalCode }}
                  }
                  @if (current.sale.deliveryAddress.country) {
                    · {{ current.sale.deliveryAddress.country }}
                  }
                </p>
              </div>

              <div class="flex flex-wrap items-end gap-3">
                <z-select [(zValue)]="selectedSaleStatus" class="w-56">
                  <z-select-item zValue="CONFIRMED">CONFIRMED</z-select-item>
                  <z-select-item zValue="DELIVERED">DELIVERED</z-select-item>
                </z-select>
                <button
                  z-button
                  [disabled]="selectedSaleStatus === current.sale.status"
                  (click)="updateSaleStatus()"
                >
                  Mettre à jour
                </button>
              </div>
            </div>
          }

          @if (current.movementType === movementTypes.SUPPLY && current.supply) {
            <div class="mt-4 rounded-md border border-border p-4">
              <h2 class="mb-3 font-semibold">Informations approvisionnement</h2>
              <div class="grid gap-3 md:grid-cols-2">
                <div>
                  <p class="text-sm text-muted-foreground">Fournisseur</p>
                  <p class="font-medium">{{ current.supply.supplier.name }}</p>
                </div>
                @if (current.supply.supplier.contact) {
                  <div>
                    <p class="text-sm text-muted-foreground">Contact fournisseur</p>
                    <p class="font-medium">{{ current.supply.supplier.contact }}</p>
                  </div>
                }
                @if (current.supply.invoiceNumber) {
                  <div>
                    <p class="text-sm text-muted-foreground">Numéro facture</p>
                    <p class="font-medium">{{ current.supply.invoiceNumber }}</p>
                  </div>
                }
              </div>
              @if (current.supply.notes) {
                <div class="mt-3">
                  <p class="text-sm text-muted-foreground">Notes approvisionnement</p>
                  <p class="font-medium">{{ current.supply.notes }}</p>
                </div>
              }
            </div>
          }

          @if (
            (current.movementType === movementTypes.ADJUSTMENT_PLUS ||
              current.movementType === movementTypes.ADJUSTMENT_MINUS) &&
            current.adjustment
          ) {
            <div class="mt-4 rounded-md border border-border p-4">
              <h2 class="mb-3 font-semibold">Informations ajustement</h2>
              <div>
                <p class="text-sm text-muted-foreground">Raison</p>
                <p class="font-medium">{{ current.adjustment.reason }}</p>
              </div>
              @if (current.adjustment.notes) {
                <div class="mt-3">
                  <p class="text-sm text-muted-foreground">Notes ajustement</p>
                  <p class="font-medium">{{ current.adjustment.notes }}</p>
                </div>
              }
            </div>
          }

          @if (
            current.movementType === movementTypes.RESERVATION ||
            current.movementType === movementTypes.RESERVATION_CANCEL
          ) {
            <div class="mt-4 rounded-md border border-border p-4">
              <h2 class="mb-3 font-semibold">Informations réservation</h2>
              <div>
                <p class="text-sm text-muted-foreground">Panier</p>
                <p class="font-medium">{{ current.cartId || current.sale?.cartId || '-' }}</p>
              </div>
            </div>
          }

          @if (
            current.movementType === movementTypes.RETURN_CUSTOMER ||
            current.movementType === movementTypes.RETURN_SUPPLIER
          ) {
            <div class="mt-4 rounded-md border border-border p-4">
              <h2 class="mb-3 font-semibold">Informations retour</h2>
              @if (current.cartId || current.sale?.cartId) {
                <div>
                  <p class="text-sm text-muted-foreground">Référence panier</p>
                  <p class="font-medium">{{ current.cartId || current.sale?.cartId }}</p>
                </div>
              } @else {
                <p class="font-medium text-muted-foreground">Aucune référence additionnelle</p>
              }
            </div>
          }
        </z-card>

        <z-card class="p-4">
          <h2 class="mb-4 text-lg font-semibold">Lignes</h2>
          <app-data-table
            [data]="current.lineIds || []"
            [columns]="lineColumns"
            emptyMessage="Aucune ligne sur ce mouvement"
          />
        </z-card>
      }
    </div>
  `,
})
export class StockMovementDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly stockMovementService = inject(StockMovementService);
  private readonly toast = inject(ToastService);

  readonly movement = signal<StockMovement | null>(null);
  readonly movementTypes = {
    SUPPLY: MOVEMENT_TYPES[0],
    SALE: MOVEMENT_TYPES[1],
    RETURN_CUSTOMER: MOVEMENT_TYPES[2],
    RETURN_SUPPLIER: MOVEMENT_TYPES[3],
    ADJUSTMENT_PLUS: MOVEMENT_TYPES[4],
    ADJUSTMENT_MINUS: MOVEMENT_TYPES[5],
    RESERVATION: MOVEMENT_TYPES[6],
    RESERVATION_CANCEL: MOVEMENT_TYPES[7],
  } as const;
  selectedSaleStatus: SaleStatus = 'CONFIRMED';

  readonly lineColumns: DataTableColumn[] = [
    { accessorKey: 'reference', header: 'Référence' },
    {
      accessorFn: (line: unknown) => this.displayProduct(line as StockMovementLine),
      id: 'product',
      header: 'Produit',
    },
    { accessorKey: 'quantity', header: 'Quantité' },
    {
      accessorFn: (line: unknown) =>
        `${(line as StockMovementLine).unitPrice.toLocaleString('fr-FR')} MGA`,
      id: 'unitPrice',
      header: 'Prix',
    },
    {
      accessorFn: (line: unknown) =>
        `${(line as StockMovementLine).totalAmount.toLocaleString('fr-FR')} MGA`,
      id: 'totalAmount',
      header: 'Total',
    },
    {
      accessorFn: (line: unknown) =>
        new Date((line as StockMovementLine).createdAt).toLocaleString('fr-FR'),
      id: 'createdAt',
      header: 'Date',
    },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      void this.loadMovement(id);
    }
  }

  async loadMovement(id: string): Promise<void> {
    try {
      const movement = await this.stockMovementService.getMovement(id);
      this.movement.set(movement);
      if (movement.sale?.status) {
        this.selectedSaleStatus = movement.sale.status;
      }
    } catch {
      this.toast.error('Impossible de charger le mouvement');
    }
  }

  async updateSaleStatus(): Promise<void> {
    const current = this.movement();
    if (!current) return;

    try {
      const updated = await this.stockMovementService.updateSaleStatus(
        current._id,
        this.selectedSaleStatus,
      );
      this.movement.set(updated);
      this.toast.success('Statut de vente mis à jour');
    } catch {
      this.toast.error('Échec de mise à jour du statut');
    }
  }

  private displayProduct(line: StockMovementLine): string {
    const product = line.productId as unknown;
    if (product && typeof product === 'object') {
      const titled = product as { title?: string; sku?: string };
      if (titled.title && titled.sku) return `${titled.title} (${titled.sku})`;
      if (titled.title) return titled.title;
      if (titled.sku) return titled.sku;
    }
    return 'Produit indisponible';
  }

  displayMovementShops(movement: StockMovement): string {
    const shop = movement.shopId as unknown;
    if (shop && typeof shop === 'object') {
      const named = shop as { name?: string };
      if (named.name) return named.name;
    }
    return 'Boutique indisponible';
  }

  displayActor(actor: unknown): string {
    if (actor && typeof actor === 'object') {
      const user = actor as {
        email?: string;
        profile?: { firstName?: string; lastName?: string };
      };
      const fullName = `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim();
      return fullName || user.email || '-';
    }
    return actor ? String(actor) : '-';
  }
}
