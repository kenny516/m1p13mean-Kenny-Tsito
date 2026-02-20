import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  Product,
  ProductService,
  Shop,
  ShopService,
  StockMovementService,
  ToastService,
} from '@/core';
import { StockMovementPaymentMethod } from '@/core/models/stock-movement.model';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardSelectImports } from '@/shared/components/select';

@Component({
  selector: 'app-stock-movement-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ZardCardComponent,
    ZardButtonComponent,
    ZardInputDirective,
    ...ZardSelectImports,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Créer un mouvement de stock</h1>
          <p class="text-muted-foreground">Créez un mouvement avec ses lignes.</p>
        </div>
        <a z-button zType="outline" routerLink="/seller/stock-movements">Retour</a>
      </div>

      <z-card class="p-6">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <p class="mb-1 text-sm text-muted-foreground">Type *</p>
              <z-select formControlName="movementType" class="w-full">
                <z-select-item zValue="SUPPLY">SUPPLY</z-select-item>
                <z-select-item zValue="SALE">SALE</z-select-item>
              </z-select>
            </div>
            <div>
              <p class="mb-1 text-sm text-muted-foreground">Date *</p>
              <input z-input type="datetime-local" formControlName="date" />
            </div>
            <div>
              <p class="mb-1 text-sm text-muted-foreground">Note</p>
              <input z-input formControlName="note" placeholder="Note optionnelle" />
            </div>
          </div>

          @if (form.value.movementType === 'SUPPLY') {
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <p class="mb-1 text-sm text-muted-foreground">Fournisseur *</p>
                <input z-input formControlName="supplierName" placeholder="Nom fournisseur" />
              </div>
              <div>
                <p class="mb-1 text-sm text-muted-foreground">Contact fournisseur</p>
                <input z-input formControlName="supplierContact" placeholder="Téléphone / email" />
              </div>
            </div>
          }

          @if (form.value.movementType === 'SALE') {
            <div class="space-y-4 rounded-md border border-border p-4">
              <h3 class="font-medium">Informations de vente</h3>
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <p class="mb-1 text-sm text-muted-foreground">Cart ID *</p>
                  <input z-input formControlName="saleCartId" placeholder="ObjectId du panier" />
                </div>
                <div>
                  <p class="mb-1 text-sm text-muted-foreground">Méthode de paiement *</p>
                  <z-select formControlName="paymentMethod" class="w-full">
                    @for (method of paymentMethods; track method) {
                      <z-select-item [zValue]="method">{{ method }}</z-select-item>
                    }
                  </z-select>
                </div>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <p class="mb-1 text-sm text-muted-foreground">Rue *</p>
                  <input z-input formControlName="deliveryStreet" />
                </div>
                <div>
                  <p class="mb-1 text-sm text-muted-foreground">Ville *</p>
                  <input z-input formControlName="deliveryCity" />
                </div>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <p class="mb-1 text-sm text-muted-foreground">Code postal</p>
                  <input z-input formControlName="deliveryPostalCode" />
                </div>
                <div>
                  <p class="mb-1 text-sm text-muted-foreground">Pays</p>
                  <input z-input formControlName="deliveryCountry" />
                </div>
              </div>
            </div>
          }

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="font-medium text-foreground">Lignes du mouvement</h3>
              <button z-button zType="outline" type="button" (click)="addItem()">
                Ajouter ligne
              </button>
            </div>

            @for (item of items.controls; track $index) {
              <div class="grid gap-3 rounded-md border border-border p-3 md:grid-cols-5" [formGroup]="$any(item)">
                <z-select formControlName="shopId" class="w-full">
                  <z-select-item zValue="">Boutique</z-select-item>
                  @for (shop of shops(); track shop._id) {
                    <z-select-item [zValue]="shop._id">{{ shop.name }}</z-select-item>
                  }
                </z-select>

                <z-select formControlName="productId" class="w-full">
                  <z-select-item zValue="">Produit</z-select-item>
                  @for (product of products(); track product._id) {
                    <z-select-item [zValue]="product._id">{{ product.title }}</z-select-item>
                  }
                </z-select>

                <input z-input type="number" min="1" formControlName="quantity" placeholder="Quantité" />
                <input z-input type="number" min="0" formControlName="unitPrice" placeholder="Prix unitaire" />

                <button z-button zType="destructive" type="button" (click)="removeItem($index)">
                  Retirer
                </button>
              </div>
            }
          </div>

          <div class="flex justify-end gap-2">
            <a z-button zType="outline" routerLink="/seller/stock-movements">Annuler</a>
            <button z-button type="submit" [disabled]="isSubmitting() || form.invalid || items.length === 0">
              {{ isSubmitting() ? 'Création...' : 'Créer mouvement' }}
            </button>
          </div>
        </form>
      </z-card>
    </div>
  `,
})
export class StockMovementFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly shopService = inject(ShopService);
  private readonly productService = inject(ProductService);
  private readonly stockMovementService = inject(StockMovementService);
  private readonly toast = inject(ToastService);

  readonly isSubmitting = signal(false);
  readonly shops = signal<Shop[]>([]);
  readonly products = signal<Product[]>([]);

  readonly paymentMethods: StockMovementPaymentMethod[] = [
    'WALLET',
    'CARD',
    'MOBILE_MONEY',
    'CASH_ON_DELIVERY',
  ];

  readonly form = this.fb.group({
    movementType: ['SUPPLY', [Validators.required]],
    date: ['', [Validators.required]],
    note: [''],
    supplierName: [''],
    supplierContact: [''],
    saleCartId: [''],
    paymentMethod: ['WALLET'],
    deliveryStreet: [''],
    deliveryCity: [''],
    deliveryPostalCode: [''],
    deliveryCountry: ['Madagascar'],
    items: this.fb.array([]),
  });

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  ngOnInit(): void {
    this.addItem();
    void this.loadShops();
    void this.loadProducts();
  }

  async loadShops(): Promise<void> {
    try {
      const response = await this.shopService.getMyShops(undefined, 1, 100);
      this.shops.set(response.shops);
    } catch {
      this.toast.error('Impossible de charger les boutiques');
    }
  }

  async loadProducts(): Promise<void> {
    try {
      const response = await this.productService.getMyProducts({ status: 'ACTIVE' }, 1, 100);
      this.products.set(response.products);
    } catch {
      this.toast.error('Impossible de charger les produits');
    }
  }

  addItem(): void {
    const group = this.fb.group({
      shopId: ['', [Validators.required]],
      productId: ['', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
    });

    this.items.push(group);
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.items.length === 0) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const value = this.form.getRawValue();

    const payload: Record<string, unknown> = {
      movementType: value.movementType,
      date: value.date,
      note: value.note || undefined,
      items: this.items.controls.map((group) => {
        const row = group.getRawValue();
        return {
          shopId: row.shopId,
          productId: row.productId,
          quantity: Number(row.quantity),
          unitPrice: Number(row.unitPrice),
        };
      }),
    };

    if (value.movementType === 'SUPPLY') {
      payload['supply'] = {
        supplier: {
          name: value.supplierName,
          contact: value.supplierContact || undefined,
        },
      };
    }

    if (value.movementType === 'SALE') {
      payload['sale'] = {
        cartId: value.saleCartId,
        paymentMethod: value.paymentMethod,
        deliveryAddress: {
          street: value.deliveryStreet,
          city: value.deliveryCity,
          postalCode: value.deliveryPostalCode || undefined,
          country: value.deliveryCountry || 'Madagascar',
        },
      };
    }

    try {
      await this.stockMovementService.createMovement(payload as never);
      this.toast.success('Mouvement créé avec succès');
      await this.router.navigate(['/seller/stock-movements']);
    } catch {
      this.toast.error('Erreur lors de la création du mouvement');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
