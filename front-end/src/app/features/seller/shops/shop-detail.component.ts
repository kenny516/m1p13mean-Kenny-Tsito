import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ImageManagementService, Product, ProductService, Shop, ShopService, ToastService } from '@/core';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { DataTableColumnDef, TanstackDataTableComponent } from '@/shared/components/data-table';
import { FilePickerComponent } from '@/shared/components/file-picker/file-picker.component';
import { IKImageDirective } from '@imagekit/angular';

@Component({
  selector: 'app-shop-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ZardCardComponent,
    ZardButtonComponent,
    TanstackDataTableComponent,
    FilePickerComponent,
    IKImageDirective,
  ],
  template: `
    <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-foreground">Détail boutique</h1>
            @if (shop(); as currentShop) {
              <p class="text-muted-foreground">{{ currentShop.name }} · {{ currentShop.status }}</p>
            }
          </div>
          <div class="flex gap-2">
            @if (shop(); as currentShop) {
              <a z-button zType="outline" [routerLink]="['/seller/shops', currentShop._id, 'edit']">Modifier</a>
            }
            <a z-button zType="outline" routerLink="/seller/shops">Retour</a>
          </div>
        </div>

        @if (shop(); as currentShop) {
          <z-card class="p-6">
            <div class="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 class="text-xl font-bold text-foreground">{{ currentShop.name }}</h2>
                <p class="text-sm text-muted-foreground">{{ currentShop.description || 'Aucune description' }}</p>
              </div>
              <span class="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                {{ currentShop.status }}
              </span>
            </div>

          <section class="space-y-4">
            <div>
              <h3 class="text-sm font-semibold text-foreground">Résumé</h3>
              <p class="text-xs text-muted-foreground">État général et métadonnées de la boutique.</p>
            </div>

          <div class="grid gap-4 md:grid-cols-4">
            <div>
              <p class="text-sm text-muted-foreground">Statut</p>
              <p class="font-medium">{{ currentShop.status }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Activation</p>
              <p class="font-medium">{{ currentShop.isActive ? 'Active' : 'Inactive' }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Commission</p>
              <p class="font-medium">{{ currentShop.commissionRate | number: '1.0-2' }}%</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Vendeur</p>
              <p class="font-medium">{{ sellerLabel(currentShop) }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Créée le</p>
              <p class="font-medium">{{ currentShop.createdAt | date: 'dd/MM/yyyy HH:mm' }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Dernière mise à jour</p>
              <p class="font-medium">{{ currentShop.updatedAt ? (currentShop.updatedAt | date: 'dd/MM/yyyy HH:mm') : '-' }}</p>
            </div>
          </div>

          <div class="mt-4">
            <p class="text-sm text-muted-foreground">Description</p>
            <p class="mt-1 whitespace-pre-line">{{ currentShop.description || '-' }}</p>
          </div>

          @if (currentShop.rejectionReason) {
            <div class="mt-4 rounded-md border border-border p-4">
              <p class="text-sm text-muted-foreground">Raison de rejet</p>
              <p class="font-medium">{{ currentShop.rejectionReason }}</p>
            </div>
          }
          </section>

          <section class="mt-6 space-y-4 border-t border-border pt-6">
            <div>
              <h3 class="text-sm font-semibold text-foreground">Médias</h3>
              <p class="text-xs text-muted-foreground">Gestion du logo et de la bannière de la boutique.</p>
            </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <p class="text-sm text-muted-foreground">Logo</p>
              <div class="group relative">
                @if (currentShop.logo) {
                  <img
                    [ikSrc]="currentShop.logo"
                    [transformation]="[{ width: 800, height: 500, quality: 90 }]"
                    [responsive]="false"
                    loading="lazy"
                    [alt]="currentShop.name + ' logo'"
                    class="h-44 w-full rounded-md border border-border bg-muted/40 object-contain"
                  />
                } @else {
                  <div class="flex h-44 w-full items-center justify-center rounded-md border border-border p-4 text-sm text-muted-foreground">
                    Aucun logo
                  </div>
                }

                <div class="pointer-events-none absolute inset-0 rounded-md bg-background/50 opacity-0 transition-opacity group-hover:opacity-100"></div>
                <div class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto">
                  <button
                    z-button
                    zType="outline"
                    zSize="sm"
                    type="button"
                    [disabled]="!currentShop.logo"
                    (click)="openMediaPreview(currentShop.logo)"
                  >
                    Voir
                  </button>
                  <app-file-picker
                    [label]="currentShop.logo ? 'Modifier' : 'Ajouter'"
                    [disabled]="isLogoBusy()"
                    buttonType="outline"
                    (fileSelected)="onShopLogoSelected($event)"
                  />
                  <button
                    z-button
                    zType="destructive"
                    zSize="sm"
                    type="button"
                    [disabled]="!currentShop.logo || isLogoBusy()"
                    (click)="deleteShopLogo()"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
            <div class="space-y-2">
              <p class="text-sm text-muted-foreground">Bannière</p>
              <div class="group relative">
                @if (currentShop.banner) {
                  <img
                    [ikSrc]="currentShop.banner"
                    [transformation]="[{ width: 1200, height: 600, quality: 90 }]"
                    [responsive]="false"
                    loading="lazy"
                    [alt]="currentShop.name + ' banner'"
                    class="h-44 w-full rounded-md border border-border object-cover"
                  />
                } @else {
                  <div class="flex h-44 w-full items-center justify-center rounded-md border border-border p-4 text-sm text-muted-foreground">
                    Aucune bannière
                  </div>
                }

                <div class="pointer-events-none absolute inset-0 rounded-md bg-background/50 opacity-0 transition-opacity group-hover:opacity-100"></div>
                <div class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto">
                  <button
                    z-button
                    zType="outline"
                    zSize="sm"
                    type="button"
                    [disabled]="!currentShop.banner"
                    (click)="openMediaPreview(currentShop.banner)"
                  >
                    Voir
                  </button>
                  <app-file-picker
                    [label]="currentShop.banner ? 'Modifier' : 'Ajouter'"
                    [disabled]="isBannerBusy()"
                    buttonType="outline"
                    (fileSelected)="onShopBannerSelected($event)"
                  />
                  <button
                    z-button
                    zType="destructive"
                    zSize="sm"
                    type="button"
                    [disabled]="!currentShop.banner || isBannerBusy()"
                    (click)="deleteShopBanner()"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
          </section>

          <section class="mt-6 space-y-4 border-t border-border pt-6">
            <div>
              <h3 class="text-sm font-semibold text-foreground">Contact et catégories</h3>
              <p class="text-xs text-muted-foreground">Coordonnées publiques et catégorisation.</p>
            </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <p class="text-sm text-muted-foreground">Email</p>
              <p class="font-medium">{{ currentShop.contact?.email || '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Téléphone</p>
              <p class="font-medium">{{ currentShop.contact?.phone || '-' }}</p>
            </div>
            <div class="md:col-span-2">
              <p class="text-sm text-muted-foreground">Adresse</p>
              <p class="font-medium">{{ currentShop.contact?.address || '-' }}</p>
            </div>
          </div>

          <div class="mt-6">
            <p class="text-sm text-muted-foreground">Catégories</p>
            <p class="mt-1">{{ (currentShop.categories || []).join(', ') || '-' }}</p>
          </div>
          </section>

          <section class="mt-6 space-y-4 border-t border-border pt-6">
            <h2 class="text-lg font-semibold text-foreground">Statistiques</h2>
            <div class="mt-3 grid gap-4 md:grid-cols-4">
              <div>
                <p class="text-sm text-muted-foreground">CA net</p>
                <p class="font-medium">{{ currentShop.stats.totalSales }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">CA livré</p>
                <p class="font-medium">{{ currentShop.stats.deliveredSalesAmount }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Produits totaux</p>
                <p class="font-medium">
                  {{
                    (currentShop.stats.products.active || 0) +
                    (currentShop.stats.products.pending || 0) +
                    (currentShop.stats.products.archived || 0)
                  }}
                </p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Note</p>
                <p class="font-medium">{{ currentShop.stats.rating | number: '1.1-2' }}</p>
              </div>
            </div>

            <div class="mt-3 grid gap-3 md:grid-cols-3">
              <div class="rounded-md border border-border p-3">
                <p class="text-xs text-muted-foreground">Produits actifs</p>
                <p class="text-sm font-semibold text-foreground">{{ currentShop.stats.products.active || 0 }}</p>
              </div>
              <div class="rounded-md border border-border p-3">
                <p class="text-xs text-muted-foreground">Produits en attente</p>
                <p class="text-sm font-semibold text-foreground">{{ currentShop.stats.products.pending || 0 }}</p>
              </div>
              <div class="rounded-md border border-border p-3">
                <p class="text-xs text-muted-foreground">Produits archivés</p>
                <p class="text-sm font-semibold text-foreground">{{ currentShop.stats.products.archived || 0 }}</p>
              </div>
            </div>
          </section>
        </z-card>

        <z-card class="p-6">
          <div class="mb-4 flex items-end justify-between gap-3">
            <div>
            <h2 class="text-lg font-semibold text-foreground">Produits de la boutique</h2>
            <p class="text-sm text-muted-foreground">Vue synthétique des produits liés à cette boutique.</p>
            </div>
            <p class="text-xs text-muted-foreground">{{ products().length }} produit(s)</p>
          </div>
          <app-tanstack-data-table
            [data]="products()"
            [columnDefs]="productColumns"
            emptyMessage="Aucun produit pour cette boutique"
          />
        </z-card>
        }
    </div>
  `,
})
export class ShopDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly shopService = inject(ShopService);
  private readonly productService = inject(ProductService);
  private readonly imageManagementService = inject(ImageManagementService);
  private readonly toast = inject(ToastService);

  readonly shop = signal<Shop | null>(null);
  readonly products = signal<Product[]>([]);
  readonly isLogoBusy = signal(false);
  readonly isBannerBusy = signal(false);

  readonly productColumns: DataTableColumnDef<Product>[] = [
    { id: 'title', accessorKey: 'title', header: 'Produit' },
    { id: 'status', accessorKey: 'status', header: 'Statut' },
    {
      accessorFn: (product: unknown) => `${(product as Product).price.toLocaleString('fr-FR')} MGA`,
      id: 'price',
      header: 'Prix',
    },
    {
      accessorFn: (product: unknown) => String((product as Product).stock?.cache?.available ?? 0),
      id: 'available',
      header: 'Stock dispo',
    },
    {
      accessorFn: (product: unknown) =>
        new Date((product as Product).updatedAt || (product as Product).createdAt).toLocaleDateString('fr-FR'),
      id: 'updatedAt',
      header: 'Maj',
    },
  ];

  ngOnInit(): void {
    const shopId = this.route.snapshot.paramMap.get('id');
    if (shopId) {
      void this.loadDetails(shopId);
    }
  }

  async loadDetails(shopId: string): Promise<void> {
    try {
      const shop = await this.shopService.getShop(shopId);
      this.shop.set(shop);
    } catch {
      this.toast.error('Impossible de charger le détail de la boutique');
      return;
    }

    try {
      const response = await this.productService.getMyProducts({ shopId }, 1, 100);
      this.products.set(response.products);
    } catch {
      this.toast.error('Impossible de charger les produits de la boutique');
    }
  }

  sellerLabel(shop: Shop): string {
    const seller = shop.sellerId as unknown;
    if (seller && typeof seller === 'object') {
      const user = seller as {
        email?: string;
        profile?: { firstName?: string; lastName?: string };
      };
      const fullName = `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim();
      return fullName || user.email || '-';
    }
    return typeof shop.sellerId === 'string' ? shop.sellerId : '-';
  }

  async onShopLogoSelected(file: File): Promise<void> {
    const currentShop = this.shop();
    if (!currentShop) {
      return;
    }

    this.isLogoBusy.set(true);
    try {
      const updatedShop = await this.imageManagementService.uploadShopAvatar(currentShop._id, file);
      this.shopService.setSelectedShop(updatedShop);
      this.shop.set(updatedShop);
      this.toast.success('Logo boutique mis à jour');
    } catch {
      this.toast.error('Impossible de mettre à jour le logo boutique');
    } finally {
      this.isLogoBusy.set(false);
    }
  }

  async deleteShopLogo(): Promise<void> {
    const currentShop = this.shop();
    if (!currentShop?.logo) {
      return;
    }

    this.isLogoBusy.set(true);
    try {
      const updatedShop = (await this.imageManagementService.deleteAvatar('shop', currentShop._id)) as Shop;
      this.shopService.setSelectedShop(updatedShop);
      this.shop.set(updatedShop);
      this.toast.success('Logo boutique supprimé');
    } catch {
      this.toast.error('Impossible de supprimer le logo boutique');
    } finally {
      this.isLogoBusy.set(false);
    }
  }

  async onShopBannerSelected(file: File): Promise<void> {
    const currentShop = this.shop();
    if (!currentShop) {
      return;
    }

    this.isBannerBusy.set(true);
    try {
      const updatedShop = await this.imageManagementService.uploadShopBanner(currentShop._id, file);
      this.shopService.setSelectedShop(updatedShop);
      this.shop.set(updatedShop);
      this.toast.success('Bannière boutique mise à jour');
    } catch {
      this.toast.error('Impossible de mettre à jour la bannière boutique');
    } finally {
      this.isBannerBusy.set(false);
    }
  }

  async deleteShopBanner(): Promise<void> {
    const currentShop = this.shop();
    if (!currentShop?.banner) {
      return;
    }

    this.isBannerBusy.set(true);
    try {
      const updatedShop = await this.imageManagementService.deleteShopBanner(currentShop._id);
      this.shopService.setSelectedShop(updatedShop);
      this.shop.set(updatedShop);
      this.toast.success('Bannière boutique supprimée');
    } catch {
      this.toast.error('Impossible de supprimer la bannière boutique');
    } finally {
      this.isBannerBusy.set(false);
    }
  }

  openMediaPreview(url?: string | null): void {
    if (!url) {
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
