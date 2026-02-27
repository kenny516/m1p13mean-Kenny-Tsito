import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { UserService, ToastService, UserStats } from '../../../core';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent } from '@/shared/components/icon';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective, ZardCardComponent, ZardIconComponent],
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
        <!-- Stats Cards - 4 colonnes -->
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
  isLoading = signal(false);

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
    await this.loadStats();
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
}
