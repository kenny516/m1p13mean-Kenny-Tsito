---
description: Règles et conventions pour le développement du frontend Angular
applyTo: front-end/**
---

# Frontend Instructions - Angular 19 + ZardUI

## 🎯 Stack Technique

- **Framework**: Angular 19
- **Langage**: TypeScript
- **UI Library**: ZardUI (@ngzard/ui) - Alternative shadcn pour Angular
- **Style**: Tailwind CSS
- **Architecture**: Standalone Components

---

## 📦 Installation ZardUI

### Prérequis
```bash
# Installer Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init

# Installer ZardUI
npm install @ngzard/ui
```

### Configuration Tailwind (`tailwind.config.js`)
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./node_modules/@ngzard/ui/**/*.{html,ts,js,mjs}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Styles globaux (`styles.css`)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Variables ZardUI (optionnel) */
:root {
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --border: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}
```

---

## 🎨 Composants ZardUI Disponibles

### Composants de base
- `ZardButton` - Boutons avec variantes
- `ZardInput` - Champs de saisie
- `ZardBadge` - Badges/Labels
- `ZardCheckbox` - Cases à cocher
- `ZardSwitch` - Interrupteurs
- `ZardAvatar` - Avatars utilisateur
- `ZardTooltip` - Info-bulles
- `ZardProgress` - Barres de progression

### Usage dans un composant
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZardButtonModule } from '@ngzard/ui/button';
import { ZardInputModule } from '@ngzard/ui/input';
import { ZardBadgeModule } from '@ngzard/ui/badge';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule,
    ZardButtonModule,
    ZardInputModule,
    ZardBadgeModule
  ],
  template: \`
    <div class="rounded-lg border bg-card p-4 shadow-sm">
      <zard-badge variant="secondary">Nouveau</zard-badge>
      <h3 class="mt-2 text-lg font-semibold">{{ product.title }}</h3>
      <p class="text-muted-foreground">{{ product.price | currency:'MGA' }}</p>
      <zard-button class="mt-4 w-full" (click)="addToCart()">
        Ajouter au panier
      </zard-button>
    </div>
  \`
})
export class ProductCardComponent {
  // ...
}
```

---

## 📁 Structure Recommandée

```
front-end/src/app/
├── core/                    # Services singleton, guards, interceptors
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── api.service.ts
│   │   └── storage.service.ts
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── role.guard.ts
│   ├── interceptors/
│   │   ├── auth.interceptor.ts
│   │   └── error.interceptor.ts
│   └── models/
│       ├── user.model.ts
│       ├── product.model.ts
│       └── order.model.ts
│
├── shared/                  # Composants, directives, pipes réutilisables
│   ├── components/
│   │   ├── header/
│   │   ├── footer/
│   │   ├── sidebar/
│   │   └── loading/
│   ├── directives/
│   └── pipes/
│
├── features/               # Modules de fonctionnalités
│   ├── auth/
│   │   ├── login/
│   │   ├── register/
│   │   └── auth.routes.ts
│   │
│   ├── buyer/              # Espace acheteur
│   │   ├── home/
│   │   ├── products/
│   │   ├── cart/
│   │   ├── orders/
│   │   ├── wallet/
│   │   └── buyer.routes.ts
│   │
│   ├── seller/             # Espace boutique
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── wallet/
│   │   └── seller.routes.ts
│   │
│   └── admin/              # Espace admin
│       ├── dashboard/
│       ├── shops/
│       ├── users/
│       ├── products/
│       └── admin.routes.ts
│
├── app.component.ts
├── app.config.ts
└── app.routes.ts
```

---

## 🧩 Standalone Components (Angular 19)

### Composant de base avec ZardUI

```typescript
import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ZardButtonModule } from "@ngzard/ui/button";
import { ZardCardModule } from "@ngzard/ui/card";

@Component({
  selector: "app-example",
  standalone: true,
  imports: [CommonModule, ZardButtonModule, ZardCardModule],
  template: \`
    <zard-card class="p-6">
      <h2 class="text-xl font-bold">Titre</h2>
      <p class="text-muted-foreground">Description</p>
      <zard-button variant="default" class="mt-4">
        Action
      </zard-button>
    </zard-card>
  \`,
})
export class ExampleComponent {
  // Logique du composant
}
```

### Composant avec injection de service et ZardUI

