import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product, ProductService, StockMovementLine, StockMovementService, ToastService } from '@/core';
import { RESERVATION_MOVEMENT_TYPES } from '@/core/models/stock-movement.constants';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { DataTableColumn, DataTableComponent } from '@/shared/components/data-table';

@Component({
  selector: 'app-seller-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ZardCardComponent, ZardButtonComponent, DataTableComponent],
  template: `
    <div class="min-h-screen bg-muted/30 py-6">
      <div class="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-foreground">Détail produit</h1>
            @if (product(); as currentProduct) {
              <p class="text-muted-foreground">{{ currentProduct.title }} · {{ currentProduct.category }}</p>
            }
          </div>
          <div class="flex gap-2">
            @if (product(); as currentProduct) {
              <button z-button zType="outline" type="button" [disabled]="isReconciling()" (click)="reconcileStock()">
                {{ isReconciling() ? 'Réconciliation...' : 'Réconcilier le stock' }}
              </button>
              <a z-button zType="outline" [routerLink]="['/seller/products', currentProduct._id, 'edit']">
                Modifier
              </a>
            }
            <a z-button zType="outline" routerLink="/seller/products">Retour</a>
          </div>
        </div>

        @if (product(); as currentProduct) {
          <z-card class="p-6">
            <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 class="text-xl font-bold text-foreground">{{ currentProduct.title }}</h2>
                <p class="text-sm text-muted-foreground">{{ currentProduct.description }}</p>
              </div>
              <span
                class="w-fit rounded-md px-2 py-1 text-xs font-medium"
                [class]="statusBadgeClass(currentProduct.status)"
              >
                {{ currentProduct.status }}
              </span>
            </div>

            @if (dashboard(); as metrics) {
              <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div class="rounded-lg border border-border bg-card p-4">
                  <p class="text-xs uppercase tracking-wide text-muted-foreground">Prix affiché</p>
                  <p class="mt-2 text-2xl font-semibold text-foreground">{{ formatMoney(currentProduct.price) }}</p>
                  <p class="mt-1 text-xs text-muted-foreground">
                    Prix original: {{ currentProduct.originalPrice ? formatMoney(currentProduct.originalPrice) : '-' }}
                  </p>
                </div>

                <div class="rounded-lg border border-border bg-card p-4">
                  <p class="text-xs uppercase tracking-wide text-muted-foreground">Stock disponible</p>
                  <p class="mt-2 text-2xl font-semibold text-foreground">
                    {{ currentProduct.stock.cache.available | number: '1.0-0' }}
                  </p>
                  <p class="mt-1 text-xs text-muted-foreground">
                    Total: {{ currentProduct.stock.cache.total | number: '1.0-0' }} · Réservé:
                    {{ currentProduct.stock.cache.reserved | number: '1.0-0' }}
                  </p>
                </div>

                <div class="rounded-lg border border-border bg-card p-4">
                  <p class="text-xs uppercase tracking-wide text-muted-foreground">Chiffre d'affaires net</p>
                  <p class="mt-2 text-2xl font-semibold text-foreground">{{ formatMoney(metrics.netRevenue) }}</p>
                  <p class="mt-1 text-xs text-muted-foreground">
                    Ventes: {{ formatMoney(metrics.grossRevenue) }} · Retours: {{ formatMoney(metrics.returnAmount) }}
                  </p>
                </div>

                <div class="rounded-lg border border-border bg-card p-4">
                  <p class="text-xs uppercase tracking-wide text-muted-foreground">Unités vendues</p>
                  <p class="mt-2 text-2xl font-semibold text-foreground">{{ metrics.totalSold | number: '1.0-0' }}</p>
                  <p class="mt-1 text-xs text-muted-foreground">
                    Retour client: {{ metrics.totalReturned | number: '1.0-0' }} · Taux d'écoulement:
                    {{ metrics.sellThroughRate | number: '1.0-0' }}%
                  </p>
                </div>
              </div>

              <div class="mt-4 grid gap-4 lg:grid-cols-3">
                <div class="rounded-lg border border-border bg-card p-4 lg:col-span-2">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <h3 class="text-sm font-semibold text-foreground">Vue synthétique</h3>
                      <p class="text-xs text-muted-foreground">Indicateurs calculés à partir des mouvements non-réservation</p>
                    </div>
                    <span class="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                      {{ metrics.movementCount }} mouvements
                    </span>
                  </div>
                  <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p class="text-xs text-muted-foreground">Prix moyen vendu</p>
                      <p class="text-lg font-semibold text-foreground">{{ formatMoney(metrics.averageSalePrice) }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-muted-foreground">Apports stock</p>
                      <p class="text-lg font-semibold text-foreground">{{ metrics.totalSupplied | number: '1.0-0' }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-muted-foreground">Ventes (stats produit)</p>
                      <p class="text-lg font-semibold text-foreground">{{ currentProduct.stats.sales | number: '1.0-0' }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-muted-foreground">Vues</p>
                      <p class="text-lg font-semibold text-foreground">{{ currentProduct.stats.views | number: '1.0-0' }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-muted-foreground">Avis</p>
                      <p class="text-lg font-semibold text-foreground">{{ currentProduct.stats.reviewCount | number: '1.0-0' }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-muted-foreground">Note</p>
                      <p class="text-lg font-semibold text-foreground">{{ currentProduct.stats.rating | number: '1.1-2' }}</p>
                    </div>
                  </div>
                </div>

                <div class="rounded-lg border border-border bg-card p-4">
                  <h3 class="text-sm font-semibold text-foreground">Santé du stock</h3>
                  <p class="mt-1 text-xs text-muted-foreground">État opérationnel actuel</p>
                  <div class="mt-4 space-y-3">
                    <div>
                      <p class="text-xs text-muted-foreground">Statut</p>
                      <p class="font-semibold" [class]="stockHealthClass(currentProduct)">
                        {{ stockHealthLabel(currentProduct) }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-muted-foreground">Seuil stock bas</p>
                      <p class="font-medium text-foreground">{{ currentProduct.stock.alert.lowThreshold }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-muted-foreground">Seuil rupture</p>
                      <p class="font-medium text-foreground">{{ currentProduct.stock.alert.outOfStock }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-muted-foreground">Dernière synchro</p>
                      <p class="font-medium text-foreground">
                        {{ currentProduct.stock.cache.lastUpdated ? (currentProduct.stock.cache.lastUpdated | date: 'dd/MM/yyyy HH:mm') : '-' }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-4 rounded-lg border border-border bg-card p-4">
                <h3 class="text-sm font-semibold text-foreground">Répartition des mouvements</h3>
                <p class="mt-1 text-xs text-muted-foreground">Volume par type sur ce produit</p>
                @if (metrics.breakdown.length > 0) {
                  <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    @for (item of metrics.breakdown; track item.type) {
                      <div class="rounded-md border border-border p-3">
                        <p class="text-xs text-muted-foreground">{{ item.type }}</p>
                        <p class="text-lg font-semibold text-foreground">{{ item.quantity | number: '1.0-0' }}</p>
                        <p class="text-xs text-muted-foreground">{{ item.count }} ligne(s) · {{ formatMoney(item.amount) }}</p>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="mt-3 text-sm text-muted-foreground">Aucune donnée de mouvement exploitable pour le moment.</p>
                }
              </div>
            }

            <div class="mt-4 grid gap-4 md:grid-cols-4">
              <div>
                <p class="text-sm text-muted-foreground">SKU</p>
                <p class="font-medium text-foreground">{{ currentProduct.sku || '-' }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Boutique</p>
                <p class="font-medium text-foreground">{{ getShopLabel(currentProduct) }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Créé le</p>
                <p class="font-medium text-foreground">{{ currentProduct.createdAt | date: 'dd/MM/yyyy HH:mm' }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Dernière mise à jour</p>
                <p class="font-medium text-foreground">
                  {{ currentProduct.updatedAt ? (currentProduct.updatedAt | date: 'dd/MM/yyyy HH:mm') : '-' }}
                </p>
              </div>
            </div>

            @if (currentProduct.rejectionReason) {
              <div class="mt-4 rounded-md border border-border p-4">
                <p class="text-sm text-muted-foreground">Raison de rejet</p>
                <p class="font-medium">{{ currentProduct.rejectionReason }}</p>
              </div>
            }

            <div class="mt-6 grid gap-4 lg:grid-cols-3">
              <div class="space-y-3 lg:col-span-2">
                <h2 class="text-lg font-semibold text-foreground">Images</h2>
                @if (getCurrentImage(currentProduct); as heroImage) {
                  <div class="overflow-hidden rounded-md border border-border bg-muted/30">
                    <img [src]="heroImage" [alt]="currentProduct.title" class="h-64 w-full object-cover" />
                  </div>
                  <div class="grid grid-cols-2 gap-2 md:grid-cols-5">
                    @for (image of currentProduct.images; track image; let idx = $index) {
                      <button
                        type="button"
                        class="overflow-hidden rounded-md border border-border"
                        (click)="selectImage(idx)"
                      >
                        <img
                          [src]="image"
                          [alt]="currentProduct.title + ' - image ' + (idx + 1)"
                          class="h-20 w-full object-cover"
                        />
                      </button>
                    }
                  </div>
                } @else {
                  <div class="rounded-md border border-border p-4 text-sm text-muted-foreground">
                    Aucune image disponible
                  </div>
                }
              </div>

              <div class="rounded-lg border border-border bg-card p-4">
                <h3 class="text-sm font-semibold text-foreground">Contexte produit</h3>
                <div class="mt-3 space-y-3">
                  <div>
                    <p class="text-xs text-muted-foreground">Catégorie</p>
                    <p class="font-medium text-foreground">{{ currentProduct.category }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-muted-foreground">Tags</p>
                    <p class="font-medium text-foreground">{{ (currentProduct.tags || []).join(', ') || '-' }}</p>
                  </div>
                  @if (dashboard(); as metrics) {
                    <div>
                      <p class="text-xs text-muted-foreground">Dernier mouvement</p>
                      <p class="font-medium text-foreground">{{ metrics.lastMovementLabel }}</p>
                    </div>
                  }
                </div>
              </div>
            </div>

            <div class="mt-6">
              <h2 class="text-lg font-semibold text-foreground">Caractéristiques</h2>
              @if (getCharacteristicEntries(currentProduct).length > 0) {
                <div class="mt-3 grid gap-3 md:grid-cols-2">
                  @for (item of getCharacteristicEntries(currentProduct); track item.key) {
                    <div class="rounded-md border border-border p-3">
                      <p class="text-sm text-muted-foreground">{{ item.key }}</p>
                      <p class="font-medium break-all">{{ item.value }}</p>
                    </div>
                  }
                </div>
              } @else {
                <p class="mt-2 text-sm text-muted-foreground">Aucune caractéristique renseignée</p>
              }
            </div>
          </z-card>

          <z-card class="p-6">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h2 class="text-lg font-semibold text-foreground">Lignes de mouvement</h2>
                <p class="text-sm text-muted-foreground">Exclut les types RESERVATION et RESERVATION_CANCEL</p>
              </div>
            </div>

            <app-data-table
              [data]="movementLines()"
              [columns]="lineColumns"
              emptyMessage="Aucune ligne de mouvement non-réservation pour ce produit"
            />
          </z-card>
        }
      </div>
    </div>
  `,
})
export class SellerProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly stockMovementService = inject(StockMovementService);
  private readonly toast = inject(ToastService);

  readonly product = signal<Product | null>(null);
  readonly movementLines = signal<StockMovementLine[]>([]);
  readonly selectedImageIndex = signal(0);
  readonly isReconciling = signal(false);
  readonly dashboard = computed(() => {
    const lines = this.movementLines();
    const product = this.product();

    if (!product) {
      return {
        grossRevenue: 0,
        returnAmount: 0,
        netRevenue: 0,
        totalSupplied: 0,
        totalSold: 0,
        totalReturned: 0,
        movementCount: 0,
        sellThroughRate: 0,
        averageSalePrice: 0,
        lastMovementLabel: '-',
        breakdown: [] as { type: string; count: number; quantity: number; amount: number }[],
      };
    }

    const summaryByType = new Map<string, { count: number; quantity: number; amount: number }>();
    let grossRevenue = 0;
    let returnAmount = 0;
    let totalSupplied = 0;
    let totalSold = 0;
    let totalReturned = 0;
    let latestLine: StockMovementLine | null = null;

    for (const line of lines) {
      const currentType = line.movementType;
      const previous = summaryByType.get(currentType) || { count: 0, quantity: 0, amount: 0 };
      summaryByType.set(currentType, {
        count: previous.count + 1,
        quantity: previous.quantity + Number(line.quantity || 0),
        amount: previous.amount + Number(line.totalAmount || 0),
      });

      if (!latestLine || new Date(line.createdAt).getTime() > new Date(latestLine.createdAt).getTime()) {
        latestLine = line;
      }

      if (currentType === 'SUPPLY') {
        totalSupplied += Number(line.quantity || 0);
      }
      if (currentType === 'SALE') {
        totalSold += Number(line.quantity || 0);
        grossRevenue += Number(line.totalAmount || 0);
      }
      if (currentType === 'RETURN_CUSTOMER') {
        totalReturned += Number(line.quantity || 0);
        returnAmount += Number(line.totalAmount || 0);
      }
    }

    const breakdown = Array.from(summaryByType.entries()).map(([type, values]) => ({
      type,
      ...values,
    }));
    const sellThroughRate = totalSupplied > 0 ? (totalSold / totalSupplied) * 100 : 0;
    const averageSalePrice = totalSold > 0 ? grossRevenue / totalSold : product.price;

    return {
      grossRevenue,
      returnAmount,
      netRevenue: grossRevenue - returnAmount,
      totalSupplied,
      totalSold,
      totalReturned,
      movementCount: lines.length,
      sellThroughRate,
      averageSalePrice,
      lastMovementLabel: latestLine
        ? `${latestLine.movementType} · ${new Date(latestLine.createdAt).toLocaleDateString('fr-FR')}`
        : '-',
      breakdown,
    };
  });

  readonly lineColumns: DataTableColumn[] = [
    { accessorKey: 'reference', header: 'Référence' },
    { accessorKey: 'movementType', header: 'Type' },
    { accessorKey: 'direction', header: 'Direction' },
    { accessorKey: 'quantity', header: 'Qté' },
    {
      accessorFn: (line: unknown) => `${(line as StockMovementLine).unitPrice.toLocaleString('fr-FR')} MGA`,
      id: 'unitPrice',
      header: 'Prix unitaire',
    },
    {
      accessorFn: (line: unknown) => `${(line as StockMovementLine).totalAmount.toLocaleString('fr-FR')} MGA`,
      id: 'totalAmount',
      header: 'Montant',
    },
    {
      accessorFn: (line: unknown) => this.displayPerformedBy(line as StockMovementLine),
      id: 'performedBy',
      header: 'Effectué par',
    },
    {
      accessorFn: (line: unknown) => new Date((line as StockMovementLine).createdAt).toLocaleDateString('fr-FR'),
      id: 'createdAt',
      header: 'Date',
    },
  ];

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      void this.loadProductDetails(productId);
    }
  }

  async loadProductDetails(productId: string): Promise<void> {
    try {
      const product = await this.productService.getProduct(productId);
      this.product.set(product);
      this.selectedImageIndex.set(0);
    } catch {
      this.toast.error('Impossible de charger les détails du produit');
      return;
    }

    try {
      const linesResponse = await this.stockMovementService.getLines({ productId }, 1, 100);
      this.movementLines.set(
        linesResponse.lines.filter((line) => !this.isReservationMovementType(line.movementType)),
      );
    } catch {
      this.toast.error('Impossible de charger les lignes de mouvements du produit');
    }
  }

  async reconcileStock(): Promise<void> {
    const currentProduct = this.product();
    if (!currentProduct || this.isReconciling()) {
      return;
    }

    this.isReconciling.set(true);
    try {
      await this.stockMovementService.reconcileProductStock(currentProduct._id);
      this.toast.success('Stock réconcilié avec succès');
      await this.loadProductDetails(currentProduct._id);
    } catch {
      this.toast.error('Impossible de réconcilier le stock du produit');
    } finally {
      this.isReconciling.set(false);
    }
  }

  getShopLabel(product: Product): string {
    const shop = product.shopId;
    return typeof shop === 'string' ? shop : shop.name;
  }

  getCurrentImage(product: Product): string | null {
    if (!product.images?.length) return null;
    const safeIndex = Math.min(this.selectedImageIndex(), product.images.length - 1);
    return product.images[safeIndex] || null;
  }

  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  getCharacteristicEntries(product: Product): { key: string; value: string }[] {
    const characteristics = product.characteristics || {};
    return Object.entries(characteristics).map(([key, value]) => ({
      key,
      value: this.characteristicValue(value),
    }));
  }

  private characteristicValue(value: unknown): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    try {
      return JSON.stringify(value);
    } catch {
      return '-';
    }
  }

  private displayPerformedBy(line: StockMovementLine): string {
    const actor = line.performedBy as unknown;
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

  private isReservationMovementType(type: string): boolean {
    return RESERVATION_MOVEMENT_TYPES.includes(
      type as (typeof RESERVATION_MOVEMENT_TYPES)[number],
    );
  }

  formatMoney(value: number): string {
    return `${Math.round(value || 0).toLocaleString('fr-FR')} MGA`;
  }

  statusBadgeClass(status: Product['status']): string {
    const base = 'rounded-md px-2 py-1 text-xs font-medium';
    const tone = {
      ACTIVE: 'bg-secondary text-secondary-foreground',
      DRAFT: 'bg-muted text-muted-foreground',
      PENDING: 'bg-muted text-foreground',
      REJECTED: 'bg-destructive/10 text-destructive',
      ARCHIVED: 'bg-muted text-muted-foreground',
    }[status] || 'bg-muted text-foreground';
    return `${base} ${tone}`;
  }

  stockHealthLabel(product: Product): string {
    if (product.isOutOfStock) return 'Rupture';
    if (product.isLowStock) return 'Stock bas';
    return 'Stock sain';
  }

  stockHealthClass(product: Product): string {
    if (product.isOutOfStock) return 'text-destructive';
    if (product.isLowStock) return 'text-foreground';
    return 'text-secondary-foreground';
  }
}
