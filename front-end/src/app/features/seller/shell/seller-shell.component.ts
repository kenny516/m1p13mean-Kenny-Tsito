import { CommonModule } from '@angular/common';
import { Component, signal, HostListener, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardIcon } from '@/shared/components/icon/icons';
import { filter } from 'rxjs';
import { NavigationContextService } from '@/core';

interface NavItem {
  label: string;
  icon: ZardIcon;
  route: string;
  exact?: boolean;
}

@Component({
  selector: 'app-seller-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ZardIconComponent,
  ],
  template: `
    <div class="min-h-screen bg-muted/30">
      <!-- Mobile Overlay -->
      @if (mobileMenuOpen()) {
        <div
          class="lg:hidden fixed inset-0 z-50 bg-black/50 transition-opacity"
          (click)="closeMobileMenu()"
        ></div>
      }

      <!-- Sidebar Mobile (slide from left) -->
      <aside
        class="lg:hidden fixed z-50 top-0 left-0 h-full w-72 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out"
        [class.translate-x-0]="mobileMenuOpen()"
        [class.-translate-x-full]="!mobileMenuOpen()"
      >
        <div class="flex flex-col h-full">
          <!-- Mobile Sidebar Header -->
          <div
            class="p-4 border-b border-sidebar-border flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-9 h-9 rounded-lg bg-primary flex items-center justify-center"
              >
                <z-icon
                  zType="store"
                  class="h-5 w-5 text-primary-foreground"
                />
              </div>
              <div>
                <h2 class="font-semibold text-sidebar-foreground">
                  Espace vendeur
                </h2>
                <p class="text-xs text-muted-foreground">Gestion boutique</p>
              </div>
            </div>
            <button
              (click)="closeMobileMenu()"
              class="p-2 rounded-md hover:bg-muted transition-colors"
            >
              <z-icon zType="x" class="h-5 w-5" />
            </button>
          </div>

          <!-- Mobile Navigation -->
          <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
            @for (item of navItems; track item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="bg-sidebar-accent text-sidebar-accent-foreground"
                [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                (click)="closeMobileMenu()"
              >
                <z-icon
                  [zType]="item.icon"
                  class="h-5 w-5 text-muted-foreground"
                />
                <span>{{ item.label }}</span>
              </a>
            }
          </nav>

          <!-- Mobile Footer -->
          <div class="p-3 border-t border-sidebar-border">
            <a
              routerLink="/buyer/products"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
              (click)="closeMobileMenu()"
            >
              <z-icon zType="arrow-left" class="h-5 w-5" />
              <span class="text-sm">Retour au catalogue</span>
            </a>
          </div>
        </div>
      </aside>

      <!-- Desktop Sidebar -->
      <aside
        class="hidden lg:block fixed z-40 top-12 h-[calc(100vh-3rem)] bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out overflow-hidden"
        [class.w-64]="!collapsed()"
        [class.w-16]="collapsed()"
      >
        <div class="flex flex-col h-full">
          <!-- Desktop Sidebar Header -->
          <div
            class="p-4 border-b border-sidebar-border"
            [class.px-3]="collapsed()"
          >
            <div
              class="flex items-center gap-3"
              [class.justify-center]="collapsed()"
            >
              <div
                class="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0"
              >
                <z-icon
                  zType="store"
                  class="h-5 w-5 text-primary-foreground"
                />
              </div>
              @if (!collapsed()) {
                <div class="overflow-hidden">
                  <h2 class="font-semibold text-sidebar-foreground truncate">
                    Espace vendeur
                  </h2>
                  <p class="text-xs text-muted-foreground truncate">
                    Gestion boutique
                  </p>
                </div>
              }
            </div>
          </div>

          <!-- Desktop Navigation -->
          <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
            @for (item of navItems; track item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="bg-sidebar-accent text-sidebar-accent-foreground"
                [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors group"
                [class.justify-center]="collapsed()"
                [class.px-2]="collapsed()"
                [title]="collapsed() ? item.label : ''"
              >
                <z-icon
                  [zType]="item.icon"
                  class="h-5 w-5 flex-shrink-0 text-muted-foreground group-hover:text-sidebar-foreground transition-colors"
                />
                @if (!collapsed()) {
                  <span class="truncate">{{ item.label }}</span>
                }
              </a>
            }
          </nav>

          <!-- Desktop Footer -->
          <div class="p-3 border-t border-sidebar-border space-y-2">
            <!-- Toggle collapse -->
            <button
              (click)="toggleCollapse()"
              class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
              [class.justify-center]="collapsed()"
              [class.px-2]="collapsed()"
            >
              <z-icon
                [zType]="collapsed() ? 'panel-left-open' : 'panel-left-close'"
                class="h-5 w-5 flex-shrink-0"
              />
              @if (!collapsed()) {
                <span class="text-sm">Réduire</span>
              }
            </button>

            <!-- Retour catalogue -->
            <a
              routerLink="/buyer/products"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
              [class.justify-center]="collapsed()"
              [class.px-2]="collapsed()"
              [title]="collapsed() ? 'Retour au catalogue' : ''"
            >
              <z-icon zType="arrow-left" class="h-5 w-5 flex-shrink-0" />
              @if (!collapsed()) {
                <span class="text-sm">Retour au catalogue</span>
              }
            </a>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main
        class="transition-all duration-300 ease-in-out min-h-[calc(100vh-3rem)] pt-6 lg:pt-6 pb-8"
        [class.lg:ml-64]="!collapsed()"
        [class.lg:ml-16]="collapsed()"
      >
        <!-- Breadcrumb desktop -->
        <div class="hidden lg:block px-6 lg:px-8 mb-4">
          <nav class="flex items-center gap-2 text-sm">
            <a
              routerLink="/seller"
              class="text-muted-foreground hover:text-foreground transition-colors"
            >
              Espace vendeur
            </a>
            @if (currentPageTitle() && currentPageTitle() !== "Mes boutiques") {
              <z-icon
                zType="chevron-right"
                class="h-4 w-4 text-muted-foreground"
              />
              <span class="text-foreground font-medium">{{
                currentPageTitle()
              }}</span>
            }
          </nav>
        </div>

        <router-outlet />
      </main>
    </div>
  `,
})
export class SellerShellComponent implements OnInit, OnDestroy {
  private navContextService = inject(NavigationContextService);

