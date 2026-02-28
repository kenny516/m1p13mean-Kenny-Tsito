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
import { ShopService, ToastService } from '@/core';
import { Shop, ShopStatus, ShopFilters, Pagination } from '@/core/models';
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
  ShopDetailDialogComponent,
  ShopDetailDialogData,
} from './shop-detail-dialog.component';
import {
  ShopModerateDialogComponent,
  ModerateDialogData,
  ModerateDialogResult,
} from './shop-moderate-dialog.component';

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

@Component({
  selector: 'app-shop-list',
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
            Gestion des boutiques
          </h1>
          <p class="mt-1 text-muted-foreground">
            Validez et gérez les boutiques de la plateforme
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
                placeholder="Nom de la boutique..."
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
                <z-select-item zValue="name_asc">Nom A-Z</z-select-item>
                <z-select-item zValue="name_desc">Nom Z-A</z-select-item>
                <z-select-item zValue="commissionRate_desc">Commission ↓</z-select-item>
                <z-select-item zValue="commissionRate_asc">Commission ↑</z-select-item>
              </z-select>
            </div>
          </div>
        </div>
      </z-card>

      <!-- Table des boutiques -->
      <z-card class="overflow-hidden">
        <app-tanstack-data-table
          [data]="shops()"
          [columnDefs]="columns"
          [rowActions]="actionsTemplate"
          [cellTemplates]="cellTemplatesMap()"
          [isLoading]="isLoading()"
          [emptyMessage]="'Aucune boutique trouvée'"
          [emptyIcon]="'store'"
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

    <!-- Template pour la colonne Logo -->
    <ng-template #logoCell let-shop let-value="value">
      <z-avatar
        [zSrc]="shop.logo"
        [zAlt]="shop.name"
        [zFallback]="getShopInitials(shop)"
        class="h-10 w-10"
      />
    </ng-template>

    <!-- Template pour la colonne Nom + Vendeur -->
    <ng-template #nameCell let-shop>
      <div class="flex flex-col">
        <span class="font-medium text-foreground">{{ shop.name }}</span>
        <span class="text-sm text-muted-foreground">
          {{ getSellerName(shop) }}
        </span>
      </div>
    </ng-template>

    <!-- Template pour la colonne Status -->
    <ng-template #statusCell let-shop>
      <z-badge [zType]="getStatusBadgeType(shop.status)" zShape="pill">
        {{ getStatusLabel(shop.status) }}
      </z-badge>
    </ng-template>

    <!-- Template pour la colonne Catégories -->
    <ng-template #categoriesCell let-shop>
      <div class="flex flex-wrap gap-1">
        @for (cat of (shop.categories || []).slice(0, 2); track cat) {
          <z-badge zType="secondary" zShape="pill" class="text-xs">{{
            cat
          }}</z-badge>
        }
        @if ((shop.categories || []).length > 2) {
          <z-badge zType="outline" zShape="pill" class="text-xs">
            +{{ shop.categories.length - 2 }}
          </z-badge>
        }
      </div>
    </ng-template>

    <!-- Template pour la colonne Commission -->
    <ng-template #commissionCell let-shop>
      <span class="font-mono">{{ shop.commissionRate }}%</span>
    </ng-template>

    <!-- Template pour la colonne Date -->
    <ng-template #dateCell let-shop>
      {{ shop.createdAt | date: 'dd/MM/yyyy' }}
    </ng-template>

    <!-- Template pour les actions -->
    <ng-template #actionsTemplate let-shop>
      <div class="flex items-center justify-end space-x-1">
        <button
          z-button
          zType="ghost"
          zSize="sm"
          data-icon-only
          (click)="viewDetails(shop)"
          title="Voir détails"
        >
          <z-icon zType="eye" />
        </button>
        @if (shop.status !== 'DRAFT') {
          <button
            z-button
            zType="ghost"
            zSize="sm"
            data-icon-only
            (click)="openModerateDialog(shop, shop.status)"
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
export class ShopListComponent implements OnInit {
  private shopService = inject(ShopService);
  private toastService = inject(ToastService);
  private dialogService = inject(ZardDialogService);

  // Signals d'état
  shops = signal<ShopWithSeller[]>([]);
  pagination = signal<Pagination | null>(null);
  isLoading = signal(false);
  currentPage = signal(1);
  pendingCount = signal(0);
  availableCategories = signal<string[]>([]);

  // Filtres
  searchTerm = '';
  selectedStatus: ShopStatus | 'ALL' = 'ALL';
  selectedCategory = '';
  selectedSort = 'createdAt_desc';

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  Math = Math;

  // ViewChildren pour les templates
  readonly logoTemplate =
    viewChild<TemplateRef<CellTemplateContext<ShopWithSeller>>>('logoCell');
  readonly nameTemplate =
    viewChild<TemplateRef<CellTemplateContext<ShopWithSeller>>>('nameCell');
  readonly statusTemplate =
    viewChild<TemplateRef<CellTemplateContext<ShopWithSeller>>>('statusCell');
  readonly categoriesTemplate =
    viewChild<TemplateRef<CellTemplateContext<ShopWithSeller>>>(
      'categoriesCell',
    );
  readonly commissionTemplate =
    viewChild<TemplateRef<CellTemplateContext<ShopWithSeller>>>(
      'commissionCell',
    );
  readonly dateTemplate =
    viewChild<TemplateRef<CellTemplateContext<ShopWithSeller>>>('dateCell');
  readonly actionsTemplate =
    viewChild<TemplateRef<{ $implicit: ShopWithSeller }>>('actionsTemplate');

  // Définition des colonnes
  columns: DataTableColumnDef<ShopWithSeller>[] = [
    {
      id: 'logo',
      header: '',
      accessorKey: 'logo',
      enableSorting: false,
      meta: { headerClass: 'w-16', cellClass: 'w-16' },
    },
    {
      id: 'name',
      header: 'Boutique',
      accessorKey: 'name',
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
      id: 'categories',
      header: 'Catégories',
      accessorKey: 'categories',
      enableSorting: false,
    },
    {
      id: 'commissionRate',
      header: 'Commission',
      accessorKey: 'commissionRate',
      enableSorting: true,
      meta: { headerClass: 'w-28', cellClass: 'w-28' },
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
    Record<string, TemplateRef<CellTemplateContext<ShopWithSeller>>>
  >({});

  async ngOnInit(): Promise<void> {
    await this.loadShops();
    await this.loadPendingCount();
    this.extractCategories();

    // Initialiser les templates après le rendu
    setTimeout(() => {
      this.cellTemplatesMap.set({
        logo: this.logoTemplate()!,
        name: this.nameTemplate()!,
        status: this.statusTemplate()!,
        categories: this.categoriesTemplate()!,
        commissionRate: this.commissionTemplate()!,
        createdAt: this.dateTemplate()!,
      });
    });
  }

  async loadShops(): Promise<void> {
    this.isLoading.set(true);
    try {
      const filters: ShopFilters = {
        search: this.searchTerm || undefined,
        status: this.selectedStatus,
        category: this.selectedCategory || undefined,
        sort: this.selectedSort as ShopFilters['sort'],
      };

      const response = await this.shopService.getAllShops(
        filters,
        this.currentPage(),
        10,
      );

      this.shops.set(response.shops as ShopWithSeller[]);
      this.pagination.set(response.pagination);
    } catch (error) {
      console.error('Erreur lors du chargement des boutiques', error);
      this.toastService.error('Erreur lors du chargement des boutiques');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadPendingCount(): Promise<void> {
    try {
      const response = await this.shopService.getPendingShops({}, 1, 1);
      this.pendingCount.set(response.pagination.total);
    } catch {
      // Ignorer l'erreur, ce n'est pas critique
    }
  }

  extractCategories(): void {
    const allCategories = new Set<string>();
    this.shops().forEach((shop) => {
      shop.categories?.forEach((cat) => allCategories.add(cat));
    });
    this.availableCategories.set(Array.from(allCategories).sort());
  }

  onSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadShops();
    }, 300);
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadShops();
  }

  onSortChange(event: SortChangeEvent): void {
    if (event.direction === null) {
      this.selectedSort = 'createdAt_desc';
    } else {
      this.selectedSort = `${event.column}_${event.direction}`;
    }
    this.loadShops();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadShops();
  }

  // === Helpers ===

  getShopInitials(shop: Shop): string {
    return shop.name.substring(0, 2).toUpperCase();
  }

  getSellerName(shop: ShopWithSeller): string {
    if (typeof shop.sellerId === 'string') {
      return 'Vendeur inconnu';
    }
    const seller = shop.sellerId;
    if (seller.profile?.firstName || seller.profile?.lastName) {
      return `${seller.profile.firstName || ''} ${seller.profile.lastName || ''}`.trim();
    }
    return seller.email || 'Vendeur inconnu';
  }

  getStatusLabel(status: ShopStatus): string {
    const labels: Record<ShopStatus, string> = {
      DRAFT: 'Brouillon',
      PENDING: 'En attente',
      ACTIVE: 'Actif',
      REJECTED: 'Rejeté',
      ARCHIVED: 'Archivé',
    };
    return labels[status] || status;
  }

  getStatusBadgeType(
    status: ShopStatus,
  ): 'default' | 'secondary' | 'destructive' | 'outline' {
    const types: Record<
      ShopStatus,
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

  viewDetails(shop: ShopWithSeller): void {
    const dialogData: ShopDetailDialogData = {
      shop,
      onModerate: () => this.openModerateDialog(shop, 'ACTIVE'),
    };

    this.dialogService.create({
      zContent: ShopDetailDialogComponent,
      zTitle: 'Détails de la boutique',
      zDescription: shop.name,
      zData: dialogData,
      zWidth: '600px',
      zHideFooter: true,
      zClosable: true,
    });
  }

  openModerateDialog(
    shop: ShopWithSeller,
    initialStatus: ShopStatus,
  ): void {
    const handleConfirm = async (result: ModerateDialogResult) => {
      try {
        await this.shopService.moderateShop(shop._id, {
          status: result.status,
          rejectionReason: result.rejectionReason,
        });

        const statusLabels: Record<string, string> = {
          ACTIVE: 'Boutique activée avec succès',
          PENDING: 'Boutique remise en attente',
          REJECTED: 'Boutique rejetée',
          ARCHIVED: 'Boutique archivée',
        };
        this.toastService.success(statusLabels[result.status] || 'Statut modifié');

        await this.loadShops();
        await this.loadPendingCount();
      } catch (error) {
        console.error('Erreur lors de la modération', error);
        this.toastService.error('Erreur lors de la modération de la boutique');
      }
    };

    const dialogData: ModerateDialogData = {
      shop,
      initialStatus,
      onConfirm: handleConfirm,
    };

    this.dialogService.create<ShopModerateDialogComponent, ModerateDialogData>({
      zContent: ShopModerateDialogComponent,
      zTitle: 'Modifier le statut de la boutique',
      zDescription: shop.name,
      zData: dialogData,
      zWidth: '500px',
      zHideFooter: true,
      zClosable: true,
    });
  }
}
