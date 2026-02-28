import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
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
              <a z-button zType="outline" [routerLink]="['/seller/products', currentProduct._id, 'edit']">
                Modifier
              </a>
            }
            <a z-button zType="outline" routerLink="/seller/products">Retour</a>
          </div>
        </div>

        @if (product(); as currentProduct) {
          <z-card class="p-6">
            <div class="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 class="text-xl font-bold text-foreground">{{ currentProduct.title }}</h2>
                <p class="text-sm text-muted-foreground">{{ currentProduct.description }}</p>
              </div>
              <span class="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                {{ currentProduct.status }}
              </span>
            </div>

          <div class="grid gap-4 md:grid-cols-4">
            <div>
              <p class="text-sm text-muted-foreground">SKU</p>
              <p class="font-medium">{{ currentProduct.sku || '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Statut</p>
              <p class="font-medium">{{ currentProduct.status }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Prix</p>
              <p class="font-medium">{{ currentProduct.price | number: '1.0-0' }} MGA</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Prix original</p>
              <p class="font-medium">
                {{ currentProduct.originalPrice ? (currentProduct.originalPrice | number: '1.0-0') + ' MGA' : '-' }}
              </p>
            </div>
            <div class="md:col-span-2">
              <p class="text-sm text-muted-foreground">Boutique</p>
              <p class="font-medium">{{ getShopLabel(currentProduct) }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Créé le</p>
              <p class="font-medium">{{ currentProduct.createdAt | date: 'dd/MM/yyyy HH:mm' }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Dernière mise à jour</p>
              <p class="font-medium">
                {{ currentProduct.updatedAt ? (currentProduct.updatedAt | date: 'dd/MM/yyyy HH:mm') : '-' }}
              </p>
            </div>
          </div>

          <div class="mt-4">
            <p class="text-sm text-muted-foreground">Description</p>
            <p class="mt-1 whitespace-pre-line">{{ currentProduct.description }}</p>
          </div>

          @if (currentProduct.rejectionReason) {
            <div class="mt-4 rounded-md border border-border p-4">
              <p class="text-sm text-muted-foreground">Raison de rejet</p>
              <p class="font-medium">{{ currentProduct.rejectionReason }}</p>
            </div>
          }

          <div class="mt-6 space-y-3">
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

          <div class="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <p class="text-sm text-muted-foreground">Tags</p>
              <p class="mt-1">{{ (currentProduct.tags || []).join(', ') || '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Catégorie</p>
              <p class="mt-1">{{ currentProduct.category }}</p>
            </div>
          </div>

          <div class="mt-6">
            <h2 class="text-lg font-semibold text-foreground">Stock</h2>
            <div class="mt-3 grid gap-4 md:grid-cols-3">
              <div>
                <p class="text-sm text-muted-foreground">Total</p>
                <p class="font-medium">{{ currentProduct.stock.cache.total }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Réservé</p>
                <p class="font-medium">{{ currentProduct.stock.cache.reserved }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Disponible</p>
                <p class="font-medium">{{ currentProduct.stock.cache.available }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Seuil stock bas</p>
                <p class="font-medium">{{ currentProduct.stock.alert.lowThreshold }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Seuil rupture</p>
                <p class="font-medium">{{ currentProduct.stock.alert.outOfStock }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Dernière synchronisation</p>
                <p class="font-medium">
                  {{ currentProduct.stock.cache.lastUpdated ? (currentProduct.stock.cache.lastUpdated | date: 'dd/MM/yyyy HH:mm') : '-' }}
                </p>
              </div>
            </div>
            <div class="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <p class="text-sm text-muted-foreground">Indicateur stock bas</p>
                <p class="font-medium">{{ currentProduct.isLowStock ? 'Oui' : 'Non' }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Indicateur rupture</p>
                <p class="font-medium">{{ currentProduct.isOutOfStock ? 'Oui' : 'Non' }}</p>
              </div>
            </div>
          </div>

          <div class="mt-6">
            <h2 class="text-lg font-semibold text-foreground">Statistiques</h2>
            <div class="mt-3 grid gap-4 md:grid-cols-4">
              <div>
                <p class="text-sm text-muted-foreground">Vues</p>
                <p class="font-medium">{{ currentProduct.stats.views }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Ventes</p>
                <p class="font-medium">{{ currentProduct.stats.sales }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Note</p>
                <p class="font-medium">{{ currentProduct.stats.rating | number: '1.1-2' }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Avis</p>
                <p class="font-medium">{{ currentProduct.stats.reviewCount }}</p>
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
                    <p class="font-medium wrap-break-word">{{ item.value }}</p>
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
}
