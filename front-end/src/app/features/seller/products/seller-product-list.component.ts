import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Product, ProductService, ProductStatus, Shop, ShopService, ToastService } from '@/core';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardBadgeComponent } from '@/shared/components/badge';
import { ZardIconComponent } from '@/shared/components/icon';
import { DataTableColumn, DataTableComponent } from '@/shared/components/data-table';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardSelectImports } from '@/shared/components/select';

@Component({
  selector: 'app-seller-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ZardCardComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardIconComponent,
    ZardInputDirective,
    ...ZardSelectImports,
    DataTableComponent,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Produits vendeur</h1>
          <p class="text-muted-foreground">Créez, modifiez, archivez et supprimez vos produits.</p>
        </div>
        <button z-button type="button" (click)="goToCreateProduct()">Nouveau produit</button>
      </div>

      <z-card class="p-4">
        <div class="grid gap-4 md:grid-cols-4">
          <div class="md:col-span-2">
            <input
              z-input
              [(ngModel)]="searchTerm"
              (input)="onFilterChange()"
              placeholder="Rechercher un produit..."
            />
          </div>
          <div>
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
          </div>
          <div>
            <z-select
              [(zValue)]="selectedStatus"
              (zSelectionChange)="onFilterChange()"
              zPlaceholder="Tous statuts"
              class="w-full"
            >
              <z-select-item zValue="ALL">Tous statuts</z-select-item>
              <z-select-item zValue="DRAFT">Brouillon</z-select-item>
              <z-select-item zValue="PENDING">En attente</z-select-item>
              <z-select-item zValue="ACTIVE">Actif</z-select-item>
              <z-select-item zValue="REJECTED">Rejeté</z-select-item>
              <z-select-item zValue="ARCHIVED">Archivé</z-select-item>
            </z-select>
          </div>
        </div>
        <div class="mt-4 flex justify-end">
          <button z-button zType="outline" (click)="resetFilters()">Réinitialiser les filtres</button>
        </div>
      </z-card>

      <app-data-table
        [data]="productService.products()"
        [columns]="columns"
        [rowActions]="actionsTpl"
        emptyMessage="Aucun produit trouvé"
      />

      <ng-template #actionsTpl let-product>
        <div class="space-y-2">
          <!-- Badge de statut avec message explicatif -->
          <div class="flex items-center gap-2 mb-2">
            <z-badge [zType]="getStatusBadgeType(product.status)" zShape="pill">
              {{ getStatusLabel(product.status) }}
            </z-badge>
            @if (product.status === 'PENDING') {
              <span class="text-xs text-muted-foreground flex items-center gap-1">
                <z-icon zType="clock" class="h-3 w-3" />
                En attente de validation
              </span>
            }
            @if (product.status === 'REJECTED') {
              <span class="text-xs text-destructive flex items-center gap-1" [title]="product.rejectionReason || 'Aucune raison spécifiée'">
                <z-icon zType="circle-alert" class="h-3 w-3" />
                Rejeté
              </span>
            }
          </div>
          
          <!-- Raison du rejet si applicable -->
          @if (product.status === 'REJECTED' && product.rejectionReason) {
            <div class="text-xs text-destructive/80 bg-destructive/10 p-2 rounded mb-2 max-w-xs">
              <strong>Raison:</strong> {{ product.rejectionReason }}
            </div>
          }
          
          <!-- Actions -->
          <div class="flex flex-wrap justify-end gap-2">
            <a z-button zType="outline" zSize="sm" [routerLink]="['/seller/products', product._id]">
              Détails
            </a>
            <a z-button zType="outline" zSize="sm" [routerLink]="['/seller/products', product._id, 'edit']">
              Modifier
            </a>
            @if (product.status !== 'ARCHIVED') {
              <button z-button zType="outline" zSize="sm" (click)="archive(product)">Archiver</button>
            }
            <button z-button zType="destructive" zSize="sm" (click)="remove(product)">Supprimer</button>
          </div>
        </div>
      </ng-template>

      @if (productService.pagination(); as pagination) {
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
export class SellerProductListComponent implements OnInit {
  readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly shopService = inject(ShopService);
  private readonly toast = inject(ToastService);

  readonly shops = signal<Shop[]>([]);
  readonly currentPage = signal(1);
  searchTerm = '';
  selectedStatus: Product['status'] | 'ALL' = 'ALL';
  selectedShopId = '';

  readonly columns: DataTableColumn[] = [
    {
      accessorKey: 'title',
      header: 'Titre',
    },
    {
      accessorKey: 'category',
      header: 'Catégorie',
    },
    {
      accessorFn: (product: unknown) =>
        `${(product as Product).price.toLocaleString('fr-FR')} MGA`,
      id: 'price',
      header: 'Prix',
    },
    {
      accessorFn: (product: unknown) => {
        const current = product as Product;
        if (typeof current.shopId === 'string') return current.shopId;
        return current.shopId.name;
      },
      id: 'shop',
      header: 'Boutique',
    },
  ];

  ngOnInit(): void {
    void this.loadShops();
    void this.loadProducts();
  }

  async loadShops(): Promise<void> {
    try {
      const response = await this.shopService.getMyShops(undefined, 1, 100);
      this.shops.set(response.shops);
    } catch {
      this.toast.error('Impossible de charger les boutiques');
    }
  }

  async loadProducts(): Promise<void> {
    try {
      await this.productService.getMyProducts(
        {
          search: this.searchTerm || undefined,
          status: this.selectedStatus,
          shopId: this.selectedShopId || undefined,
        },
        this.currentPage(),
      );
    } catch {
      this.toast.error('Impossible de charger les produits');
    }
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    void this.loadProducts();
  }

  goToPage(page: number): void {
    const pagination = this.productService.pagination();
    const maxPage = pagination?.pages || 1;
    const nextPage = Math.min(Math.max(page, 1), maxPage);
    this.currentPage.set(nextPage);
    void this.loadProducts();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'ALL';
    this.selectedShopId = '';
    this.currentPage.set(1);
    void this.loadProducts();
  }

  goToCreateProduct(): void {
    void this.router.navigate(['/seller/products/new']);
  }

  async archive(product: Product): Promise<void> {
    try {
      await this.productService.updateProduct(product._id, { status: 'ARCHIVED' });
      this.toast.success('Produit archivé');
      await this.loadProducts();
    } catch {
      this.toast.error('Échec de l\'archivage');
    }
  }

  async remove(product: Product): Promise<void> {
    const confirmed = window.confirm(`Supprimer définitivement ${product.title} ?`);
    if (!confirmed) return;

    try {
      await this.productService.deleteProduct(product._id);
      this.toast.success('Produit supprimé');
      await this.loadProducts();
    } catch {
      this.toast.error('Échec de suppression');
    }
  }

  // === Helpers pour le statut ===

  getStatusLabel(status: ProductStatus): string {
    const labels: Record<ProductStatus, string> = {
      DRAFT: 'Brouillon',
      PENDING: 'En attente',
      ACTIVE: 'Actif',
      REJECTED: 'Rejeté',
      ARCHIVED: 'Archivé',
    };
    return labels[status] || status;
  }

  getStatusBadgeType(
    status: ProductStatus,
  ): 'default' | 'secondary' | 'destructive' | 'outline' {
    const types: Record<
      ProductStatus,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      DRAFT: 'secondary',
      PENDING: 'outline',
      ACTIVE: 'default',
      REJECTED: 'destructive',
      ARCHIVED: 'secondary',
    };
    return types[status] || 'secondary';
  }
}
