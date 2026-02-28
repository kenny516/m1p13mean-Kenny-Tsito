import {
  Component,
  inject,
  OnInit,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, ShopService, ToastService } from '@/core';
import { Product, ProductStatus, ProductFilters, Pagination, Shop } from '@/core/models';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardBadgeComponent } from '@/shared/components/badge';
import { ZardSelectImports } from '@/shared/components/select';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardLabelComponent } from '@/shared/components/label';
import { ZardAvatarComponent } from '@/shared/components/avatar';
import {
  TanstackDataTableComponent,
  DataTableColumnDef,
  SortChangeEvent,
  CellTemplateContext,
} from '@/shared/components/data-table';
import { ZardDialogService } from '@/shared/components/dialog';
import {
  ProductDetailDialogComponent,
  ProductDetailDialogData,
} from './product-detail-dialog.component';
import {
  ProductModerateDialogComponent,
  ModerateDialogData,
  ModerateDialogResult,
} from './product-moderate-dialog.component';

type ProductWithShop = Product & {
  shopId: Shop | string;
};

@Component({
  selector: 'app-admin-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ...ZardSelectImports,
    ZardInputDirective,
    ZardIconComponent,
    ZardLabelComponent,
    ZardAvatarComponent,
    TanstackDataTableComponent,
  ],
  template: `
    <div class="px-6 lg:px-8">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-foreground">
            Gestion des produits
          </h1>
          <p class="mt-1 text-muted-foreground">
            Validez et gérez les produits de la plateforme
          </p>
        </div>
        <div class="mt-4 sm:mt-0 flex items-center gap-4">
          @if (pendingCount() > 0) {
            <z-badge zType="destructive" zShape="pill" class="text-sm px-3 py-1">
              {{ pendingCount() }} en attente
            </z-badge>
          }
        </div>
      </div>

      <!-- Filtres -->
      <z-card class="mb-6">
        <div class="p-4">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <!-- Recherche -->
            <div class="lg:col-span-2">
              <z-label for="search">Rechercher</z-label>
              <input
                z-input
                id="search"
                type="text"
                [(ngModel)]="searchTerm"
                (input)="onSearch()"
                placeholder="Titre du produit..."
                class="mt-1"
              />
            </div>

            <!-- Filtre Status -->
            <div>
              <z-label>Statut</z-label>
              <z-select
                [(zValue)]="selectedStatus"
                (zSelectionChange)="onFilterChange()"
                zPlaceholder="Tous les statuts"
                class="mt-1 w-full"
              >
                <z-select-item zValue="ALL">Tous</z-select-item>
                <z-select-item zValue="PENDING">En attente</z-select-item>
                <z-select-item zValue="ACTIVE">Actif</z-select-item>
                <z-select-item zValue="DRAFT">Brouillon</z-select-item>
                <z-select-item zValue="REJECTED">Rejeté</z-select-item>
                <z-select-item zValue="ARCHIVED">Archivé</z-select-item>
              </z-select>
            </div>

            <!-- Filtre Catégorie -->
            <div>
              <z-label>Catégorie</z-label>
              <z-select
                [(zValue)]="selectedCategory"
                (zSelectionChange)="onFilterChange()"
                zPlaceholder="Toutes"
                class="mt-1 w-full"
              >
                <z-select-item zValue="">Toutes</z-select-item>
                @for (category of availableCategories(); track category) {
                  <z-select-item [zValue]="category">{{ category }}</z-select-item>
                }
              </z-select>
            </div>

            <!-- Tri -->
            <div>
              <z-label>Trier par</z-label>
              <z-select
                [(zValue)]="selectedSort"
                (zSelectionChange)="onFilterChange()"
                zPlaceholder="Date création"
                class="mt-1 w-full"
              >
                <z-select-item zValue="createdAt_desc">Plus récent</z-select-item>
                <z-select-item zValue="createdAt_asc">Plus ancien</z-select-item>
                <z-select-item zValue="title_asc">Titre A-Z</z-select-item>
                <z-select-item zValue="title_desc">Titre Z-A</z-select-item>
                <z-select-item zValue="price_asc">Prix ↑</z-select-item>
                <z-select-item zValue="price_desc">Prix ↓</z-select-item>
              </z-select>
            </div>
          </div>
        </div>
      </z-card>

      <!-- Table des produits -->
      <z-card class="overflow-hidden">
        <app-tanstack-data-table
          [data]="products()"
          [columnDefs]="columns"
          [rowActions]="actionsTemplate"
          [cellTemplates]="cellTemplatesMap()"
          [isLoading]="isLoading()"
          [emptyMessage]="'Aucun produit trouvé'"
          [emptyIcon]="'package'"
          (sortChange)="onSortChange($event)"
        />

        <!-- Pagination -->
        @if (pagination() && !isLoading()) {
          <div class="px-6 py-4 border-t border-border flex items-center justify-between">
            <div class="text-sm text-muted-foreground">
              Affichage de
              <span class="font-medium text-foreground">
                {{ (pagination()!.page - 1) * pagination()!.limit + 1 }}
              </span>
              à
              <span class="font-medium text-foreground">
                {{ Math.min(pagination()!.page * pagination()!.limit, pagination()!.total) }}
              </span>
              sur
              <span class="font-medium text-foreground">{{ pagination()!.total }}</span>
              résultats
            </div>
            <div class="flex space-x-2">
              <button
                z-button
                zType="outline"
                zSize="sm"
                (click)="goToPage(currentPage() - 1)"
                [disabled]="currentPage() === 1"
              >
                <z-icon zType="chevron-left" class="mr-1" />
                Précédent
              </button>
              <button
                z-button
                zType="outline"
                zSize="sm"
                (click)="goToPage(currentPage() + 1)"
                [disabled]="currentPage() >= pagination()!.pages"
              >
                Suivant
                <z-icon zType="chevron-right" class="ml-1" />
              </button>
            </div>
          </div>
        }
      </z-card>
    </div>

    <!-- Template pour la colonne Image -->
    <ng-template #imageCell let-product let-value="value">
      <z-avatar
        [zSrc]="getProductImage(product)"
        [zAlt]="product.title"
        [zFallback]="getProductInitials(product)"
        class="h-10 w-10"
      />
    </ng-template>

    <!-- Template pour la colonne Titre + Boutique -->
    <ng-template #titleCell let-product>
      <div class="flex flex-col">
        <span class="font-medium text-foreground">{{ product.title }}</span>
        <span class="text-sm text-muted-foreground">
          {{ getShopName(product) }}
        </span>
      </div>
    </ng-template>

    <!-- Template pour la colonne Status -->
    <ng-template #statusCell let-product>
      <z-badge [zType]="getStatusBadgeType(product.status)" zShape="pill">
        {{ getStatusLabel(product.status) }}
      </z-badge>
    </ng-template>

    <!-- Template pour la colonne Prix -->
    <ng-template #priceCell let-product>
      <span class="font-mono">{{ product.price | number }} MGA</span>
    </ng-template>

    <!-- Template pour la colonne Catégorie -->
    <ng-template #categoryCell let-product>
      <z-badge zType="secondary" zShape="pill" class="text-xs">
        {{ product.category }}
      </z-badge>
    </ng-template>

    <!-- Template pour la colonne Date -->
    <ng-template #dateCell let-product>
      {{ product.createdAt | date: 'dd/MM/yyyy' }}
    </ng-template>

    <!-- Template pour les actions -->
    <ng-template #actionsTemplate let-product>
      <div class="flex items-center justify-end space-x-1">
        <button
          z-button
          zType="ghost"
          zSize="sm"
          data-icon-only
          (click)="viewDetails(product)"
          title="Voir détails"
        >
          <z-icon zType="eye" />
        </button>
        @if (product.status !== 'DRAFT') {
          <button
            z-button
            zType="ghost"
            zSize="sm"
            data-icon-only
            (click)="openModerateDialog(product, product.status)"
            title="Modifier le statut"
            class="text-primary hover:text-primary/80"
          >
            <z-icon zType="settings" />
          </button>
        }
      </div>
    </ng-template>
  `,
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private shopService = inject(ShopService);
  private toastService = inject(ToastService);
  private dialogService = inject(ZardDialogService);

  // Signals d'état
  products = signal<ProductWithShop[]>([]);
  pagination = signal<Pagination | null>(null);
  isLoading = signal(false);
  currentPage = signal(1);
  pendingCount = signal(0);
  availableCategories = signal<string[]>([]);

  // Filtres
  searchTerm = '';
  selectedStatus: ProductStatus | 'ALL' = 'ALL';
  selectedCategory = '';
  selectedSort = 'createdAt_desc';

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  Math = Math;

  // ViewChildren pour les templates
  readonly imageTemplate =
    viewChild<TemplateRef<CellTemplateContext<ProductWithShop>>>('imageCell');
  readonly titleTemplate =
    viewChild<TemplateRef<CellTemplateContext<ProductWithShop>>>('titleCell');
  readonly statusTemplate =
    viewChild<TemplateRef<CellTemplateContext<ProductWithShop>>>('statusCell');
  readonly priceTemplate =
    viewChild<TemplateRef<CellTemplateContext<ProductWithShop>>>('priceCell');
  readonly categoryTemplate =
    viewChild<TemplateRef<CellTemplateContext<ProductWithShop>>>(
      'categoryCell',
    );
  readonly dateTemplate =
    viewChild<TemplateRef<CellTemplateContext<ProductWithShop>>>('dateCell');
  readonly actionsTemplate =
    viewChild<TemplateRef<{ $implicit: ProductWithShop }>>('actionsTemplate');

  // Définition des colonnes
  columns: DataTableColumnDef<ProductWithShop>[] = [
    {
      id: 'image',
      header: '',
      accessorKey: 'images',
      enableSorting: false,
      meta: { headerClass: 'w-16', cellClass: 'w-16' },
    },
    {
      id: 'title',
      header: 'Produit',
      accessorKey: 'title',
      enableSorting: true,
    },
    {
      id: 'status',
      header: 'Statut',
      accessorKey: 'status',
      enableSorting: false,
      meta: { headerClass: 'w-32', cellClass: 'w-32' },
    },
    {
      id: 'category',
      header: 'Catégorie',
      accessorKey: 'category',
      enableSorting: false,
      meta: { headerClass: 'w-32', cellClass: 'w-32' },
    },
    {
      id: 'price',
      header: 'Prix',
      accessorKey: 'price',
      enableSorting: true,
      meta: { headerClass: 'w-32', cellClass: 'w-32' },
    },
    {
      id: 'createdAt',
      header: 'Date création',
      accessorKey: 'createdAt',
      enableSorting: true,
      meta: { headerClass: 'w-32', cellClass: 'w-32' },
    },
  ];

  // Map des templates de cellules
  cellTemplatesMap = signal<
    Record<string, TemplateRef<CellTemplateContext<ProductWithShop>>>
  >({});

  async ngOnInit(): Promise<void> {
    await this.loadProducts();
    await this.loadPendingCount();
    await this.loadCategories();

    // Initialiser les templates après le rendu
    setTimeout(() => {
      this.cellTemplatesMap.set({
        image: this.imageTemplate()!,
        title: this.titleTemplate()!,
        status: this.statusTemplate()!,
        category: this.categoryTemplate()!,
        price: this.priceTemplate()!,
        createdAt: this.dateTemplate()!,
      });
    });
  }

  async loadProducts(): Promise<void> {
    this.isLoading.set(true);
    try {
      const filters: ProductFilters = {
        search: this.searchTerm || undefined,
        status: this.selectedStatus,
        category: this.selectedCategory || undefined,
        sort: this.selectedSort,
      };

      const response = await this.productService.getAllProducts(
        filters,
        this.currentPage(),
        10,
      );

      this.products.set(response.products as ProductWithShop[]);
      this.pagination.set(response.pagination);
    } catch (error) {
      console.error('Erreur lors du chargement des produits', error);
      this.toastService.error('Erreur lors du chargement des produits');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadPendingCount(): Promise<void> {
    try {
      const response = await this.productService.getPendingProducts({}, 1, 1);
      this.pendingCount.set(response.pagination.total);
    } catch {
      // Ignorer l'erreur, ce n'est pas critique
    }
  }

  async loadCategories(): Promise<void> {
    try {
      const categories = await this.productService.getCategories();
      this.availableCategories.set(categories);
    } catch {
      // Ignorer l'erreur
    }
  }

  onSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadProducts();
    }, 300);
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadProducts();
  }

  onSortChange(event: SortChangeEvent): void {
    if (event.direction === null) {
      this.selectedSort = 'createdAt_desc';
    } else {
      this.selectedSort = `${event.column}_${event.direction}`;
    }
    this.loadProducts();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadProducts();
  }

  // === Helpers ===

  getProductImage(product: ProductWithShop): string {
    return product.images?.[0] || '';
  }

  getProductInitials(product: ProductWithShop): string {
    return product.title.substring(0, 2).toUpperCase();
  }

  getShopName(product: ProductWithShop): string {
    if (typeof product.shopId === 'string') {
      return 'Boutique inconnue';
    }
    return product.shopId.name || 'Boutique inconnue';
  }

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

  // === Dialogs ===

  viewDetails(product: ProductWithShop): void {
    const dialogData: ProductDetailDialogData = {
      product,
      onModerate: () => this.openModerateDialog(product, 'ACTIVE'),
    };

    this.dialogService.create({
      zContent: ProductDetailDialogComponent,
      zTitle: 'Détails du produit',
      zDescription: product.title,
      zData: dialogData,
      zWidth: '700px',
      zHideFooter: true,
      zClosable: true,
    });
  }

  openModerateDialog(
    product: ProductWithShop,
    initialStatus: ProductStatus,
  ): void {
    const handleConfirm = async (result: ModerateDialogResult) => {
      try {
        await this.productService.moderateProduct(product._id, {
          status: result.status,
          rejectionReason: result.rejectionReason,
        });

        const statusLabels: Record<string, string> = {
          ACTIVE: 'Produit activé avec succès',
          PENDING: 'Produit remis en attente',
          REJECTED: 'Produit rejeté',
          ARCHIVED: 'Produit archivé',
        };
        this.toastService.success(statusLabels[result.status] || 'Statut modifié');

        await this.loadProducts();
        await this.loadPendingCount();
      } catch (error) {
        console.error('Erreur lors de la modération', error);
        this.toastService.error('Erreur lors de la modération du produit');
      }
    };

    const dialogData: ModerateDialogData = {
      product,
      initialStatus,
      onConfirm: handleConfirm,
    };

    this.dialogService.create<ProductModerateDialogComponent, ModerateDialogData>({
      zContent: ProductModerateDialogComponent,
      zTitle: 'Modifier le statut du produit',
      zDescription: product.title,
      zData: dialogData,
      zWidth: '500px',
      zHideFooter: true,
      zClosable: true,
    });
  }
}
