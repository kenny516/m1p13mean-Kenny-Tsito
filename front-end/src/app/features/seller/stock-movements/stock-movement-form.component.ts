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
  StockMovementService,
  ToastService,
} from '@/core';
import {
  MovementType,
  StockMovementPaymentMethod,
} from '@/core/models/stock-movement.model';
import {
  ADJUSTMENT_REASONS,
  MOVEMENT_TYPES,
  PAYMENT_METHODS,
} from '@/core/models/stock-movement.constants';
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
                @for (type of movementTypeOptions; track type) {
                  <z-select-item [zValue]="type">{{ type }}</z-select-item>
                }
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

          @if (form.value.movementType === 'ADJUSTMENT_PLUS' || form.value.movementType === 'ADJUSTMENT_MINUS') {
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <p class="mb-1 text-sm text-muted-foreground">Raison d'ajustement *</p>
                <z-select formControlName="adjustmentReason" class="w-full">
                  @for (reason of adjustmentReasons; track reason) {
                    <z-select-item [zValue]="reason">{{ reason }}</z-select-item>
                  }
                </z-select>
              </div>
              <div>
                <p class="mb-1 text-sm text-muted-foreground">Notes d'ajustement</p>
                <input z-input formControlName="adjustmentNotes" placeholder="Note optionnelle" />
              </div>
            </div>
          }

          @if (form.value.movementType === 'RESERVATION' || form.value.movementType === 'RESERVATION_CANCEL') {
            <div>
              <p class="mb-1 text-sm text-muted-foreground">Cart ID *</p>
              <input z-input formControlName="cartId" placeholder="ObjectId du panier" />
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

                <z-select formControlName="productId" class="w-full">
                  <z-select-item zValue="">Produit</z-select-item>
                  @for (product of products(); track product._id) {
                    <z-select-item [zValue]="product._id">{{ product.title }}</z-select-item>
                  }
                </z-select>

                <input
                  z-input
                  [value]="getShopNameByProductId(item.get('productId')?.value || '')"
                  placeholder="Boutique auto"
                  readonly
                />

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
  private readonly productService = inject(ProductService);
  private readonly stockMovementService = inject(StockMovementService);
  private readonly toast = inject(ToastService);

  readonly isSubmitting = signal(false);
  readonly products = signal<Product[]>([]);

  readonly paymentMethods: readonly StockMovementPaymentMethod[] = PAYMENT_METHODS;

  readonly movementTypeOptions: readonly MovementType[] = MOVEMENT_TYPES;

  readonly adjustmentReasons = ADJUSTMENT_REASONS;

  readonly form = this.fb.group({
    movementType: ['SUPPLY', [Validators.required]],
    date: ['', [Validators.required]],
    note: [''],
    cartId: [''],
    supplierName: [''],
    supplierContact: [''],
    adjustmentReason: [''],
    adjustmentNotes: [''],
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
    void this.loadProducts();
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
    const conditionalError = this.getConditionalValidationError();
    if (conditionalError) {
      this.toast.error(conditionalError);
      this.isSubmitting.set(false);
      return;
    }

    const payload: Record<string, unknown> = {
      movementType: value.movementType,
      date: value.date,
      note: value.note || undefined,
      items: this.items.controls.map((group, index) => {
        const row = group.getRawValue() as {
          productId: string;
          quantity: number;
          unitPrice: number;
        };

        const shopId = this.resolveShopIdFromProductId(row.productId);
        if (!shopId) {
          throw new Error(`Ligne ${index + 1}: boutique introuvable pour le produit sélectionné`);
        }

        return {
          shopId,
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

    if (value.movementType === 'ADJUSTMENT_PLUS' || value.movementType === 'ADJUSTMENT_MINUS') {
      payload['adjustment'] = {
        reason: value.adjustmentReason,
        notes: value.adjustmentNotes || undefined,
      };
    }

    if (value.movementType === 'RESERVATION' || value.movementType === 'RESERVATION_CANCEL') {
      payload['cartId'] = value.cartId;
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la création du mouvement';
      this.toast.error(message);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  getShopNameByProductId(productId: string): string {
    if (!productId) return '';

    const product = this.products().find((entry) => entry._id === productId);
    if (!product) return '';

    const shop = product.shopId;
    if (typeof shop === 'string') return shop;
    return shop.name || '';
  }

  private resolveShopIdFromProductId(productId: string): string | null {
    const product = this.products().find((entry) => entry._id === productId);
    if (!product) return null;

    const shop = product.shopId;
    return typeof shop === 'string' ? shop : shop._id;
  }

  private getConditionalValidationError(): string | null {
    const values = this.form.getRawValue();
    const movementType = values.movementType;

    if (movementType === 'SUPPLY' && !values.supplierName) {
      return 'Le nom du fournisseur est requis pour un mouvement SUPPLY';
    }

    if (movementType === 'SALE') {
      if (!values.saleCartId) return 'Le Cart ID est requis pour un mouvement SALE';
      if (!values.deliveryStreet || !values.deliveryCity) {
        return 'L\'adresse de livraison (rue et ville) est requise pour un mouvement SALE';
      }
    }

    if (
      (movementType === 'ADJUSTMENT_PLUS' || movementType === 'ADJUSTMENT_MINUS') &&
      !values.adjustmentReason
    ) {
      return 'La raison d\'ajustement est requise pour ce type de mouvement';
    }

    if (
      (movementType === 'RESERVATION' || movementType === 'RESERVATION_CANCEL') &&
      !values.cartId
    ) {
      return 'Le Cart ID est requis pour ce type de réservation';
    }

    return null;
  }
}
