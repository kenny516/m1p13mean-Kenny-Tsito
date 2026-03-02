import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { UserService, ToastService, UserStats, CommissionStats, CommissionChartStats } from '../../../core';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent } from '@/shared/components/icon';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, BaseChartDirective, ZardCardComponent, ZardIconComponent, DecimalPipe],
  template: `
    <div class="px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p class="mt-1 text-muted-foreground">Vue d'ensemble de la plateforme</p>
      </div>

      @if (isLoading()) {
        <!-- Loading State -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="bg-card rounded-lg border p-4 animate-pulse">
              <div class="h-3 bg-muted rounded w-1/2 mb-3"></div>
              <div class="h-7 bg-muted rounded w-1/3"></div>
            </div>
          }
        </div>
      } @else if (stats()) {
        <!-- Stats Cards - 4 colonnes utilisateurs -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="bg-card rounded-lg border p-4 border-l-4 border-l-blue-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-muted-foreground">Total Utilisateurs</p>
                <p class="text-2xl font-bold text-foreground mt-1">{{ stats()!.total }}</p>
              </div>
              <div class="p-2 bg-blue-100 rounded-full">
                <z-icon zType="users" class="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div class="bg-card rounded-lg border p-4 border-l-4 border-l-emerald-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-muted-foreground">Acheteurs</p>
                <p class="text-2xl font-bold text-foreground mt-1">{{ stats()!.byRole.buyers }}</p>
              </div>
              <div class="p-2 bg-emerald-100 rounded-full">
                <z-icon zType="shopping-bag" class="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div class="bg-card rounded-lg border p-4 border-l-4 border-l-violet-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-muted-foreground">Vendeurs</p>
                <p class="text-2xl font-bold text-foreground mt-1">{{ stats()!.byRole.sellers }}</p>
              </div>
              <div class="p-2 bg-violet-100 rounded-full">
                <z-icon zType="store" class="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </div>

          <div class="bg-card rounded-lg border p-4 border-l-4 border-l-amber-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-muted-foreground">En attente</p>
                <p class="text-2xl font-bold text-foreground mt-1">{{ stats()!.pendingValidation }}</p>
              </div>
              <div class="p-2 bg-amber-100 rounded-full">
                <z-icon zType="clock" class="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        <!-- Commission Stats Cards -->
        @if (commissionStats() || commissionError()) {
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div class="bg-card rounded-lg border p-4 border-l-4 border-l-green-500">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-muted-foreground">Total Commissions</p>
                  <p class="text-2xl font-bold text-green-600 mt-1">{{ formatCurrency(commissionStats()?.totalCommission ?? 0) }}</p>
                </div>
                <div class="p-2 bg-green-100 rounded-full">
                  <z-icon zType="circle-dollar-sign" class="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>

            <div class="bg-card rounded-lg border p-4 border-l-4 border-l-indigo-500">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-muted-foreground">Ventes Livrées</p>
                  <p class="text-2xl font-bold text-foreground mt-1">{{ formatCurrency(commissionStats()?.totalSalesAmount ?? 0) }}</p>
                </div>
                <div class="p-2 bg-indigo-100 rounded-full">
                  <z-icon zType="activity" class="h-5 w-5 text-indigo-600" />
                </div>
              </div>
            </div>

            <div class="bg-card rounded-lg border p-4 border-l-4 border-l-cyan-500">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-muted-foreground">Nombre de Ventes</p>
                  <p class="text-2xl font-bold text-foreground mt-1">{{ commissionStats()?.salesCount ?? 0 }}</p>
                </div>
                <div class="p-2 bg-cyan-100 rounded-full">
                  <z-icon zType="circle-check" class="h-5 w-5 text-cyan-600" />
                </div>
              </div>
            </div>
          </div>
          @if (commissionError()) {
            <div class="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
              <z-icon zType="triangle-alert" class="inline-block h-4 w-4 mr-2" />
              {{ commissionError() }}
            </div>
          }
        } @else if (isLoadingCommissions()) {
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            @for (i of [1, 2, 3]; track i) {
              <div class="bg-card rounded-lg border p-4 animate-pulse">
                <div class="h-3 bg-muted rounded w-1/2 mb-3"></div>
                <div class="h-7 bg-muted rounded w-1/3"></div>
              </div>
            }
          </div>
        }

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <!-- Donut Chart - Répartition des rôles -->
          <z-card class="p-4">
            <h3 class="text-sm font-semibold text-foreground mb-4">Répartition des utilisateurs</h3>
            <div class="h-64 flex items-center justify-center">
              <canvas
                baseChart
                [data]="doughnutChartData()"
                [options]="doughnutChartOptions"
                type="doughnut"
              ></canvas>
            </div>
          </z-card>

          <!-- Bar Chart - Statut des comptes -->
          <z-card class="p-4">
            <h3 class="text-sm font-semibold text-foreground mb-4">Statut des comptes</h3>
            <div class="h-64">
              <canvas
                baseChart
                [data]="barChartData()"
                [options]="barChartOptions"
                type="bar"
              ></canvas>
            </div>
          </z-card>
        </div>

        <!-- Commission Evolution Chart -->
        <z-card class="p-4 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-foreground">Évolution des commissions</h3>
            <div class="flex items-center gap-2">
              <select
                [(ngModel)]="commissionChartGroupBy"
                (ngModelChange)="loadCommissionChartStats()"
                class="text-xs bg-muted border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="day">Par jour</option>
                <option value="week">Par semaine</option>
                <option value="month">Par mois</option>
              </select>
            </div>
          </div>
          @if (isLoadingCommissionChart()) {
            <div class="h-64 flex items-center justify-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          } @else if (commissionChartData().datasets[0]?.data?.length) {
            <div class="h-64">
              <canvas
                baseChart
                [data]="commissionChartData()"
                [options]="lineChartOptions"
                type="line"
              ></canvas>
            </div>
          } @else {
            <div class="h-64 flex items-center justify-center text-muted-foreground">
              <div class="text-center">
                <z-icon zType="activity" class="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucune donnée disponible</p>
              </div>
            </div>
          }
        </z-card>

        <!-- Commission par boutique -->
        @if (commissionStats() && commissionStats()!.byShop.length > 0) {
          <z-card class="p-4 mb-6">
            <h3 class="text-sm font-semibold text-foreground mb-4">Commissions par boutique</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-border">
                    <th class="text-left py-2 px-3 text-muted-foreground font-medium">Boutique</th>
                    <th class="text-right py-2 px-3 text-muted-foreground font-medium">Ventes</th>
                    <th class="text-right py-2 px-3 text-muted-foreground font-medium">CA Total</th>
                    <th class="text-right py-2 px-3 text-muted-foreground font-medium">Commission</th>
                    <th class="text-right py-2 px-3 text-muted-foreground font-medium">Taux Moyen</th>
                  </tr>
                </thead>
                <tbody>
                  @for (shop of commissionStats()!.byShop; track shop.shopId) {
                    <tr class="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td class="py-3 px-3 font-medium text-foreground">{{ shop.shopName }}</td>
                      <td class="py-3 px-3 text-right text-muted-foreground">{{ shop.salesCount }}</td>
                      <td class="py-3 px-3 text-right text-muted-foreground">{{ formatCurrency(shop.totalSalesAmount) }}</td>
                      <td class="py-3 px-3 text-right font-medium text-green-600">{{ formatCurrency(shop.totalCommission) }}</td>
                      <td class="py-3 px-3 text-right text-muted-foreground">{{ shop.avgCommissionRate | number:'1.1-1' }}%</td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr class="bg-muted/20">
                    <td class="py-3 px-3 font-bold text-foreground">Total</td>
                    <td class="py-3 px-3 text-right font-bold text-foreground">{{ commissionStats()!.salesCount }}</td>
                    <td class="py-3 px-3 text-right font-bold text-foreground">{{ formatCurrency(commissionStats()!.totalSalesAmount) }}</td>
                    <td class="py-3 px-3 text-right font-bold text-green-600">{{ formatCurrency(commissionStats()!.totalCommission) }}</td>
                    <td class="py-3 px-3 text-right text-muted-foreground">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </z-card>
        }

        <!-- Bottom Row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Progress bars -->
          <z-card class="p-4 lg:col-span-2">
            <h3 class="text-sm font-semibold text-foreground mb-4">Répartition par rôle</h3>
            <div class="space-y-4">
              @for (role of roleProgress(); track role.name) {
                <div>
                  <div class="flex justify-between text-sm mb-1">
                    <span class="text-muted-foreground">{{ role.label }}</span>
                    <span class="font-medium text-foreground">{{ role.count }} ({{ role.percentage }}%)</span>
                  </div>
                  <div class="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      [style.width.%]="role.percentage"
                      [style.background-color]="role.color"
                    ></div>
                  </div>
                </div>
              }
            </div>
          </z-card>

          <!-- Actions rapides -->
          <z-card class="p-4">
            <h3 class="text-sm font-semibold text-foreground mb-4">Actions rapides</h3>
            <div class="space-y-2">
              <a
                routerLink="/admin/users"
                class="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
              >
                <div class="p-2 rounded-md bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <z-icon zType="users" class="h-4 w-4 text-blue-600" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-foreground">Utilisateurs</p>
                  <p class="text-xs text-muted-foreground truncate">Gérer les comptes</p>
                </div>
                <z-icon zType="chevron-right" class="h-4 w-4 text-muted-foreground" />
              </a>

              <a
                routerLink="/admin/shops"
                class="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
              >
                <div class="p-2 rounded-md bg-violet-100 group-hover:bg-violet-200 transition-colors">
                  <z-icon zType="store" class="h-4 w-4 text-violet-600" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-foreground">Boutiques</p>
                  <p class="text-xs text-muted-foreground truncate">Valider les demandes</p>
                </div>
                <z-icon zType="chevron-right" class="h-4 w-4 text-muted-foreground" />
              </a>

              <a
                routerLink="/admin/products"
                class="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
              >
                <div class="p-2 rounded-md bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                  <z-icon zType="package" class="h-4 w-4 text-emerald-600" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-foreground">Produits</p>
                  <p class="text-xs text-muted-foreground truncate">Modérer le catalogue</p>
                </div>
                <z-icon zType="chevron-right" class="h-4 w-4 text-muted-foreground" />
              </a>

              <a
                routerLink="/admin/users/new"
                class="flex items-center gap-3 p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors group"
              >
                <div class="p-2 rounded-md bg-primary/20 group-hover:bg-primary/30 transition-colors">
                  <z-icon zType="plus" class="h-4 w-4 text-primary" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-foreground">Créer un utilisateur</p>
                  <p class="text-xs text-muted-foreground truncate">Nouveau compte</p>
                </div>
                <z-icon zType="chevron-right" class="h-4 w-4 text-muted-foreground" />
              </a>
            </div>
          </z-card>
        </div>
      }
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  stats = signal<UserStats | null>(null);
  commissionStats = signal<CommissionStats | null>(null);
  commissionChartStats = signal<CommissionChartStats | null>(null);
  commissionError = signal<string | null>(null);
  isLoading = signal(false);
  isLoadingCommissions = signal(false);
  isLoadingCommissionChart = signal(false);
  commissionChartGroupBy: 'day' | 'week' | 'month' = 'day';

  // Couleurs chart vives et harmonisées (HEX direct)
  private chartColors = {
    blue: 'rgb(59, 130, 246)',      // blue-500
    emerald: 'rgb(16, 185, 129)',   // emerald-500
    violet: 'rgb(139, 92, 246)',    // violet-500
    amber: 'rgb(245, 158, 11)',     // amber-500
    rose: 'rgb(244, 63, 94)',       // rose-500
    indigo: 'rgb(99, 102, 241)',    // indigo-500
    cyan: 'rgb(6, 182, 212)',       // cyan-500
    pink: 'rgb(236, 72, 153)',      // pink-500
    green: 'rgb(34, 197, 94)',      // green-500
  };

  // Doughnut Chart Data
  doughnutChartData = computed<ChartData<'doughnut'>>(() => {
    const s = this.stats();
    if (!s) return { labels: [], datasets: [] };

    return {
      labels: ['Acheteurs', 'Vendeurs', 'Administrateurs'],
      datasets: [
        {
          data: [s.byRole.buyers, s.byRole.sellers, s.byRole.admins],
          backgroundColor: [
            this.chartColors.emerald,
            this.chartColors.violet,
            this.chartColors.blue,
          ],
          hoverBackgroundColor: [
            'rgb(5, 150, 105)',    // emerald-600
            'rgb(124, 58, 237)',   // violet-600
            'rgb(37, 99, 235)',    // blue-600
          ],
          borderWidth: 2,
          borderColor: 'rgb(255, 255, 255)',
          hoverOffset: 8,
        },
      ],
    };
  });

  doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '55%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            weight: 500,
          },
          color: 'rgb(100, 116, 139)', // slate-500
        },
      },
      tooltip: {
        backgroundColor: 'rgb(15, 23, 42)', // slate-900
        titleColor: 'rgb(255, 255, 255)',
        bodyColor: 'rgb(255, 255, 255)',
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 4,
      },
    },
  };

  // Bar Chart Data
  barChartData = computed<ChartData<'bar'>>(() => {
    const s = this.stats();
    if (!s) return { labels: [], datasets: [] };

    return {
      labels: ['Actifs', 'Inactifs', 'En attente'],
      datasets: [
        {
          label: 'Utilisateurs',
          data: [s.active, s.inactive, s.pendingValidation],
          backgroundColor: [
            this.chartColors.emerald,
            this.chartColors.rose,
            this.chartColors.amber,
          ],
          hoverBackgroundColor: [
            'rgb(5, 150, 105)',    // emerald-600
            'rgb(225, 29, 72)',    // rose-600
            'rgb(217, 119, 6)',    // amber-600
          ],
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 50,
        },
      ],
    };
  });

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgb(15, 23, 42)', // slate-900
        titleColor: 'rgb(255, 255, 255)',
        bodyColor: 'rgb(255, 255, 255)',
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.15)', // slate-400/15
        },
        ticks: {
          color: 'rgb(100, 116, 139)', // slate-500
          font: {
            size: 11,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgb(100, 116, 139)', // slate-500
          font: {
            size: 11,
            weight: 500,
          },
        },
      },
    },
  };

  // Line Chart Data pour commissions
  commissionChartData = computed<ChartData<'line'>>(() => {
    const chartStats = this.commissionChartStats();
    if (!chartStats || !chartStats.data.length) {
      return { labels: [], datasets: [] };
    }

    return {
      labels: chartStats.data.map(d => this.formatPeriodLabel(d.period, chartStats.groupBy)),
      datasets: [
        {
          label: 'Commissions (MGA)',
          data: chartStats.data.map(d => d.totalCommission),
          borderColor: this.chartColors.green,
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: this.chartColors.green,
          pointBorderColor: 'white',
          pointBorderWidth: 2,
        },
        {
          label: 'Ventes (MGA)',
          data: chartStats.data.map(d => d.totalSalesAmount),
          borderColor: this.chartColors.indigo,
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: this.chartColors.indigo,
          pointBorderColor: 'white',
          pointBorderWidth: 2,
        },
      ],
    };
  });

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 16,
          font: { size: 11 },
          color: 'rgb(100, 116, 139)',
        },
      },
      tooltip: {
        backgroundColor: 'rgb(15, 23, 42)',
        titleColor: 'rgb(255, 255, 255)',
        bodyColor: 'rgb(255, 255, 255)',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const value = context.raw as number;
            return `${context.dataset.label}: ${new Intl.NumberFormat('fr-MG').format(value)} MGA`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.15)' },
        ticks: {
          color: 'rgb(100, 116, 139)',
          font: { size: 10 },
          callback: (value) => new Intl.NumberFormat('fr-MG', { notation: 'compact' }).format(value as number),
        },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: 'rgb(100, 116, 139)',
          font: { size: 10 },
          maxRotation: 45,
        },
      },
    },
  };

  // Progress bars data
  roleProgress = computed(() => {
    const s = this.stats();
    if (!s) return [];

    const total = s.total || 1;
    return [
      {
        name: 'buyers',
        label: 'Acheteurs',
        count: s.byRole.buyers,
        percentage: Math.round((s.byRole.buyers / total) * 100),
        color: this.chartColors.emerald,
      },
      {
        name: 'sellers',
        label: 'Vendeurs',
        count: s.byRole.sellers,
        percentage: Math.round((s.byRole.sellers / total) * 100),
        color: this.chartColors.violet,
      },
      {
        name: 'admins',
        label: 'Administrateurs',
        count: s.byRole.admins,
        percentage: Math.round((s.byRole.admins / total) * 100),
        color: this.chartColors.blue,
      },
    ];
  });

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.loadStats(),
      this.loadCommissionStats(),
      this.loadCommissionChartStats(),
    ]);
  }

  async loadStats(): Promise<void> {
    this.isLoading.set(true);
    try {
      const stats = await this.userService.getStats();
      this.stats.set(stats);
    } catch (error) {
      this.toastService.error('Erreur lors du chargement des statistiques');
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadCommissionStats(): Promise<void> {
    this.isLoadingCommissions.set(true);
    this.commissionError.set(null);
    try {
      const commStats = await this.userService.getCommissionStats();
      this.commissionStats.set(commStats);
    } catch (error: any) {
      console.error('Erreur chargement commissions:', error);
      this.commissionError.set(error?.message || 'Erreur lors du chargement des statistiques de commission');
    } finally {
      this.isLoadingCommissions.set(false);
    }
  }

  async loadCommissionChartStats(): Promise<void> {
    this.isLoadingCommissionChart.set(true);
    try {
      const chartStats = await this.userService.getCommissionChartStats(this.commissionChartGroupBy);
      this.commissionChartStats.set(chartStats);
    } catch (error) {
      console.error('Erreur chargement chart commissions:', error);
    } finally {
      this.isLoadingCommissionChart.set(false);
    }
  }

  /**
   * Formate le label de période pour l'affichage
   */
  formatPeriodLabel(period: string, groupBy: string): string {
    if (groupBy === 'week') {
      return period; // 2026-W09
    } else if (groupBy === 'month') {
      const [year, month] = period.split('-');
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      return `${months[parseInt(month) - 1]} ${year}`;
    } else {
      // day: 2026-03-01 -> 01/03
      const [, month, day] = period.split('-');
      return `${day}/${month}`;
    }
  }

  /**
   * Formate un montant en devise MGA
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-MG', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' MGA';
  }
}
