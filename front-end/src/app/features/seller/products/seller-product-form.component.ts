import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ImageManagementService,
  Product,
  ProductService,
  Shop,
  ShopService,
  ToastService,
} from '@/core';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardSelectImports } from '@/shared/components/select';
import { IKImageDirective } from '@imagekit/angular';
import { FilePickerComponent } from '@/shared/components/file-picker/file-picker.component';

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
    IKImageDirective,
    FilePickerComponent,
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

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-sm text-muted-foreground">Galerie produit</p>
              <app-file-picker
                label="Ajouter des images"
                [multiple]="true"
                [disabled]="isSubmitting()"
                (filesSelected)="onProductImagesSelected($event)"
              />
            </div>

            @if (existingImages().length > 0) {
              <p class="text-xs text-muted-foreground">Images existantes (hors formulaire)</p>
              <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
                @for (image of existingImages(); track image; let index = $index) {
                  <div class="group relative space-y-2 rounded-md border border-border p-2">
                    <img
                      [ikSrc]="image"
                      [transformation]="[{ width: 300, height: 300 }]"
                      [responsive]="false"
                      loading="lazy"
                      class="h-24 w-full rounded object-cover"
                      alt="Image produit"
                    />
                    <button
                      z-button
                      zType="destructive"
                      zSize="sm"
                      type="button"
                      class="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100"
                      [disabled]="isSubmitting()"
                      (click)="removeExistingImage(index)"
                    >
                      Supprimer
                    </button>
                  </div>
                }
              </div>
            }

            @if (pendingImagePreviewUrls().length > 0) {
              <p class="text-xs text-muted-foreground">Nouvelles images (seront ajoutées à l'enregistrement)</p>
              <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
                @for (image of pendingImagePreviewUrls(); track image; let index = $index) {
                  <div class="relative space-y-2 rounded-md border border-border p-2">
                    <img
                      [ikSrc]="image"
                      [transformation]="[{ width: 300, height: 300 }]"
                      [responsive]="false"
                      loading="lazy"
                      class="h-24 w-full rounded object-cover"
                      alt="Nouvelle image produit"
                    />
                    <button
                      z-button
                      zType="destructive"
                      zSize="sm"
                      type="button"
                      class="absolute right-3 top-3"
                      [disabled]="isSubmitting()"
                      (click)="removePendingImage(index)"
                    >
                      Retirer
                    </button>
                  </div>
                }
              </div>
            }

            @if (existingImages().length === 0 && pendingImagePreviewUrls().length === 0) {
              <p class="text-xs text-muted-foreground">Aucune image pour le moment.</p>
            }
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
  private readonly imageManagementService = inject(ImageManagementService);
  private readonly toast = inject(ToastService);

  readonly shops = signal<Shop[]>([]);
  readonly isEditMode = signal(false);
  readonly isSubmitting = signal(false);
  readonly existingImages = signal<string[]>([]);

  private readonly pendingImageFiles = signal<File[]>([]);
  readonly pendingImagePreviewUrls = signal<string[]>([]);

  private productId: string | null = null;

  readonly form = this.fb.group({
    shopId: ['', [Validators.required]],
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    category: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    originalPrice: [0],
    tags: [''],
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
    });

    this.existingImages.set(product.images || []);
  }

  onProductImagesSelected(files: File[]): void {
    if (!files.length) {
      return;
    }

    const previewUrls = files.map((file) => URL.createObjectURL(file));
    this.pendingImageFiles.update((currentFiles) => [...currentFiles, ...files]);
    this.pendingImagePreviewUrls.update((currentUrls) => [...currentUrls, ...previewUrls]);
  }

  removePendingImage(index: number): void {
    const previews = this.pendingImagePreviewUrls();
    const previewUrl = previews[index];
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    this.pendingImageFiles.update((files) => files.filter((_, current) => current !== index));
    this.pendingImagePreviewUrls.update((urls) => urls.filter((_, current) => current !== index));
  }

  async removeExistingImage(index: number): Promise<void> {
    if (!this.isEditMode() || !this.productId) {
      return;
    }

    try {
      const product = await this.imageManagementService.deleteProductImage(this.productId, index);
      this.existingImages.set(product.images || []);
      this.toast.success('Image supprimée');
    } catch {
      this.toast.error('Impossible de supprimer cette image');
    }
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
    };

    try {
      if (this.isEditMode() && this.productId) {
        await this.productService.updateProductWithImages(
          this.productId,
          payload,
          this.pendingImageFiles(),
        );
        this.toast.success('Produit mis à jour');
      } else {
        await this.productService.createProductWithImages(payload, this.pendingImageFiles());
        this.toast.success('Produit créé');
      }

      await this.router.navigate(['/seller/products']);
    } catch {
      this.toast.error('Erreur lors de l\'enregistrement du produit');
    } finally {
      this.isSubmitting.set(false);

      this.pendingImagePreviewUrls().forEach((url) => URL.revokeObjectURL(url));
      this.pendingImagePreviewUrls.set([]);
      this.pendingImageFiles.set([]);
    }
  }
}
