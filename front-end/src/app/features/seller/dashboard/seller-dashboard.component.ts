import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { ShopService, StockMovementService, ToastService } from '@/core/services';
import {
  SellerDashboardSummary,
  SellerDashboardTrendPoint,
} from '@/core/models/stock-movement.model';
import { Shop } from '@/core/models/shop.model';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardSelectImports } from '@/shared/components/select';

type TrendMetric =
  | 'netSalesAmount'
  | 'grossSalesAmount'
  | 'deliveredSalesAmount'
  | 'salesCount'
  | 'returnCount'
  | 'suppliesCount';

type DashboardRange = '7d' | '30d' | 'mtd';
type RankingMode = 'shops' | 'productsAmount' | 'productsUnits';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    BaseChartDirective,
    ZardButtonComponent,
    ZardCardComponent,
    ...ZardSelectImports,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Dashboard vendeur</h1>
          <p class="text-muted-foreground">
            Vue opérationnelle des ventes, stocks et boutiques.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <z-select
            [(zValue)]="selectedShopId"
            (zSelectionChange)="reloadSummary()"
            zPlaceholder="Boutique"
            class="w-56"
          >
            <z-select-item zValue="">Toutes boutiques</z-select-item>
            @for (shop of shops(); track shop._id) {
              <z-select-item [zValue]="shop._id">{{ shop.name }}</z-select-item>
            }
          </z-select>

          <z-select
            [(zValue)]="selectedRange"
            (zSelectionChange)="reloadSummary()"
            zPlaceholder="Période"
            class="w-44"
          >
            <z-select-item zValue="7d">7 derniers jours</z-select-item>
            <z-select-item zValue="30d">30 derniers jours</z-select-item>
            <z-select-item zValue="mtd">Mois en cours</z-select-item>
          </z-select>

          <z-select
            [(zValue)]="selectedGroupBy"
            (zSelectionChange)="reloadSummary()"
            zPlaceholder="Regroupement"
            class="w-40"
          >
            <z-select-item zValue="day">Par jour</z-select-item>
            <z-select-item zValue="week">Par semaine</z-select-item>
            <z-select-item zValue="month">Par mois</z-select-item>
          </z-select>

          <button z-button zType="outline" (click)="reloadSummary()">
            Rafraîchir
          </button>
        </div>
      </div>

      @if (isLoading()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          @for (i of [1,2,3,4,5,6,7,8]; track i) {
            <div class="rounded-lg border bg-card p-4 animate-pulse">
              <div class="mb-2 h-3 w-2/3 rounded bg-muted"></div>
              <div class="h-6 w-1/2 rounded bg-muted"></div>
            </div>
          }
        </div>
      } @else if (summary(); as data) {
        <div class="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div class="space-y-6 xl:col-span-9">
            <div class="space-y-4">
              <div class="grid grid-cols-1 gap-4 lg:grid-cols-4">
                <z-card class="p-5 lg:col-span-2">
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <p class="text-xs font-medium uppercase tracking-wide text-primary">Performance globale</p>
                      <p class="mt-1 text-3xl font-bold text-primary">{{ formatCurrency(data.kpis.netSalesAmount) }}</p>
                      <p class="mt-2 text-sm text-muted-foreground">
                        CA brut {{ formatCurrency(data.kpis.grossSalesAmount) }} ·
                        retours {{ formatCurrency(data.kpis.returnAmount) }}
                      </p>
                    </div>
                    <span class="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                      {{ data.kpis.salesCount }} ventes
                    </span>
                  </div>
                  <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div class="rounded-md border border-border p-2">
                      <p class="text-xs text-muted-foreground">CA livré</p>
                      <p class="font-semibold text-foreground">{{ formatCurrency(data.kpis.deliveredSalesAmount) }}</p>
                    </div>
                    <div class="rounded-md border border-border p-2">
                      <p class="text-xs text-muted-foreground">Taux de retour</p>
                      <p class="font-semibold text-foreground">{{ returnRate(data) }}%</p>
                    </div>
                  </div>
                </z-card>

                <z-card class="p-5 min-h-36 bg-transparent">
                  <div class="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <p class="text-sm font-semibold">Ventes livrées</p>
                    <div class="flex h-20 w-20 items-center justify-center rounded-full border border-secondary/40">
                      <p class="text-3xl font-bold leading-none text-secondary">{{ data.kpis.deliveredCount }}</p>
                    </div>
                    <p class="text-sm text-muted-foreground">sur {{ data.kpis.salesCount }} ventes</p>
                  </div>
                </z-card>

                <z-card class="p-5 min-h-36 bg-transparent">
                  <div class="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <p class="text-sm font-semibold text-destructive">Retours</p>
                    <div class="flex h-20 w-20 items-center justify-center rounded-full border border-destructive/40">
                      <p class="text-3xl font-bold leading-none text-destructive">{{ data.kpis.returnCount }}</p>
                    </div>
                    <p class="text-sm text-muted-foreground">impact {{ formatCurrency(data.kpis.returnAmount) }}</p>
                  </div>
                </z-card>
              </div>

              <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <z-card class="p-4">
                  <p class="text-xs font-medium text-muted-foreground">Approvisionnements</p>
                  <p class="mt-1 text-2xl font-bold text-primary">{{ data.kpis.suppliesCount }}</p>
                </z-card>

                <z-card class="p-4">
                  <p class="text-xs font-medium text-muted-foreground">Produits actifs</p>
                  <p class="mt-1 text-2xl font-bold text-secondary">{{ data.kpis.activeProducts }}</p>
                  <p class="mt-1 text-xs text-muted-foreground">{{ data.kpis.pendingProducts }} en attente</p>
                </z-card>

                <z-card class="p-4">
                  <p class="text-xs font-medium text-muted-foreground">Stock bas</p>
                  <p class="mt-1 text-2xl font-bold text-primary">{{ data.kpis.lowStockProducts }}</p>
                  <p class="mt-1 text-xs text-muted-foreground">{{ data.kpis.outOfStockProducts }} ruptures</p>
                </z-card>

                <z-card class="p-4">
                  <p class="text-xs font-medium text-muted-foreground">Boutiques actives</p>
                  <p class="mt-1 text-2xl font-bold text-secondary">{{ data.kpis.activeShops }}</p>
                  <p class="mt-1 text-xs text-muted-foreground">{{ data.kpis.totalShops }} total</p>
                </z-card>
              </div>
            </div>

            <z-card class="p-4">
              <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 class="text-sm font-semibold text-foreground">Évolution temporelle</h3>
                <z-select
                  [(zValue)]="selectedTrendMetric"
                  zPlaceholder="Métrique"
                  class="w-56"
                >
                  <z-select-item zValue="netSalesAmount">CA net</z-select-item>
                  <z-select-item zValue="grossSalesAmount">CA brut</z-select-item>
                  <z-select-item zValue="deliveredSalesAmount">CA livré</z-select-item>
                  <z-select-item zValue="salesCount">Nb ventes</z-select-item>
                  <z-select-item zValue="returnCount">Nb retours</z-select-item>
                  <z-select-item zValue="suppliesCount">Nb approvisionnements</z-select-item>
                </z-select>
              </div>

              <div class="h-72">
                <canvas
                  baseChart
                  [data]="trendChartData()"
                  [options]="trendChartOptions"
                  type="line"
                ></canvas>
              </div>
            </z-card>

            <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <z-card class="p-4">
                <h3 class="mb-4 text-sm font-semibold text-foreground">Contexte ventes</h3>
                <div class="grid grid-cols-3 gap-3 mb-4">
                  <div class="rounded-md border p-3">
                    <p class="text-xs text-muted-foreground">Confirmées</p>
                    <p class="text-lg font-semibold">{{ data.orderStatus.confirmed }}</p>
                  </div>
                  <div class="rounded-md border p-3">
                    <p class="text-xs text-muted-foreground">Livrées</p>
                    <p class="text-lg font-semibold">{{ data.orderStatus.delivered }}</p>
                  </div>
                  <div class="rounded-md border p-3">
                    <p class="text-xs text-muted-foreground">Retournées</p>
                    <p class="text-lg font-semibold">{{ data.orderStatus.returned }}</p>
                  </div>
                </div>

                <div class="overflow-x-auto rounded-md border border-border">
                  <table class="w-full text-sm">
                    <thead class="bg-muted/30 text-muted-foreground">
                      <tr>
                        <th class="px-3 py-2 text-left">Référence</th>
                        <th class="px-3 py-2 text-left">Boutique</th>
                        <th class="px-3 py-2 text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (order of data.recent.orders; track order._id) {
                        <tr class="border-t border-border/60">
                          <td class="px-3 py-2">{{ order.reference }}</td>
                          <td class="px-3 py-2">{{ resolveShopName(order.shopId) }}</td>
                          <td class="px-3 py-2 text-right">{{ formatCurrency(order.totalAmount) }}</td>
                        </tr>
                      } @empty {
                        <tr>
                          <td class="px-3 py-6 text-center text-muted-foreground" colspan="3">
                            Aucune vente/retour récente
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </z-card>

              <z-card class="p-4">
                <h3 class="mb-4 text-sm font-semibold text-foreground">Contexte stock & supply</h3>

                <div class="grid grid-cols-2 gap-3 mb-4">
                  <div class="rounded-md border p-3">
                    <p class="text-xs text-muted-foreground">Produits stock bas</p>
                    <p class="text-lg font-semibold">{{ data.kpis.lowStockProducts }}</p>
                  </div>
                  <div class="rounded-md border p-3">
                    <p class="text-xs text-muted-foreground">Produits rupture</p>
                    <p class="text-lg font-semibold">{{ data.kpis.outOfStockProducts }}</p>
                  </div>
                </div>

                <div class="overflow-x-auto rounded-md border border-border">
                  <table class="w-full text-sm">
                    <thead class="bg-muted/30 text-muted-foreground">
                      <tr>
                        <th class="px-3 py-2 text-left">Référence</th>
                        <th class="px-3 py-2 text-left">Boutique</th>
                        <th class="px-3 py-2 text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (supply of data.recent.supplies; track supply._id) {
                        <tr class="border-t border-border/60">
                          <td class="px-3 py-2">{{ supply.reference }}</td>
                          <td class="px-3 py-2">{{ resolveShopName(supply.shopId) }}</td>
                          <td class="px-3 py-2 text-right">{{ formatCurrency(supply.totalAmount) }}</td>
                        </tr>
                      } @empty {
                        <tr>
                          <td class="px-3 py-6 text-center text-muted-foreground" colspan="3">
                            Aucun approvisionnement récent
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </z-card>
            </div>
          </div>

          <div class="space-y-6 xl:col-span-3">
            <z-card class="p-4 sticky top-20">
              <div class="mb-3 flex items-center justify-between gap-2">
                <h3 class="text-sm font-semibold text-foreground">Billboard classement</h3>
                <a [routerLink]="rankingRoute()" class="text-xs text-primary hover:underline">Voir</a>
              </div>

              <div class="mb-4 grid grid-cols-1 gap-2">
                <button
                  type="button"
                  class="rounded-md border px-3 py-2 text-left text-xs transition-colors"
                  [class.bg-primary/10]="selectedRankingMode() === 'shops'"
                  [class.border-primary/40]="selectedRankingMode() === 'shops'"
                  [class.text-foreground]="selectedRankingMode() === 'shops'"
                  [class.text-muted-foreground]="selectedRankingMode() !== 'shops'"
                  (click)="selectedRankingMode.set('shops')"
                >
                  Classement boutiques
                </button>
                <button
                  type="button"
                  class="rounded-md border px-3 py-2 text-left text-xs transition-colors"
                  [class.bg-primary/10]="selectedRankingMode() === 'productsAmount'"
                  [class.border-primary/40]="selectedRankingMode() === 'productsAmount'"
                  [class.text-foreground]="selectedRankingMode() === 'productsAmount'"
                  [class.text-muted-foreground]="selectedRankingMode() !== 'productsAmount'"
                  (click)="selectedRankingMode.set('productsAmount')"
                >
                  Classement produits (montant)
                </button>
                <button
                  type="button"
                  class="rounded-md border px-3 py-2 text-left text-xs transition-colors"
                  [class.bg-primary/10]="selectedRankingMode() === 'productsUnits'"
                  [class.border-primary/40]="selectedRankingMode() === 'productsUnits'"
                  [class.text-foreground]="selectedRankingMode() === 'productsUnits'"
                  [class.text-muted-foreground]="selectedRankingMode() !== 'productsUnits'"
                  (click)="selectedRankingMode.set('productsUnits')"
                >
                  Classement produits (unités)
                </button>
              </div>

              <div class="space-y-2">
                @for (item of rankingItems(); track item.id; let i = $index) {
                  <div class="rounded-md border p-2">
                    <div class="flex items-center justify-between gap-2">
                      <p class="text-xs font-semibold text-muted-foreground">#{{ i + 1 }}</p>
                      <p class="text-xs text-muted-foreground">{{ item.secondary }}</p>
                    </div>
                    <p class="mt-1 text-sm font-medium text-foreground truncate">{{ item.name }}</p>
                    <div class="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{{ item.hint }}</span>
                      <span class="font-medium text-foreground">{{ item.value }}</span>
                    </div>
                  </div>
                } @empty {
                  <p class="text-sm text-muted-foreground">Aucune donnée.</p>
                }
              </div>
            </z-card>
          </div>
        </div>
      }
    </div>
  `,
})
export class SellerDashboardComponent implements OnInit {
  private readonly shopService = inject(ShopService);
  private readonly stockMovementService = inject(StockMovementService);
  private readonly toast = inject(ToastService);

  readonly summary = signal<SellerDashboardSummary | null>(null);
  readonly isLoading = signal(false);
  readonly shops = signal<Shop[]>([]);

  selectedShopId = '';
  selectedRange: DashboardRange = '30d';
  selectedGroupBy: 'day' | 'week' | 'month' = 'day';
  selectedTrendMetric: TrendMetric = 'netSalesAmount';
  readonly selectedRankingMode = signal<RankingMode>('shops');

  readonly trendChartData = computed<ChartData<'line'>>(() => {
    const summary = this.summary();
    if (!summary) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const labels = summary.trend.map((point) => point.period);
    const values = summary.trend.map((point) => this.getTrendMetricValue(point));

    return {
      labels,
      datasets: [
        {
          data: values,
          label: this.getTrendMetricLabel(),
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    };
  });

  readonly trendChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  readonly rankingItems = computed(() => {
    const data = this.summary();
    const mode = this.selectedRankingMode();

    if (!data) return [];

    if (mode === 'shops') {
      return data.rankings.topShopsByRevenue.map((shop) => ({
        id: shop._id,
        name: shop.name,
        secondary: `${shop.netUnits} u. net`,
        hint: `${shop.returnUnits} retours`,
        value: this.formatCurrency(shop.netRevenue),
      }));
    }

    if (mode === 'productsAmount') {
      return data.rankings.topProductsByRevenue.map((product) => ({
        id: product._id,
        name: product.title,
        secondary: `${product.netUnits} u. net`,
        hint: `${product.returnUnits} retours`,
        value: this.formatCurrency(product.netRevenue),
      }));
    }

    return data.rankings.topProductsByUnits.map((product) => ({
      id: product._id,
      name: product.title,
      secondary: `${product.saleUnits} ventes`,
      hint: `${product.returnUnits} retours`,
      value: `${product.netUnits} u. net`,
    }));
  });

  readonly rankingRoute = computed(() => {
    const mode = this.selectedRankingMode();
    if (mode === 'shops') return '/seller/shops';
    return '/seller/products';
  });

  returnRate(data: SellerDashboardSummary): number {
    if (!data.kpis.salesCount) return 0;
    return Math.round((data.kpis.returnCount / data.kpis.salesCount) * 100);
  }

  ngOnInit(): void {
    void this.loadShops();
    void this.reloadSummary();
  }

  async loadShops(): Promise<void> {
    try {
      const response = await this.shopService.getMyShops(undefined, 1, 100);
      this.shops.set(response.shops);
    } catch {
      this.toast.error('Impossible de charger les boutiques');
    }
  }

  async reloadSummary(): Promise<void> {
    this.isLoading.set(true);
    try {
      const range = this.resolveDateRange(this.selectedRange);
      const summary = await this.stockMovementService.getDashboardSummary({
        startDate: range.startDate,
        endDate: range.endDate,
        groupBy: this.selectedGroupBy,
        shopId: this.selectedShopId || undefined,
        topLimit: 5,
      });

      this.summary.set(summary);
    } catch {
      this.toast.error('Impossible de charger les données du dashboard vendeur');
    } finally {
      this.isLoading.set(false);
    }
  }

  resolveShopName(
    shopId:
      | string
      | {
          _id: string;
          name?: string;
        }
      | undefined,
  ): string {
    if (!shopId) return '—';
    if (typeof shopId === 'string') return shopId;
    return shopId.name || shopId._id;
  }

  formatCurrency(value: number): string {
    return `${Math.round(value || 0).toLocaleString('fr-FR')} MGA`;
  }

  private resolveDateRange(range: DashboardRange): {
    startDate: string;
    endDate: string;
  } {
    const endDate = new Date();
    const startDate = new Date();

    if (range === '7d') {
      startDate.setDate(endDate.getDate() - 7);
    } else if (range === 'mtd') {
      startDate.setDate(1);
    } else {
      startDate.setDate(endDate.getDate() - 30);
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }

  private getTrendMetricValue(point: SellerDashboardTrendPoint): number {
    return Number(point[this.selectedTrendMetric] || 0);
  }

  private getTrendMetricLabel(): string {
    const labels: Record<TrendMetric, string> = {
      netSalesAmount: 'CA net',
      grossSalesAmount: 'CA brut',
      deliveredSalesAmount: 'CA livré',
      salesCount: 'Ventes',
      returnCount: 'Retours',
      suppliesCount: 'Approvisionnements',
    };

    return labels[this.selectedTrendMetric];
  }
}