```typescript
import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProductService } from "@core/services/product.service";
import { Product } from "@core/models/product.model";
import { ZardButtonModule } from "@ngzard/ui/button";
import { ZardInputModule } from "@ngzard/ui/input";
import { ZardBadgeModule } from "@ngzard/ui/badge";
import { ZardSkeletonModule } from "@ngzard/ui/skeleton";

@Component({
  selector: "app-product-list",
  standalone: true,
  imports: [
    CommonModule,
    ZardButtonModule,
    ZardInputModule,
    ZardBadgeModule,
    ZardSkeletonModule
  ],
  template: \`
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-6">Nos Produits</h1>
      
      <!-- Loading state -->
      @if (loading) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          @for (i of [1,2,3,4,5,6]; track i) {
            <zard-skeleton class="h-64 w-full rounded-lg" />
          }
        </div>
      }

      <!-- Error state -->
      @if (error) {
        <div class="text-destructive p-4 border border-destructive rounded-lg">
          {{ error }}
        </div>
      }

      <!-- Products grid -->
      @if (!loading && !error) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          @for (product of products; track product._id) {
            <div class="rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
              <zard-badge [variant]="product.status === 'ACTIVE' ? 'default' : 'secondary'">
                {{ product.status }}
              </zard-badge>
              <h3 class="mt-2 text-lg font-semibold">{{ product.title }}</h3>
              <p class="text-muted-foreground">{{ product.price | number }} MGA</p>
              <zard-button class="mt-4 w-full">Voir détails</zard-button>
            </div>
          }
        </div>
      }
    </div>
  \`
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);

  products: Product[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadProducts();
  }

  async loadProducts(): Promise<void> {
    this.loading = true;
    try {
      this.products = await this.productService.getProducts();
    } catch (err) {
      this.error = "Erreur lors du chargement des produits";
    } finally {
      this.loading = false;
    }
  }
}
```

---

## 🔧 Services

### Service API générique

```typescript
import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "@environments/environment";
import { firstValueFrom } from "rxjs";

@Injectable({ providedIn: "root" })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  async get<T>(endpoint: string): Promise<T> {
    const response = await firstValueFrom(
      this.http.get<{ success: boolean; data: T }>(
        `${this.baseUrl}${endpoint}`,
      ),
    );
    return response.data;
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await firstValueFrom(
      this.http.post<{ success: boolean; data: T }>(
        `${this.baseUrl}${endpoint}`,
        data,
      ),
    );
    return response.data;
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await firstValueFrom(
      this.http.put<{ success: boolean; data: T }>(
        `${this.baseUrl}${endpoint}`,
        data,
      ),
    );
    return response.data;
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await firstValueFrom(
      this.http.delete<{ success: boolean; data: T }>(
        `${this.baseUrl}${endpoint}`,
      ),
    );
    return response.data;
  }
}
```

### Service d'authentification

```typescript
import { Injectable, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { ApiService } from "./api.service";
import { User } from "@core/models/user.model";

@Injectable({ providedIn: "root" })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  isAuthenticated = signal(false);

  async login(email: string, password: string): Promise<void> {
    const response = await this.api.post<{ user: User; token: string }>(
      "/auth/login",
      {
        email,
        password,
      },
    );

    localStorage.setItem("token", response.token);
    this.currentUser.set(response.user);
    this.isAuthenticated.set(true);

    this.redirectByRole(response.user.role);
  }

  logout(): void {
    localStorage.removeItem("token");
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(["/login"]);
  }

  private redirectByRole(role: string): void {
    switch (role) {
      case "ADMIN":
        this.router.navigate(["/admin"]);
        break;
      case "SELLER":
        this.router.navigate(["/seller"]);
        break;
      default:
        this.router.navigate(["/"]);
    }
  }
}
```

---

## 🛡️ Guards

### Guard d'authentification

```typescript
import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "@core/services/auth.service";

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(["/login"]);
  return false;
};
```

### Guard de rôle

```typescript
import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "@core/services/auth.service";

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = authService.currentUser();

    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    router.navigate(["/unauthorized"]);
    return false;
  };
};
```

---

## 🔄 Interceptors

### Interceptor d'authentification

```typescript
import { HttpInterceptorFn } from "@angular/common/http";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem("token");

  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(clonedReq);
  }

  return next(req);
};
```

