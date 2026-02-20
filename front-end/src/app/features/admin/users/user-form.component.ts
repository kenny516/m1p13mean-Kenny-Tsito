import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserService, ToastService, User } from '../../../core';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardLabelComponent } from '@/shared/components/label';
import { ZardSelectImports } from '@/shared/components/select';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { ZardSpinnerComponent } from '@/shared/components/spinner';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ZardCardComponent,
    ZardButtonComponent,
    ZardInputDirective,
    ZardLabelComponent,
    ...ZardSelectImports,
    ZardIconComponent,
    ZardSkeletonComponent,
    ZardSpinnerComponent,
  ],
  template: `
    <div class="min-h-screen bg-muted/30 py-8">
      <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Back Button -->
        <div class="mb-6">
          <a z-button zType="ghost" routerLink="/admin/users">
            <z-icon zType="arrow-left" class="mr-2" />
            Retour à la liste
          </a>
        </div>

        <!-- Form Card -->
        <z-card>
          <div class="px-6 py-4 border-b border-border">
            <h1 class="text-xl font-semibold text-foreground">
              {{
                isEditMode() ? "Modifier l'utilisateur" : 'Nouvel utilisateur'
              }}
            </h1>
            <p class="mt-1 text-sm text-muted-foreground">
              {{
                isEditMode()
                  ? "Modifiez les informations de l'utilisateur ci-dessous."
                  : 'Remplissez les informations pour créer un nouvel utilisateur.'
              }}
            </p>
          </div>

          @if (isLoading()) {
            <div class="p-8 space-y-4">
              <z-skeleton class="h-10 w-full" />
              <z-skeleton class="h-10 w-full" />
              <z-skeleton class="h-10 w-full" />
            </div>
          } @else {
            <form
              [formGroup]="form"
              (ngSubmit)="onSubmit()"
              class="p-6 space-y-6"
            >
              <!-- Email -->
              <div>
                <z-label for="email">
                  Email <span class="text-destructive">*</span>
                </z-label>
                <input
                  z-input
                  type="email"
                  id="email"
                  formControlName="email"
                  class="mt-1"
                  [class.border-destructive]="
                    form.get('email')?.invalid && form.get('email')?.touched
                  "
                  placeholder="utilisateur@exemple.com"
                />
                @if (form.get('email')?.invalid && form.get('email')?.touched) {
                  <p class="mt-1 text-sm text-destructive">
                    @if (form.get('email')?.errors?.['required']) {
                      L'email est requis
                    } @else if (form.get('email')?.errors?.['email']) {
                      Format d'email invalide
                    }
                  </p>
                }
              </div>

              <!-- Password (only for create mode) -->
              @if (!isEditMode()) {
                <div>
                  <z-label for="password">
                    Mot de passe <span class="text-destructive">*</span>
                  </z-label>
                  <input
                    z-input
                    type="password"
                    id="password"
                    formControlName="password"
                    class="mt-1"
                    [class.border-destructive]="
                      form.get('password')?.invalid &&
                      form.get('password')?.touched
                    "
                    placeholder="Minimum 8 caractères"
                  />
                  @if (
                    form.get('password')?.invalid &&
                    form.get('password')?.touched
                  ) {
                    <p class="mt-1 text-sm text-destructive">
                      @if (form.get('password')?.errors?.['required']) {
                        Le mot de passe est requis
                      } @else if (form.get('password')?.errors?.['minlength']) {
                        Le mot de passe doit contenir au moins 8 caractères
                      }
                    </p>
                  }
                </div>
              }

              <!-- Role -->
              <div>
                <z-label>
                  Rôle <span class="text-destructive">*</span>
                </z-label>
                <z-select
                  [zValue]="form.get('role')?.value"
                  (zSelectionChange)="form.get('role')?.setValue($event)"
                  zPlaceholder="Sélectionnez un rôle"
                  class="mt-1 w-full"
                >
                  <z-select-item zValue="BUYER">Acheteur</z-select-item>
                  <z-select-item zValue="SELLER">Vendeur</z-select-item>
                  <z-select-item zValue="ADMIN">Administrateur</z-select-item>
                </z-select>
              </div>

              <!-- Profile Section -->
              <div class="border-t border-border pt-6">
                <h3 class="text-lg font-medium text-foreground mb-4">
                  Informations personnelles
                </h3>

                <div formGroupName="profile" class="space-y-4">
                  <!-- First Name & Last Name -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <z-label for="firstName">Prénom</z-label>
                      <input
                        z-input
                        type="text"
                        id="firstName"
                        formControlName="firstName"
                        class="mt-1"
                        placeholder="Jean"
                      />
                    </div>
                    <div>
                      <z-label for="lastName">Nom</z-label>
                      <input
                        z-input
                        type="text"
                        id="lastName"
                        formControlName="lastName"
                        class="mt-1"
                        placeholder="Dupont"
                      />
                    </div>
                  </div>

                  <!-- Phone -->
                  <div>
                    <z-label for="phone">Téléphone</z-label>
                    <input
                      z-input
                      type="tel"
                      id="phone"
                      formControlName="phone"
                      class="mt-1"
                      placeholder="+261 34 00 000 00"
                    />
                  </div>
                </div>
              </div>

              <!-- Address Section -->
              <div class="border-t border-border pt-6">
                <h3 class="text-lg font-medium text-foreground mb-4">
                  Adresse
                </h3>

                <div formGroupName="profile" class="space-y-4">
                  <div formGroupName="address" class="space-y-4">
                    <!-- Street -->
                    <div>
                      <z-label for="street">Rue</z-label>
                      <input
                        z-input
                        type="text"
                        id="street"
                        formControlName="street"
                        class="mt-1"
                        placeholder="123 Rue Example"
                      />
                    </div>

                    <!-- City & Postal Code -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <z-label for="city">Ville</z-label>
                        <input
                          z-input
                          type="text"
                          id="city"
                          formControlName="city"
                          class="mt-1"
                          placeholder="Antananarivo"
                        />
                      </div>
                      <div>
                        <z-label for="postalCode">Code postal</z-label>
                        <input
                          z-input
                          type="text"
                          id="postalCode"
                          formControlName="postalCode"
                          class="mt-1"
                          placeholder="101"
                        />
                      </div>
                    </div>

                    <!-- Country -->
                    <div>
                      <z-label for="country">Pays</z-label>
                      <input
                        z-input
                        type="text"
                        id="country"
                        formControlName="country"
                        class="mt-1"
                        placeholder="Madagascar"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Account Status (only for edit mode) -->
              @if (isEditMode()) {
                <div class="border-t border-border pt-6">
                  <h3 class="text-lg font-medium text-foreground mb-4">
                    Statut du compte
                  </h3>

                  <div class="space-y-4">
                    <div class="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        formControlName="isActive"
                        class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <z-label for="isActive" class="cursor-pointer">
                        Compte actif
                      </z-label>
                    </div>

                    <div class="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isValidated"
                        formControlName="isValidated"
                        class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <z-label for="isValidated" class="cursor-pointer">
                        Compte validé
                      </z-label>
                    </div>
                  </div>
                </div>
              }

              <!-- Submit Buttons -->
              <div
                class="border-t border-border pt-6 flex justify-end space-x-4"
              >
                <a z-button zType="outline" routerLink="/admin/users">
                  Annuler
                </a>
                <button
                  z-button
                  type="submit"
                  [disabled]="form.invalid || isSubmitting()"
                >
                  @if (isSubmitting()) {
                    <z-spinner class="mr-2 h-4 w-4" />
                    Enregistrement...
                  } @else {
                    {{ isEditMode() ? 'Modifier' : 'Créer' }}
                  }
                </button>
              </div>
            </form>
          }
        </z-card>
      </div>
    </div>
  `,
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  isEditMode = signal(false);
  isLoading = signal(false);
  isSubmitting = signal(false);
  userId = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['BUYER', Validators.required],
    isActive: [true],
    isValidated: [false],
    profile: this.fb.group({
      firstName: [''],
      lastName: [''],
      phone: [''],
      address: this.fb.group({
        street: [''],
        city: [''],
        postalCode: [''],
        country: ['Madagascar'],
      }),
    }),
  });

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isEditMode.set(true);
      this.userId.set(id);
      // En mode édition, le mot de passe n'est pas requis
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
      await this.loadUser(id);
    }
  }

  async loadUser(userId: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const user = await this.userService.getUserById(userId);
      this.patchForm(user);
    } catch {
      this.toastService.error("Erreur lors du chargement de l'utilisateur");
      this.router.navigate(['/admin/users']);
    } finally {
      this.isLoading.set(false);
    }
  }

  patchForm(user: User): void {
    this.form.patchValue({
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isValidated: user.isValidated,
      profile: {
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        phone: user.profile?.phone || '',
        address: {
          street: user.profile?.address?.street || '',
          city: user.profile?.address?.city || '',
          postalCode: user.profile?.address?.postalCode || '',
          country: user.profile?.address?.country || 'Madagascar',
        },
      },
    });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    try {
      const formValue = this.form.value;

      // Nettoyer les données du formulaire
      const userData = {
        email: formValue.email,
        role: formValue.role,
        profile: {
          firstName: formValue.profile.firstName || undefined,
          lastName: formValue.profile.lastName || undefined,
          phone: formValue.profile.phone || undefined,
          address:
            formValue.profile.address.street || formValue.profile.address.city
              ? formValue.profile.address
              : undefined,
        },
      };

      if (this.isEditMode()) {
        // Mode mise à jour
        const updateData = {
          ...userData,
          isActive: formValue.isActive,
          isValidated: formValue.isValidated,
        };
        await this.userService.updateUser(this.userId()!, updateData);
        this.toastService.success('Utilisateur mis à jour avec succès');
      } else {
        // Mode création
        const createData = {
          ...userData,
          password: formValue.password,
        };
        await this.userService.createUser(createData);
        this.toastService.success('Utilisateur créé avec succès');
      }

      this.router.navigate(['/admin/users']);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Une erreur s'est produite";
      this.toastService.error(errorMessage);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
