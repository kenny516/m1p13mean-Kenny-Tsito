import { Routes } from '@angular/router';

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
        loadComponent: () =>
          import('./shops/shop-list.component').then((m) => m.ShopListComponent),
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
        loadComponent: () =>
          import('./products/seller-product-list.component').then(
            (m) => m.SellerProductListComponent,
          ),
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
        loadComponent: () =>
          import('./stock-movements/stock-movement-list.component').then(
            (m) => m.StockMovementListComponent,
          ),
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
        path: 'stock-movement-lines',
        loadComponent: () =>
          import('./stock-movements/stockMovement-lines.component').then(
            (m) => m.StockMovementLinesComponent,
          ),
      },
    ],
  },
];
