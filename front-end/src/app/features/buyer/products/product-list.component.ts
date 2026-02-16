import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, Params } from '@angular/router';
import {
  ProductService,
  CartService,
  ToastService,
  AuthService,
} from '../../../core/services';
import {
  Product,
  ProductFilters,
  PRODUCT_SORT_OPTIONS,
  ProductSortOption,
} from '../../../core/models';
import { ProductCardComponent } from './product-card.component';
import { ZardInputDirective } from '../../../shared/components/input';
import {
  ZardSelectComponent,
  ZardSelectItemComponent,
} from '../../../shared/components/select';
import { ZardButtonComponent } from '../../../shared/components/button';
import { ZardIconComponent } from '../../../shared/components/icon';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton';
import { ZardPaginationComponent } from '../../../shared/components/pagination';
import { ZardCheckboxComponent } from '../../../shared/components/checkbox';
import { ZardLabelComponent } from '../../../shared/components/label';
import { ZardSeparatorComponent } from '../../../shared/components/separator';
import { ZardBadgeComponent } from '../../../shared/components/badge';

/**
 * Page de liste des produits style Amazon
 * Sidebar filtres à gauche, grille produits à droite
 */
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProductCardComponent,
    ZardInputDirective,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardSkeletonComponent,
    ZardPaginationComponent,
    ZardCheckboxComponent,
    ZardLabelComponent,
    ZardSeparatorComponent,
    ZardBadgeComponent,
  ],
  template: `
    <div class="min-h-screen bg-muted/30">
      <!-- Header avec recherche -->
      <div class="bg-background border-b border-border sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <div class="flex items-center gap-4">
            <!-- Recherche -->
            <div class="flex-1 relative">
              <z-icon
                zType="search"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4"
              />
              <input
                z-input
                type="text"
                placeholder="Rechercher des produits..."
                class="w-full pl-10"
                [(ngModel)]="searchQuery"
                (keyup.enter)="applyFilters()"
              />
            </div>

            <!-- Tri -->
            <div class="w-48">
              <z-select
                zPlaceholder="Trier par"
                [(zValue)]="sortOption"
                (zSelectionChange)="applyFilters()"
              >
                @for (option of sortOptions; track option.value) {
                  <z-select-item [zValue]="option.value">
                    {{ option.label }}
                  </z-select-item>
                }
              </z-select>
            </div>

            <!-- Toggle filtres mobile -->
            <button
              z-button
              zType="outline"
              class="lg:hidden"
              (click)="showMobileFilters.set(!showMobileFilters())"
            >
              <z-icon zType="list-filter-plus" class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 py-6">
        <div class="flex gap-6">
          <!-- Sidebar Filtres -->
          <aside
            class="w-64 shrink-0 hidden lg:block"
            [class.hidden]="!showMobileFilters()"
            [class.block]="showMobileFilters()"
          >
            <div
              class="bg-background rounded-lg border border-border p-4 sticky top-24"
            >
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-semibold text-foreground">Filtres</h3>
                @if (hasActiveFilters()) {
                  <button
                    z-button
                    zType="ghost"
                    zSize="sm"
                    (click)="clearFilters()"
                  >
                    Effacer
                  </button>
                }
              </div>

              <!-- Catégorie -->
              <div class="mb-4">
                <z-label class="text-sm font-medium">Catégorie</z-label>
                <z-select
                  class="mt-2"
                  zPlaceholder="Toutes les catégories"
                  [(zValue)]="selectedCategory"
                  (zSelectionChange)="applyFilters()"
                >
                  <z-select-item zValue="">Toutes les catégories</z-select-item>
                  @for (cat of categories(); track cat) {
                    <z-select-item [zValue]="cat">{{ cat }}</z-select-item>
                  }
                </z-select>
              </div>

              <z-separator class="my-4" />

              <!-- Fourchette de prix -->
              <div class="mb-4">
                <z-label class="text-sm font-medium">Prix (MGA)</z-label>
                <div class="mt-2 flex gap-2 items-center">
                  <input
                    z-input
                    type="number"
                    placeholder="Min"
                    class="w-full"
                    [(ngModel)]="minPrice"
                    (blur)="applyFilters()"
                  />
                  <span class="text-muted-foreground">-</span>
                  <input
                    z-input
                    type="number"
                    placeholder="Max"
                    class="w-full"
                    [(ngModel)]="maxPrice"
                    (blur)="applyFilters()"
                  />
                </div>
              </div>

              <z-separator class="my-4" />

              <!-- Prix prédéfinis -->
              <div class="mb-4">
                <z-label class="text-sm font-medium mb-2 block"
                  >Gamme de prix</z-label
                >
                <div class="space-y-2">
                  @for (range of priceRanges; track range.label) {
                    <button
                      class="block w-full text-left text-sm py-1 px-2 rounded hover:bg-muted transition-colors"
                      [class.bg-primary]="isPriceRangeActive(range)"
                      [class.text-primary-foreground]="
                        isPriceRangeActive(range)
                      "
                      (click)="selectPriceRange(range)"
                    >
                      {{ range.label }}
                    </button>
                  }
                </div>
              </div>

              <z-separator class="my-4" />

              <!-- Disponibilité -->
              <div class="mb-4">
                <z-label class="text-sm font-medium mb-2 block"
                  >Disponibilité</z-label
                >
                <z-checkbox
                  [(ngModel)]="inStockOnly"
                  (ngModelChange)="applyFilters()"
                >
                  En stock uniquement
                </z-checkbox>
              </div>
            </div>
          </aside>

          <!-- Grille Produits -->
          <main class="flex-1">
            <!-- Résultats -->
            <div class="flex items-center justify-between mb-4">
              <p class="text-sm text-muted-foreground">
                @if (productService.pagination(); as pag) {
                  {{ pag.total }} résultat(s)
                  @if (searchQuery) {
                    pour "{{ searchQuery }}"
                  }
                }
              </p>

              <!-- Filtres actifs -->
              @if (hasActiveFilters()) {
                <div class="flex flex-wrap gap-2">
                  @if (selectedCategory) {
                    <z-badge zType="secondary" class="gap-1">
                      {{ selectedCategory }}
                      <button
                        class="hover:text-destructive"
                        (click)="selectedCategory = ''; applyFilters()"
                      >
                        <z-icon zType="x" zSize="sm" />
                      </button>
                    </z-badge>
                  }
                  @if (minPrice || maxPrice) {
                    <z-badge zType="secondary" class="gap-1">
                      {{ minPrice || 0 }} - {{ maxPrice || '∞' }} MGA
                      <button
                        class="hover:text-destructive"
                        (click)="
                          minPrice = undefined;
                          maxPrice = undefined;
                          applyFilters()
                        "
                      >
                        <z-icon zType="x" zSize="sm" />
                      </button>
                    </z-badge>
                  }
                </div>
              }
            </div>

            <!-- Loading state -->
            @if (productService.isLoading()) {
              <div
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) {
                  <div
                    class="bg-background rounded-lg border border-border p-4"
                  >
                    <z-skeleton class="aspect-square w-full rounded-lg" />
                    <z-skeleton class="h-4 w-20 mt-3" />
                    <z-skeleton class="h-5 w-full mt-2" />
                    <z-skeleton class="h-5 w-3/4 mt-1" />
                    <z-skeleton class="h-6 w-24 mt-3" />
                    <z-skeleton class="h-9 w-full mt-3" />
                  </div>
                }
              </div>
            } @else if (products().length === 0) {
              <!-- État vide -->
              <div class="text-center py-12">
                <z-icon
                  zType="search"
                  class="mx-auto h-12 w-12 text-muted-foreground"
                />
                <h3 class="mt-4 text-lg font-medium text-foreground">
                  Aucun produit trouvé
                </h3>
                <p class="mt-2 text-sm text-muted-foreground">
                  Essayez de modifier vos filtres ou votre recherche
                </p>
                <button z-button class="mt-4" (click)="clearFilters()">
                  Effacer les filtres
                </button>
              </div>
            } @else {
              <!-- Grille produits -->
              <div
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                @for (product of products(); track product._id) {
                  <app-product-card
                    [product]="product"
                    [isAddingToCart]="addingToCartId() === product._id"
                    (addToCart)="handleAddToCart($event)"
                    (viewDetails)="handleViewDetails($event)"
                  />
                }
              </div>

              <!-- Pagination -->
              @if (productService.pagination(); as pag) {
                @if (pag.pages > 1) {
                  <div class="mt-8 flex justify-center">
                    <z-pagination
                      [(zPageIndex)]="currentPage"
                      [zTotal]="pag.pages"
                      (zPageIndexChange)="onPageChange($event)"
                    />
                  </div>
                }
              }
            }
          </main>
        </div>
      </div>
    </div>
  `,
})
export class ProductListComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  // Services publics pour le template
  productService = inject(ProductService);
  cartService = inject(CartService);

  // Options de tri
  sortOptions = PRODUCT_SORT_OPTIONS;

  // Fourchettes de prix prédéfinies
  priceRanges = [
    { label: 'Moins de 10 000 MGA', min: 0, max: 10000 },
    { label: '10 000 - 50 000 MGA', min: 10000, max: 50000 },
    { label: '50 000 - 100 000 MGA', min: 50000, max: 100000 },
    { label: '100 000 - 500 000 MGA', min: 100000, max: 500000 },
    { label: 'Plus de 500 000 MGA', min: 500000, max: undefined },
  ];

  // États locaux
  searchQuery = '';
  selectedCategory = '';
  sortOption: ProductSortOption = '-createdAt';
  minPrice?: number;
  maxPrice?: number;
  inStockOnly = false;
  currentPage = 1;
  showMobileFilters = signal(false);
  addingToCartId = signal<string | null>(null);

  // Computed pour les produits
  products = computed(() => this.productService.products());
  categories = computed(() => this.productService.categories());

  ngOnInit(): void {
    // Charger les catégories
    this.productService.getCategories();
    // Lire les query params
    this.route.queryParams.subscribe((params: Params) => {
      this.searchQuery = params['search'] || '';
      this.selectedCategory = params['category'] || '';
      this.sortOption = (params['sort'] as ProductSortOption) || '-createdAt';
      this.minPrice = params['minPrice']
        ? Number(params['minPrice'])
        : undefined;
      this.maxPrice = params['maxPrice']
        ? Number(params['maxPrice'])
        : undefined;
      this.currentPage = params['page'] ? Number(params['page']) : 1;
      this.loadProducts();
    });

    // Charger le panier si l'utilisateur est connecté et est un BUYER
    if (
      this.authService.isAuthenticated() &&
      this.authService.userRole() === 'BUYER'
    ) {
      this.cartService.getCart().catch(() => {
        // Ignorer l'erreur si le panier n'existe pas encore
      });
    }
  }

  /**
   * Charge les produits avec les filtres actuels
   */
  async loadProducts(): Promise<void> {
    const filters: ProductFilters = {};

    if (this.searchQuery) filters.search = this.searchQuery;
    if (this.selectedCategory) filters.category = this.selectedCategory;
    if (this.minPrice !== undefined) filters.minPrice = this.minPrice;
    if (this.maxPrice !== undefined) filters.maxPrice = this.maxPrice;
    if (this.sortOption) filters.sort = this.sortOption;

    await this.productService.getProducts(filters, this.currentPage, 12);
  }

  /**
   * Applique les filtres et met à jour l'URL
   */
  applyFilters(): void {
    this.currentPage = 1;
    this.updateUrl();
    this.loadProducts();
  }

  /**
   * Met à jour l'URL avec les paramètres de filtre
   */
  updateUrl(): void {
    const queryParams: Record<string, string | number | undefined> = {};

    if (this.searchQuery) queryParams['search'] = this.searchQuery;
    if (this.selectedCategory) queryParams['category'] = this.selectedCategory;
    if (this.sortOption !== '-createdAt') queryParams['sort'] = this.sortOption;
    if (this.minPrice !== undefined) queryParams['minPrice'] = this.minPrice;
    if (this.maxPrice !== undefined) queryParams['maxPrice'] = this.maxPrice;
    if (this.currentPage > 1) queryParams['page'] = this.currentPage;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'replace',
    });
  }

  /**
   * Efface tous les filtres
   */
  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.sortOption = '-createdAt';
    this.minPrice = undefined;
    this.maxPrice = undefined;
    this.inStockOnly = false;
    this.currentPage = 1;
    this.applyFilters();
  }

  /**
   * Vérifie si des filtres sont actifs
   */
  hasActiveFilters(): boolean {
    return !!(
      this.searchQuery ||
      this.selectedCategory ||
      this.minPrice !== undefined ||
      this.maxPrice !== undefined
    );
  }

  /**
   * Sélectionne une fourchette de prix
   */
  selectPriceRange(range: {
    label: string;
    min: number;
    max: number | undefined;
  }): void {
    this.minPrice = range.min;
    this.maxPrice = range.max;
    this.applyFilters();
  }

  /**
   * Vérifie si une fourchette de prix est active
   */
  isPriceRangeActive(range: {
    label: string;
    min: number;
    max: number | undefined;
  }): boolean {
    return this.minPrice === range.min && this.maxPrice === range.max;
  }

  /**
   * Change de page
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.updateUrl();
    this.loadProducts();
    // Scroll vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Gère l'ajout au panier
   */
  async handleAddToCart(product: Product): Promise<void> {
    // Vérifier l'authentification
    if (!this.authService.isAuthenticated()) {
      this.toastService.info('Connectez-vous pour ajouter au panier');
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    // Vérifier que l'utilisateur est un BUYER
    if (this.authService.userRole() !== 'BUYER') {
      this.toastService.warning(
        'Seuls les acheteurs peuvent utiliser le panier',
      );
      return;
    }

    this.addingToCartId.set(product._id);
    try {
      await this.cartService.addItem(product._id, 1);
      this.toastService.success(`${product.title} ajouté au panier`);
    } catch {
      this.toastService.error("Erreur lors de l'ajout au panier");
    } finally {
      this.addingToCartId.set(null);
    }
  }

  /**
   * Gère la navigation vers le détail
   */
  handleViewDetails(product: Product): void {
    this.router.navigate(['/buyer/products', product._id]);
  }
}
