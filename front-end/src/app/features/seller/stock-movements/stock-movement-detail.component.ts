import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastService } from '@/core/services';
import { StockMovementService } from '@/core/services/stock-movement.service';
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
          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <p class="text-sm text-muted-foreground">Direction</p>
              <p class="font-medium">{{ current.direction }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Montant total</p>
              <p class="font-medium">{{ current.totalAmount | number: '1.0-0' }} MGA</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Date</p>
              <p class="font-medium">{{ current.createdAt | date: 'dd/MM/yyyy HH:mm' }}</p>
            </div>
          </div>

          @if (current.sale) {
            <div class="mt-4 rounded-md border border-border p-4">
              <h2 class="mb-3 font-semibold">Mise à jour statut vente</h2>
              <div class="flex flex-wrap items-end gap-3">
                <z-select [(zValue)]="selectedSaleStatus" class="w-56">
                  <z-select-item zValue="CONFIRMED">CONFIRMED</z-select-item>
                  <z-select-item zValue="DELIVERED">DELIVERED</z-select-item>
                  <z-select-item zValue="CANCELLED">CANCELLED</z-select-item>
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
  selectedSaleStatus: SaleStatus = 'CONFIRMED';

  readonly lineColumns: DataTableColumn[] = [
    {
      accessorFn: (line: unknown) => this.displayProduct(line as StockMovementLine),
      id: 'product',
      header: 'Produit',
    },
    {
      accessorFn: (line: unknown) => this.displayShop(line as StockMovementLine),
      id: 'shop',
      header: 'Boutique',
    },
    { accessorKey: 'quantity', header: 'Quantité' },
    {
      accessorFn: (line: unknown) =>
        `${(line as StockMovementLine).unitPrice.toLocaleString('fr-FR')} MGA`,
      id: 'unitPrice',
      header: 'Prix unitaire',
    },
    {
      accessorFn: (line: unknown) =>
        `${(line as StockMovementLine).totalAmount.toLocaleString('fr-FR')} MGA`,
      id: 'totalAmount',
      header: 'Montant',
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
    return String(line.productId || '-');
  }

  private displayShop(line: StockMovementLine): string {
    const shop = line.shopId as unknown;
    if (shop && typeof shop === 'object' && 'name' in shop) {
      const namedShop = shop as { name?: string };
      return namedShop.name || '-';
    }
    return String(line.shopId || '-');
  }
}