  collapsed = signal(false);
  currentPageTitle = signal("Mes boutiques");

  // Utiliser le service pour le menu mobile
  mobileMenuOpen = this.navContextService.mobileMenuOpen;

  navItems: NavItem[] = [
    {
      label: "Mes boutiques",
      icon: "store",
      route: "/seller/shops",
      exact: true,
    },
    { label: "Produits", icon: "package", route: "/seller/products" },
    { label: "Mouvements de stock", icon: "activity", route: "/seller/stock-movements" },
  ];

  constructor(private router: Router) {
    // Écouter les changements de route pour mettre à jour le titre
    router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updatePageTitle(event.urlAfterRedirects);
        this.closeMobileMenu();
      });

    // Initialiser le titre
    this.updatePageTitle(router.url);
  }

  ngOnInit(): void {
    // Enregistrer le shell auprès du service de navigation
    this.navContextService.registerShell({
      context: 'seller',
      title: 'Espace vendeur',
      icon: 'store',
      subtitle: 'Gestion boutique',
    });
  }

  ngOnDestroy(): void {
    // Désenregistrer le shell
    this.navContextService.unregisterShell();
  }

  // Fermer le menu mobile si on redimensionne vers desktop
  @HostListener("window:resize", ["$event"])
  onResize(): void {
    if (window.innerWidth >= 1024 && this.mobileMenuOpen()) {
      this.closeMobileMenu();
    }
  }

  private updatePageTitle(url: string): void {
    const titles: Record<string, string> = {
      "/seller/shops": "Mes boutiques",
      "/seller/products": "Produits",
      "/seller/stock-movements": "Mouvements de stock",
      "/seller/stock-movement-lines": "Lignes de mouvement",
    };

    // Chercher le titre correspondant
    for (const [path, title] of Object.entries(titles)) {
      if (url === path || url.startsWith(path + "/")) {
        this.currentPageTitle.set(title);
        return;
      }
    }
    this.currentPageTitle.set("Espace vendeur");
  }

  toggleCollapse(): void {
    this.collapsed.set(!this.collapsed());
  }

  toggleMobileMenu(): void {
    this.navContextService.toggleMobileMenu();
  }

  closeMobileMenu(): void {
    this.navContextService.closeMobileMenu();
  }
}
