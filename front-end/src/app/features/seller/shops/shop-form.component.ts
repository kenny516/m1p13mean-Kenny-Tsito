import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ShopService, ToastService } from '@/core';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardInputDirective } from '@/shared/components/input';

@Component({
  selector: 'app-shop-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ZardCardComponent,
    ZardButtonComponent,
    ZardInputDirective,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">
            {{ isEditMode() ? 'Modifier la boutique' : 'Créer une boutique' }}
          </h1>
          <p class="text-muted-foreground">
            Les boutiques créées sont en brouillon avant soumission admin.
          </p>
        </div>
        <a z-button zType="outline" routerLink="/seller/shops">Retour</a>
      </div>

      <z-card class="p-6">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <p class="mb-1 text-sm text-muted-foreground">Nom *</p>
              <input z-input formControlName="name" placeholder="Nom de la boutique" />
            </div>
            <div>
              <p class="mb-1 text-sm text-muted-foreground">Email de contact</p>
              <input z-input type="email" formControlName="contactEmail" placeholder="contact@mail.com" />
            </div>
          </div>

          <div>
            <p class="mb-1 text-sm text-muted-foreground">Description</p>
            <textarea
              formControlName="description"
              rows="4"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Description de la boutique"
            ></textarea>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <p class="mb-1 text-sm text-muted-foreground">Téléphone</p>
              <input z-input formControlName="contactPhone" placeholder="+261XXXXXXXXX" />
            </div>
            <div>
              <p class="mb-1 text-sm text-muted-foreground">Adresse</p>
              <input z-input formControlName="contactAddress" placeholder="Adresse de contact" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <p class="mb-1 text-sm text-muted-foreground">Logo URL</p>
              <input z-input formControlName="logo" placeholder="https://..." />
            </div>
            <div>
              <p class="mb-1 text-sm text-muted-foreground">Banner URL</p>
              <input z-input formControlName="banner" placeholder="https://..." />
            </div>
          </div>

          <div>
            <p class="mb-1 text-sm text-muted-foreground">Catégories (séparées par virgule)</p>
            <input z-input formControlName="categories" placeholder="Informatique, Maison, Beauté" />
          </div>

          <div class="flex justify-end gap-2">
            <a z-button zType="outline" routerLink="/seller/shops">Annuler</a>
            <button z-button type="submit" [disabled]="isSubmitting() || form.invalid">
              {{ isSubmitting() ? 'Enregistrement...' : isEditMode() ? 'Mettre à jour' : 'Créer' }}
            </button>
          </div>
        </form>
      </z-card>
    </div>
  `,
})
export class ShopFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly shopService = inject(ShopService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isEditMode = signal(false);
  readonly isSubmitting = signal(false);
  private shopId: string | null = null;

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    logo: [''],
    banner: [''],
    contactEmail: [''],
    contactPhone: [''],
    contactAddress: [''],
    categories: [''],
  });

  ngOnInit(): void {
    this.shopId = this.route.snapshot.paramMap.get('id');
    if (this.shopId) {
      this.isEditMode.set(true);
      void this.loadShop(this.shopId);
    }
  }

  async loadShop(id: string): Promise<void> {
    try {
      const shop = await this.shopService.getShop(id);
      this.form.patchValue({
        name: shop.name,
        description: shop.description || '',
        logo: shop.logo || '',
        banner: shop.banner || '',
        contactEmail: shop.contact?.email || '',
        contactPhone: shop.contact?.phone || '',
        contactAddress: shop.contact?.address || '',
        categories: (shop.categories || []).join(', '),
      });
    } catch {
      this.toast.error('Impossible de charger cette boutique');
      await this.router.navigate(['/seller/shops']);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const value = this.form.getRawValue();

    const payload = {
      name: value.name || '',
      description: value.description || undefined,
      logo: value.logo || undefined,
      banner: value.banner || undefined,
      contact: {
        email: value.contactEmail || undefined,
        phone: value.contactPhone || undefined,
        address: value.contactAddress || undefined,
      },
      categories: (value.categories || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    };

    try {
      if (this.isEditMode() && this.shopId) {
        await this.shopService.updateShop(this.shopId, payload);
        this.toast.success('Boutique mise à jour');
      } else {
        await this.shopService.createShop(payload);
        this.toast.success('Boutique créée en brouillon');
      }
      await this.router.navigate(['/seller/shops']);
    } catch {
      this.toast.error('Erreur lors de l\'enregistrement');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
