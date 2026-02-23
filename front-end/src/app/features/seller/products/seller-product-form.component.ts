import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Product, ProductService, Shop, ShopService, ToastService } from '@/core';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardSelectImports } from '@/shared/components/select';

@Component({
  selector: 'app-seller-product-form',
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
          <h1 class="text-2xl font-bold text-foreground">
            {{ isEditMode() ? 'Modifier le produit' : 'Créer un produit' }}
          </h1>
          <p class="text-muted-foreground">Le produit est créé en statut brouillon.</p>
        </div>
        <a z-button zType="outline" routerLink="/seller/products">Retour</a>
      </div>

      <z-card class="p-6">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <p class="mb-1 text-sm text-muted-foreground">Boutique *</p>
              <z-select formControlName="shopId" zPlaceholder="Choisir une boutique" class="w-full">
                @for (shop of shops(); track shop._id) {
                  <z-select-item [zValue]="shop._id">{{ shop.name }}</z-select-item>
                }
              </z-select>
            </div>
            <div>
              <p class="mb-1 text-sm text-muted-foreground">Catégorie *</p>
              <input z-input formControlName="category" placeholder="Catégorie produit" />
            </div>
          </div>

          <div>
            <p class="mb-1 text-sm text-muted-foreground">Titre *</p>
            <input z-input formControlName="title" placeholder="Titre du produit" />
          </div>

          <div>
            <p class="mb-1 text-sm text-muted-foreground">Description *</p>
            <textarea
              rows="4"
              formControlName="description"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Description du produit"
            ></textarea>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <p class="mb-1 text-sm text-muted-foreground">Prix *</p>
              <input z-input type="number" formControlName="price" min="0" />
            </div>
            <div>
              <p class="mb-1 text-sm text-muted-foreground">Prix original</p>
              <input z-input type="number" formControlName="originalPrice" min="0" />
            </div>
          </div>

          <div>
            <p class="mb-1 text-sm text-muted-foreground">Tags (virgules)</p>
            <input z-input formControlName="tags" placeholder="promotion, nouveauté" />
          </div>

          <div>
            <p class="mb-1 text-sm text-muted-foreground">Images (URLs séparées par virgule)</p>
            <input z-input formControlName="images" placeholder="https://..." />
          </div>

          <div class="flex justify-end gap-2">
            <a z-button zType="outline" routerLink="/seller/products">Annuler</a>
            <button z-button type="submit" [disabled]="isSubmitting() || form.invalid">
              {{ isSubmitting() ? 'Enregistrement...' : isEditMode() ? 'Mettre à jour' : 'Créer' }}
            </button>
          </div>
        </form>
      </z-card>
    </div>
  `,
})
export class SellerProductFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly shopService = inject(ShopService);
  private readonly toast = inject(ToastService);

  readonly shops = signal<Shop[]>([]);
  readonly isEditMode = signal(false);
  readonly isSubmitting = signal(false);

  private productId: string | null = null;

  readonly form = this.fb.group({
    shopId: ['', [Validators.required]],
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    category: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    originalPrice: [0],
    tags: [''],
    images: [''],
  });

  ngOnInit(): void {
    void this.loadShops();

    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode.set(true);
      void this.loadProduct(this.productId);
    }
  }

  async loadShops(): Promise<void> {
    try {
      const response = await this.shopService.getMyShops(undefined, 1, 100);
      this.shops.set(response.shops);
    } catch {
      this.toast.error('Impossible de charger vos boutiques');
    }
  }

  async loadProduct(id: string): Promise<void> {
    try {
      const product = await this.productService.getProduct(id);
      this.patchForm(product);
    } catch {
      this.toast.error('Impossible de charger ce produit');
      await this.router.navigate(['/seller/products']);
    }
  }

  patchForm(product: Product): void {
    const shopId = typeof product.shopId === 'string' ? product.shopId : product.shopId._id;

    this.form.patchValue({
      shopId,
      title: product.title,
      description: product.description,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice || 0,
      tags: (product.tags || []).join(', '),
      images: (product.images || []).join(', '),
    });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Veuillez compléter tous les champs obligatoires avant de créer le produit');
      return;
    }

    this.isSubmitting.set(true);
    const value = this.form.getRawValue();

    const payload = {
      shopId: value.shopId || '',
      title: value.title || '',
      description: value.description || '',
      category: value.category || '',
      price: Number(value.price || 0),
      originalPrice: value.originalPrice ? Number(value.originalPrice) : undefined,
      tags: (value.tags || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      images: (value.images || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    };

    try {
      if (this.isEditMode() && this.productId) {
        await this.productService.updateProduct(this.productId, payload);
        this.toast.success('Produit mis à jour');
      } else {
        await this.productService.createProduct(payload);
        this.toast.success('Produit créé');
      }

      await this.router.navigate(['/seller/products']);
    } catch {
      this.toast.error('Erreur lors de l\'enregistrement du produit');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
