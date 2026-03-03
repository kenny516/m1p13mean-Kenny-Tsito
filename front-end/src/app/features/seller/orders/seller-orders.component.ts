import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ShopService, StockMovementService, ToastService } from '@/core/services';
import { Shop } from '@/core/models/shop.model';
import { SaleStatus, StockMovement } from '@/core/models/stock-movement.model';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { DataTableColumnDef, TanstackDataTableComponent } from '@/shared/components/data-table';
import { ZardSelectImports } from '@/shared/components/select';

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ZardCardComponent,
    ZardButtonComponent,
    ...ZardSelectImports,
    TanstackDataTableComponent,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Commandes</h1>
          <p class="text-muted-foreground">Ventes de vos boutiques.</p>
        </div>
      </div>

      <z-card class="p-4">
        <div class="grid gap-4 md:grid-cols-2">
          <z-select
            [(zValue)]="selectedShopId"
            (zSelectionChange)="onFilterChange()"
            zPlaceholder="Toutes boutiques"
            class="w-full"
          >
            <z-select-item zValue="">Toutes boutiques</z-select-item>
            @for (shop of shops(); track shop._id) {
              <z-select-item [zValue]="shop._id">{{ shop.name }}</z-select-item>
            }
          </z-select>

          <z-select
            [(zValue)]="selectedStatus"
            (zSelectionChange)="onFilterChange()"
            zPlaceholder="Tous statuts"
            class="w-full"
          >
            <z-select-item zValue="">Tous statuts</z-select-item>
            <z-select-item zValue="CONFIRMED">CONFIRMED</z-select-item>
            <z-select-item zValue="DELIVERED">DELIVERED</z-select-item>
            <z-select-item zValue="RETURNED">RETURNED</z-select-item>
          </z-select>
        </div>
      </z-card>

      <z-card class="overflow-hidden">
        <div class="p-4">
          <app-tanstack-data-table
            [data]="stockMovementService.movements()"
            [columnDefs]="columns"
            [rowActions]="actionsTpl"
            [isLoading]="stockMovementService.isLoading()"
            emptyMessage="Aucune commande trouvée"
          />
        </div>

        <ng-template #actionsTpl let-movement>
          <a z-button zType="outline" zSize="sm" [routerLink]="['/seller/stock-movements', movement._id]">
            Détails
          </a>
        </ng-template>

        @if (stockMovementService.pagination(); as pagination) {
          <div class="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <p class="text-sm text-muted-foreground">
              Page {{ pagination.page }} / {{ pagination.pages }} · {{ pagination.total }} résultats
            </p>
            <div class="flex gap-2">
              <button
                z-button
                zType="outline"
                zSize="sm"
                [disabled]="pagination.page <= 1"
                (click)="goToPage(pagination.page - 1)"
              >
                Précédent
              </button>
              <button
                z-button
                zType="outline"
                zSize="sm"
                [disabled]="pagination.page >= pagination.pages"
                (click)="goToPage(pagination.page + 1)"
              >
                Suivant
              </button>
            </div>
          </div>
        }
      </z-card>
    </div>
  `,
})
export class SellerOrdersComponent implements OnInit {
  readonly stockMovementService = inject(StockMovementService);
  private readonly shopService = inject(ShopService);
  private readonly toast = inject(ToastService);

  readonly shops = signal<Shop[]>([]);
  readonly currentPage = signal(1);

  selectedShopId = '';
  selectedStatus: SaleStatus | '' = '';

  readonly columns: DataTableColumnDef<StockMovement>[] = [
    {
      id: 'reference',
      accessorKey: 'reference',
      header: 'Référence',
    },
    {
      accessorFn: (movement: unknown) => this.displayShop(movement as StockMovement),
      id: 'shop',
      header: 'Boutique',
    },
    {
      id: 'movementType',
      accessorKey: 'movementType',
      header: 'Type',
    },
    {
      accessorFn: (movement: unknown) => (movement as StockMovement).sale?.status || '-',
      id: 'status',
      header: 'Statut',
    },
    {
      accessorFn: (movement: unknown) =>
        `${(movement as StockMovement).totalAmount.toLocaleString('fr-FR')} MGA`,
      id: 'amount',
      header: 'Montant',
    },
    {
      accessorFn: (movement: unknown) =>
        new Date((movement as StockMovement).createdAt).toLocaleDateString('fr-FR'),
      id: 'createdAt',
      header: 'Date',
    },
  ];

  ngOnInit(): void {
    void this.loadShops();
    void this.loadOrders();
  }

  async loadShops(): Promise<void> {
    try {
      const response = await this.shopService.getMyShops(undefined, 1, 100);
      this.shops.set(response.shops);
    } catch {
      this.toast.error('Impossible de charger les boutiques');
    }
  }

  async loadOrders(): Promise<void> {
    try {
      await this.stockMovementService.getSales(
        {
          shopId: this.selectedShopId || undefined,
          status: this.selectedStatus || undefined,
        },
        this.currentPage(),
      );
    } catch {
      this.toast.error('Impossible de charger les commandes');
    }
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    void this.loadOrders();
  }

  goToPage(page: number): void {
    const pagination = this.stockMovementService.pagination();
    const maxPage = pagination?.pages || 1;
    const nextPage = Math.min(Math.max(page, 1), maxPage);
    this.currentPage.set(nextPage);
    void this.loadOrders();
  }

  private displayShop(movement: StockMovement): string {
    const shop = movement.shopId as unknown;
    if (shop && typeof shop === 'object' && 'name' in shop && typeof shop.name === 'string') {
      return shop.name;
    }
    return 'Boutique indisponible';
  }
}