### Interceptor d'erreurs

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        localStorage.removeItem("token");
        router.navigate(["/login"]);
      }
      return throwError(() => error);
    }),
  );
};
```

---

## 📐 Modèles TypeScript

### User

```typescript
export interface User {
  _id: string;
  email: string;
  role: "BUYER" | "SELLER" | "ADMIN";
  profile: {
    name: string;
    phone?: string;
    address?: string;
  };
  isValidated: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Product

```typescript
export interface Product {
  _id: string;
  shopId: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  reservedStock: number;
  tags: string[];
  characteristics: Record<string, any>;
  status: "PENDING" | "ACTIVE" | "REJECTED";
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Cart

```typescript
export interface CartItem {
  productId: string;
  product?: Product; // Populated
  priceSnapshot: number;
  quantity: number;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  expiresAt: Date;
}
```

---

## 🎨 Configuration des Routes

### Routes principales (`app.routes.ts`)

```typescript
import { Routes } from "@angular/router";
import { authGuard } from "@core/guards/auth.guard";
import { roleGuard } from "@core/guards/role.guard";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./features/buyer/home/home.component").then(
        (m) => m.HomeComponent,
      ),
  },
  {
    path: "auth",
    loadChildren: () =>
      import("./features/auth/auth.routes").then((m) => m.AUTH_ROUTES),
  },
  {
    path: "buyer",
    canActivate: [authGuard, roleGuard(["BUYER"])],
    loadChildren: () =>
      import("./features/buyer/buyer.routes").then((m) => m.BUYER_ROUTES),
  },
  {
    path: "seller",
    canActivate: [authGuard, roleGuard(["SELLER"])],
    loadChildren: () =>
      import("./features/seller/seller.routes").then((m) => m.SELLER_ROUTES),
  },
  {
    path: "admin",
    canActivate: [authGuard, roleGuard(["ADMIN"])],
    loadChildren: () =>
      import("./features/admin/admin.routes").then((m) => m.ADMIN_ROUTES),
  },
  {
    path: "**",
    redirectTo: "",
  },
];
```

---

## 🔧 Configuration (`app.config.ts`)

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { routes } from "./app.routes";
import { authInterceptor } from "@core/interceptors/auth.interceptor";
import { errorInterceptor } from "@core/interceptors/error.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
  ],
};
```

---

## 🌍 Environment

### `environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:3000/api",
};
```

### `environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: "https://votre-api.onrender.com/api",
};
```

---

## 📝 Footer Obligatoire

Le footer doit contenir (avec Tailwind CSS):

```html
<footer class="bg-muted mt-auto py-8">
  <div class="container mx-auto px-4 text-center">
    <p class="text-muted-foreground">© 2026 - Marketplace Centre Commercial</p>
    <p class="mt-2">
      Développé par <strong class="text-foreground">Kenny</strong> & 
      <strong class="text-foreground">Tsito</strong>
    </p>
    <p class="text-sm text-muted-foreground">Master 1 - Promotion 13</p>
    <a 
      href="https://github.com/kenny516/m1p13mean-Kenny-Tsito" 
      target="_blank"
      class="mt-2 inline-block text-primary hover:underline"
    >
      Voir le code source
    </a>
  </div>
</footer>
```

---

## 🎨 Classes Tailwind Utiles

### Layout
```html
<div class="container mx-auto px-4">          <!-- Container centré -->
<div class="grid grid-cols-1 md:grid-cols-3"> <!-- Grid responsive -->
<div class="flex items-center justify-between"> <!-- Flexbox -->
```

### Espacements
```html
<div class="p-4 m-2">     <!-- padding/margin -->
<div class="space-y-4">   <!-- espacement vertical entre enfants -->
<div class="gap-4">       <!-- gap pour grid/flex -->
```

### Typographie
```html
<h1 class="text-2xl font-bold">             <!-- Titre -->
<p class="text-muted-foreground text-sm">   <!-- Texte secondaire -->
<span class="text-primary">                 <!-- Couleur primaire -->
```

### États
```html
<button class="hover:bg-primary/90">        <!-- Hover -->
<div class="transition-all duration-200">   <!-- Animation -->
<input class="focus:ring-2 focus:ring-ring"> <!-- Focus -->
```

---

## ❌ À ÉVITER

1. `any` sans justification
2. Logique métier dans les composants
3. Requêtes HTTP directes sans service
4. Données sensibles dans le code source
5. Console.log en production
6. CSS inline (utiliser Tailwind)
7. Styles en fichiers séparés (préférer Tailwind inline)

---

## ✅ BONNES PRATIQUES

1. Utiliser les signals Angular pour l'état réactif
2. Lazy loading pour toutes les routes
3. Composants standalone avec ZardUI
4. Types stricts partout
5. Gestion d'erreurs centralisée
6. Loading states avec ZardUI Skeleton
7. Classes Tailwind pour le styling
8. Dark mode support via CSS variables
