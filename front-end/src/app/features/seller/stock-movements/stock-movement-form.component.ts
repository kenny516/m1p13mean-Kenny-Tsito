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
  CreateStockMovementRequest,
  MovementType,
} from '@/core/models/stock-movement.model';
import {
  ADJUSTMENT_REASONS,
  MOVEMENT_TYPES,
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
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
          <section class="space-y-4 rounded-md border border-border p-4">
            <div>
              <h2 class="text-sm font-semibold text-foreground">Paramètres du mouvement</h2>
              <p class="text-xs text-muted-foreground">Type, date et contexte du mouvement.</p>
            </div>

            <div class="grid gap-4 md:grid-cols-3">
              <div>
                <p class="mb-1 text-sm text-muted-foreground">Type *</p>
                <z-select formControlName="movementType" class="w-full" (zSelectionChange)="onMovementTypeChange()">
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
          </section>

          <section class="space-y-3 rounded-md border border-border p-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-foreground">Lignes du mouvement</h3>
                <p class="text-xs text-muted-foreground">Sélectionnez les produits et quantités concernées.</p>
              </div>
              <button z-button zType="outline" type="button" (click)="addItem()">
                Ajouter ligne
              </button>
            </div>

            @for (item of items.controls; track $index) {
              <div class="grid gap-3 rounded-md border border-border p-3 md:grid-cols-5" [formGroup]="$any(item)">

                <z-select formControlName="productId" class="w-full" (zSelectionChange)="onProductChange($index)">
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
                <input
                  z-input
                  type="number"
                  min="0"
                  formControlName="unitPrice"
                  placeholder="Prix unitaire"
                  [readonly]="!isSupplyMovement()"
                />

                <button z-button zType="destructive" type="button" (click)="removeItem($index)">
                  Retirer
                </button>
              </div>
            }
          </section>

          <div class="flex justify-end gap-2 border-t border-border pt-4">
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

  readonly movementTypeOptions = MOVEMENT_TYPES.filter(
    (type): type is SellerCreatableMovementType => type !== 'SALE',
  );

  readonly adjustmentReasons = ADJUSTMENT_REASONS;
  readonly isSupplyMovement = signal(true);

  readonly form = this.fb.group({
    movementType: ['SUPPLY', [Validators.required]],
    date: ['', [Validators.required]],
    note: [''],
    cartId: [''],
    supplierName: [''],
    supplierContact: [''],
    adjustmentReason: [''],
    adjustmentNotes: [''],
    items: this.fb.array([]),
  });

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  ngOnInit(): void {
    this.addItem();
    this.onMovementTypeChange();
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
    this.syncItemPricingMode();
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

    if (!value.movementType || !value.date) {
      this.toast.error('Le type et la date du mouvement sont requis');
      this.isSubmitting.set(false);
      return;
    }

    if (value.movementType === 'SALE') {
      this.toast.error('La création de mouvement SALE est désactivée côté vendeur');
      this.isSubmitting.set(false);
      return;
    }

    const payload: CreateStockMovementRequest = {
      movementType: value.movementType as SellerCreatableMovementType,
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
          unitPrice:
            value.movementType === 'SUPPLY'
              ? Number(row.unitPrice)
              : this.getProductUnitPrice(row.productId),
        };
      }),
    };

    if (value.movementType === 'SUPPLY') {
      payload.supply = {
        supplier: {
          name: value.supplierName || '',
          contact: value.supplierContact || undefined,
        },
      };
    }

    if (value.movementType === 'ADJUSTMENT_PLUS' || value.movementType === 'ADJUSTMENT_MINUS') {
      payload.adjustment = {
        reason: value.adjustmentReason as (typeof ADJUSTMENT_REASONS)[number],
        notes: value.adjustmentNotes || undefined,
      };
    }

    if (value.movementType === 'RESERVATION' || value.movementType === 'RESERVATION_CANCEL') {
      payload.cartId = value.cartId || undefined;
    }

    try {
      await this.stockMovementService.createMovement(payload);
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

  onMovementTypeChange(): void {
    const movementType = this.form.get('movementType')?.value;
    this.isSupplyMovement.set(movementType === 'SUPPLY');
    this.syncItemPricingMode();
  }

  onProductChange(index: number): void {
    if (this.isSupplyMovement()) {
      return;
    }

    const group = this.items.at(index);
    if (!group) {
      return;
    }

    const productId = group.get('productId')?.value;
    const unitPriceControl = group.get('unitPrice');
    if (!unitPriceControl) {
      return;
    }

    unitPriceControl.setValue(this.getProductUnitPrice(productId), { emitEvent: false });
  }

  private syncItemPricingMode(): void {
    const isSupply = this.isSupplyMovement();

    for (let index = 0; index < this.items.length; index++) {
      const group = this.items.at(index);
      const unitPriceControl = group.get('unitPrice');
      if (!unitPriceControl) continue;

      if (isSupply) {
        unitPriceControl.enable({ emitEvent: false });
        continue;
      }

      const productId = group.get('productId')?.value;
      unitPriceControl.setValue(this.getProductUnitPrice(productId), { emitEvent: false });
      unitPriceControl.disable({ emitEvent: false });
    }
  }

  private getProductUnitPrice(productId: string): number {
    if (!productId) return 0;

    const product = this.products().find((entry) => entry._id === productId);
    return product ? Number(product.price) : 0;
  }

  private getConditionalValidationError(): string | null {
    const values = this.form.getRawValue();
    const movementType = values.movementType;

    if (movementType === 'SUPPLY' && !values.supplierName) {
      return 'Le nom du fournisseur est requis pour un mouvement SUPPLY';
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

type SellerCreatableMovementType = Exclude<MovementType, 'SALE'>;
