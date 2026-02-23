import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ShopService, StockMovementService, ToastService } from '@/core/services';
import { Shop } from '@/core/models/shop.model';
import { MovementType, StockMovement } from '@/core/models/stock-movement.model';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { DataTableColumn, DataTableComponent } from '@/shared/components/data-table';
import { ZardSelectImports } from '@/shared/components/select';

@Component({
  selector: 'app-stock-movement-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ZardCardComponent,
    ZardButtonComponent,
    ...ZardSelectImports,
    DataTableComponent,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Mouvements de stock</h1>
          <p class="text-muted-foreground">Liste complète des mouvements de vos boutiques.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <a z-button zType="outline" routerLink="/seller/stock-movement-lines">Lignes</a>
          <a z-button routerLink="/seller/stock-movements/new">Nouveau mouvement</a>
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
            [(zValue)]="selectedType"
            (zSelectionChange)="onFilterChange()"
            zPlaceholder="Tous types"
            class="w-full"
          >
            <z-select-item zValue="">Tous types</z-select-item>
            <z-select-item zValue="SUPPLY">SUPPLY</z-select-item>
            <z-select-item zValue="SALE">SALE</z-select-item>
            <z-select-item zValue="RETURN_CUSTOMER">RETURN_CUSTOMER</z-select-item>
            <z-select-item zValue="RETURN_SUPPLIER">RETURN_SUPPLIER</z-select-item>
            <z-select-item zValue="ADJUSTMENT_PLUS">ADJUSTMENT_PLUS</z-select-item>
            <z-select-item zValue="ADJUSTMENT_MINUS">ADJUSTMENT_MINUS</z-select-item>
            <z-select-item zValue="RESERVATION">RESERVATION</z-select-item>
            <z-select-item zValue="RESERVATION_CANCEL">RESERVATION_CANCEL</z-select-item>
          </z-select>
        </div>
        <div class="mt-4 flex justify-end">
          <button z-button zType="outline" (click)="resetFilters()">Réinitialiser les filtres</button>
        </div>
      </z-card>

      <app-data-table
        [data]="stockMovementService.movements()"
        [columns]="columns"
        [rowActions]="actionsTpl"
        emptyMessage="Aucun mouvement trouvé"
      />

      <ng-template #actionsTpl let-movement>
        <a z-button zType="outline" zSize="sm" [routerLink]="['/seller/stock-movements', movement._id]">
          Détails
        </a>
      </ng-template>

      @if (stockMovementService.pagination(); as pagination) {
        <div class="flex items-center justify-between rounded-md border border-border bg-card p-3">
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
    </div>
  `,
})
export class StockMovementListComponent implements OnInit {
  readonly stockMovementService = inject(StockMovementService);
  private readonly shopService = inject(ShopService);
  private readonly toast = inject(ToastService);

  readonly shops = signal<Shop[]>([]);
  readonly currentPage = signal(1);

  selectedShopId = '';
  selectedType = '';

  readonly columns: DataTableColumn[] = [
    {
      accessorKey: 'reference',
      header: 'Référence',
    },
    {
      accessorKey: 'movementType',
      header: 'Type',
    },
    {
      accessorKey: 'direction',
      header: 'Direction',
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
    void this.loadMovements();
  }

  async loadShops(): Promise<void> {
    try {
      const response = await this.shopService.getMyShops(undefined, 1, 100);
      this.shops.set(response.shops);
    } catch {
      this.toast.error('Impossible de charger les boutiques');
    }
  }

  async loadMovements(): Promise<void> {
    try {
      await this.stockMovementService.getMovements(
        {
          shopId: this.selectedShopId || undefined,
          movementType: (this.selectedType || undefined) as MovementType | undefined,
        },
        this.currentPage(),
      );
    } catch {
      this.toast.error('Impossible de charger les mouvements');
    }
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    void this.loadMovements();
  }

  goToPage(page: number): void {
    const pagination = this.stockMovementService.pagination();
    const maxPage = pagination?.pages || 1;
    const nextPage = Math.min(Math.max(page, 1), maxPage);
    this.currentPage.set(nextPage);
    void this.loadMovements();
  }

  resetFilters(): void {
    this.selectedShopId = '';
    this.selectedType = '';
    this.currentPage.set(1);
    void this.loadMovements();
  }
}
