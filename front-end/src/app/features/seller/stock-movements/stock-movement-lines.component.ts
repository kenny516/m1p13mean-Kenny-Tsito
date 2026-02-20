import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ShopService, StockMovementService, ToastService } from '@/core/services';
import { Shop } from '@/core/models/shop.model';
import { StockMovementLine } from '@/core/models/stock-movement.model';
import { ZardCardComponent } from '@/shared/components/card';
import { DataTableColumn, DataTableComponent } from '@/shared/components/data-table';
import { ZardSelectImports } from '@/shared/components/select';
import { ZardButtonComponent } from '@/shared/components/button';

@Component({
  selector: 'app-stock-movement-lines',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ZardCardComponent,
    ...ZardSelectImports,
    ZardButtonComponent,
    DataTableComponent,
  ],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Lignes de mouvement</h1>
        <p class="text-muted-foreground">Page dédiée à la consultation des lignes de stock.</p>
      </div>

      <div class="flex flex-wrap gap-2">
        <a z-button zType="outline" routerLink="/seller/stock-movements">Voir les mouvements</a>
        <button z-button zType="outline" (click)="resetFilters()">Réinitialiser les filtres</button>
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
      </z-card>

      <app-data-table
        [data]="stockMovementService.lines()"
        [columns]="columns"
        emptyMessage="Aucune ligne trouvée"
      />

      @if (stockMovementService.pagination(); as pagination) {
        <div class="flex items-center justify-between rounded-md border border-border bg-card p-3">
          <p class="text-sm text-muted-foreground">
            Page {{ pagination.page }} / {{ pagination.pages }} · {{ pagination.total }} lignes
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
export class StockMovementLinesComponent implements OnInit {
  readonly stockMovementService = inject(StockMovementService);
  private readonly shopService = inject(ShopService);
  private readonly toast = inject(ToastService);

  readonly shops = signal<Shop[]>([]);
  readonly currentPage = signal(1);

  selectedShopId = '';
  selectedType = '';

  readonly columns: DataTableColumn[] = [
    { accessorKey: 'reference', header: 'Référence' },
    { accessorKey: 'movementType', header: 'Type' },
    { accessorKey: 'direction', header: 'Direction' },
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
    { accessorKey: 'quantity', header: 'Qté' },
    {
      accessorFn: (line: unknown) =>
        `${(line as StockMovementLine).totalAmount.toLocaleString('fr-FR')} MGA`,
      id: 'totalAmount',
      header: 'Montant',
    },
    {
      accessorFn: (line: unknown) =>
        new Date((line as StockMovementLine).createdAt).toLocaleDateString('fr-FR'),
      id: 'createdAt',
      header: 'Date',
    },
  ];

  ngOnInit(): void {
    void this.loadShops();
    void this.loadLines();
  }

  async loadShops(): Promise<void> {
    try {
      const response = await this.shopService.getMyShops(undefined, 1, 100);
      this.shops.set(response.shops);
    } catch {
      this.toast.error('Impossible de charger les boutiques');
    }
  }

  async loadLines(): Promise<void> {
    try {
      await this.stockMovementService.getLines(
        {
          shopId: this.selectedShopId || undefined,
          movementType: (this.selectedType || undefined) as never,
        },
        this.currentPage(),
      );
    } catch {
      this.toast.error('Impossible de charger les lignes');
    }
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    void this.loadLines();
  }

  goToPage(page: number): void {
    const pagination = this.stockMovementService.pagination();
    const maxPage = pagination?.pages || 1;
    const nextPage = Math.min(Math.max(page, 1), maxPage);
    this.currentPage.set(nextPage);
    void this.loadLines();
  }

  resetFilters(): void {
    this.selectedShopId = '';
    this.selectedType = '';
    this.currentPage.set(1);
    void this.loadLines();
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
