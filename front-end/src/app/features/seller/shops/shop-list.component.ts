import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Shop, ShopService, ToastService } from '@/core';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { DataTableColumn, DataTableComponent } from '@/shared/components/data-table';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardSelectImports } from '@/shared/components/select';

@Component({
  selector: 'app-shop-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ZardCardComponent,
    ZardButtonComponent,
    ZardInputDirective,
    ...ZardSelectImports,
    DataTableComponent,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Mes boutiques</h1>
          <p class="text-muted-foreground">
            Créez et gérez toutes vos boutiques vendeur.
          </p>
        </div>
        <a z-button routerLink="/seller/shops/new">Nouvelle boutique</a>
      </div>

      <z-card class="p-4">
        <div class="grid gap-4 md:grid-cols-3">
          <div class="md:col-span-2">
            <input
              z-input
              [(ngModel)]="searchTerm"
              (input)="onFilterChange()"
              placeholder="Rechercher une boutique..."
            />
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

      @if (shopService.isLoading()) {
        <z-card class="p-10 text-center text-muted-foreground">Chargement...</z-card>
      } @else {
        <app-data-table
          [data]="shopService.shops()"
          [columns]="columns"
          [rowActions]="actionsTpl"
          emptyMessage="Aucune boutique trouvée"
        />
      }

      <ng-template #actionsTpl let-shop>
        <div class="flex flex-wrap justify-end gap-2">
          <a z-button zType="outline" zSize="sm" [routerLink]="['/seller/shops', shop._id]">
            Détails
          </a>
          <a z-button zType="outline" zSize="sm" [routerLink]="['/seller/shops', shop._id, 'edit']">
            Modifier
          </a>
          @if (shop.status === 'DRAFT' || shop.status === 'REJECTED') {
            <button z-button zSize="sm" (click)="submitForReview(shop)">Soumettre</button>
          }
          @if (shop.status === 'ACTIVE') {
            <button z-button zType="outline" zSize="sm" (click)="archive(shop)">Archiver</button>
          }
          @if (shop.status === 'ARCHIVED') {
            <button z-button zType="outline" zSize="sm" (click)="activate(shop)">Activer</button>
          }
          <button z-button zType="destructive" zSize="sm" (click)="remove(shop)">Supprimer</button>
        </div>
      </ng-template>

      @if (shopService.pagination(); as pagination) {
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
export class ShopListComponent implements OnInit {
  readonly shopService = inject(ShopService);
  private readonly toast = inject(ToastService);

  readonly currentPage = signal(1);
  searchTerm = '';
  selectedStatus = 'ALL';

  readonly columns: DataTableColumn[] = [
    {
      accessorKey: 'name',
      header: 'Nom',
    },
    {
      accessorKey: 'status',
      header: 'Statut',
    },
    {
      accessorFn: (shop: unknown) => ((shop as Shop).isActive ? 'Actif' : 'Inactif'),
      id: 'isActive',
      header: 'Activation',
    },
    {
      accessorFn: (shop: unknown) =>
        new Date((shop as Shop).createdAt).toLocaleDateString('fr-FR'),
      id: 'createdAt',
      header: 'Créée le',
    },
  ];

  ngOnInit(): void {
    void this.loadShops();
  }

  async loadShops(): Promise<void> {
    try {
      await this.shopService.getMyShops(
        {
          search: this.searchTerm || undefined,
          status: this.selectedStatus,
        },
        this.currentPage(),
      );
    } catch {
      this.toast.error('Impossible de charger les boutiques');
    }
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    void this.loadShops();
  }

  goToPage(page: number): void {
    const pagination = this.shopService.pagination();
    const maxPage = pagination?.pages || 1;
    const nextPage = Math.min(Math.max(page, 1), maxPage);
    this.currentPage.set(nextPage);
    void this.loadShops();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'ALL';
    this.currentPage.set(1);
    void this.loadShops();
  }

  async submitForReview(shop: Shop): Promise<void> {
    try {
      await this.shopService.submitShop(shop._id);
      this.toast.success('Boutique soumise pour validation');
      await this.loadShops();
    } catch {
      this.toast.error('Échec de soumission');
    }
  }

  async archive(shop: Shop): Promise<void> {
    try {
      await this.shopService.archiveShop(shop._id);
      this.toast.success('Boutique archivée');
      await this.loadShops();
    } catch {
      this.toast.error('Échec de l\'archivage');
    }
  }

  async activate(shop: Shop): Promise<void> {
    try {
      await this.shopService.activateShop(shop._id);
      this.toast.success('Boutique activée');
      await this.loadShops();
    } catch {
      this.toast.error('Échec de l\'activation');
    }
  }

  async remove(shop: Shop): Promise<void> {
    const confirmed = window.confirm(`Supprimer définitivement ${shop.name} ?`);
    if (!confirmed) return;

    try {
      await this.shopService.deleteShop(shop._id);
      this.toast.success('Boutique supprimée');
      await this.loadShops();
    } catch {
      this.toast.error('Échec de suppression');
    }
  }
}
