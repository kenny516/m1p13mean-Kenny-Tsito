import { Routes } from '@angular/router';
import { ShopListComponent } from '@/features/seller/shops/shop-list.component';
import { SellerProductListComponent } from '@/features/seller/products/seller-product-list.component';
import { StockMovementListComponent } from '@/features/seller/stock-movements/stock-movement-list.component';

export const SELLER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shell/seller-shell.component').then((m) => m.SellerShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'shops',
      },
      {
        path: 'shops',
        loadComponent: () => Promise.resolve(ShopListComponent),
      },
      {
        path: 'shops/new',
        loadComponent: () =>
          import('./shops/shop-form.component').then((m) => m.ShopFormComponent),
      },
      {
        path: 'shops/:id',
        loadComponent: () =>
          import('./shops/shop-detail.component').then((m) => m.ShopDetailComponent),
      },
      {
        path: 'shops/:id/edit',
        loadComponent: () =>
          import('./shops/shop-form.component').then((m) => m.ShopFormComponent),
      },
      {
        path: 'products',
        loadComponent: () => Promise.resolve(SellerProductListComponent),
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./products/seller-product-form.component').then(
            (m) => m.SellerProductFormComponent,
          ),
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./products/seller-product-detail.component').then(
            (m) => m.SellerProductDetailComponent,
          ),
      },
      {
        path: 'products/:id/edit',
        loadComponent: () =>
          import('./products/seller-product-form.component').then(
            (m) => m.SellerProductFormComponent,
          ),
      },
      {
        path: 'stock-movements',
        loadComponent: () => Promise.resolve(StockMovementListComponent),
      },
      {
        path: 'stock-movements/new',
        loadComponent: () =>
          import('./stock-movements/stock-movement-form.component').then(
            (m) => m.StockMovementFormComponent,
          ),
      },
      {
        path: 'stock-movements/:id',
        loadComponent: () =>
          import('./stock-movements/stock-movement-detail.component').then(
            (m) => m.StockMovementDetailComponent,
          ),
      },
      {
        path: 'stock-movements/lines',
        loadComponent: () =>
          import('./stock-movements/stock-movement-lines.component').then(
            (m) => m.StockMovementLinesComponent,
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./orders/seller-orders.component').then(
            (m) => m.SellerOrdersComponent,
          ),
      },
    ],
  },
];
