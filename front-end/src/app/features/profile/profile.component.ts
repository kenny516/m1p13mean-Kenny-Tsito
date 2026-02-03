import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { AuthService, ToastService, User } from '../../core';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900">Mon Profil</h1>
          <p class="mt-1 text-sm text-gray-600">
            Gérez vos informations personnelles
          </p>
        </div>

        @if (user(); as userData) {
          <div class="space-y-6">
            <!-- Informations du compte -->
            <div class="card">
              <div class="card-header">
                <h2 class="card-title text-lg">Informations du compte</h2>
              </div>
              <div class="card-content">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <span class="text-sm text-gray-500">Email</span>
                    <p class="font-medium">{{ userData.email }}</p>
                  </div>
                  <div>
                    <span class="text-sm text-gray-500">Rôle</span>
                    <span
                      class="ml-2 px-2 py-1 text-xs font-medium rounded-full"
                      [ngClass]="{
                        'bg-blue-100 text-blue-800': userData.role === 'BUYER',
                        'bg-green-100 text-green-800':
                          userData.role === 'SELLER',
                        'bg-purple-100 text-purple-800':
                          userData.role === 'ADMIN',
                      }"
                    >
                      {{ getRoleLabel(userData.role) }}
                    </span>
                  </div>
                  <div>
                    <span class="text-sm text-gray-500">Membre depuis</span>
                    <p class="font-medium">
                      {{ userData.createdAt | date: 'longDate' }}
                    </p>
                  </div>
                  <div>
                    <span class="text-sm text-gray-500">Statut</span>
                    <span
                      class="ml-2 px-2 py-1 text-xs font-medium rounded-full"
                      [ngClass]="{
                        'bg-green-100 text-green-800': userData.isValidated,
                        'bg-yellow-100 text-yellow-800': !userData.isValidated,
                      }"
                    >
                      {{ userData.isValidated ? 'Validé' : 'En attente' }}
                    </span>
                  </div>
                </div>

                @if (userData.wallet) {
                  <div class="mt-4 pt-4 border-t">
                    <span class="text-sm text-gray-500"
                      >Solde du portefeuille</span
                    >
                    <p class="text-2xl font-bold text-green-600">
                      {{ userData.wallet.balance | number: '1.0-0' }}
                      {{ userData.wallet.currency }}
                    </p>
                  </div>
                }
              </div>
            </div>

            <!-- Formulaire de modification du profil -->
            <div class="card">
              <div class="card-header">
                <h2 class="card-title text-lg">Modifier le profil</h2>
              </div>
              <div class="card-content">
                <form
                  [formGroup]="profileForm"
                  (ngSubmit)="updateProfile()"
                  class="space-y-4"
                >
                  <div formGroupName="profile">
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label for="firstName" class="label">Prénom</label>
                        <input
                          id="firstName"
                          type="text"
                          formControlName="firstName"
                          class="input mt-1"
                          [class.border-red-500]="
                            isProfileFieldInvalid('profile.firstName')
                          "
                        />
                      </div>
                      <div>
                        <label for="lastName" class="label">Nom</label>
                        <input
                          id="lastName"
                          type="text"
                          formControlName="lastName"
                          class="input mt-1"
                          [class.border-red-500]="
                            isProfileFieldInvalid('profile.lastName')
                          "
                        />
                      </div>
                    </div>

                    <div class="mt-4">
                      <label for="phone" class="label">Téléphone</label>
                      <input
                        id="phone"
                        type="tel"
                        formControlName="phone"
                        class="input mt-1"
                        placeholder="+261 34 00 000 00"
                      />
                    </div>

                    <div class="mt-4" formGroupName="address">
                      <label class="label">Adresse</label>
                      <div class="mt-2 space-y-2">
                        <input
                          type="text"
                          formControlName="street"
                          class="input"
                          placeholder="Rue"
                        />
                        <div class="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            formControlName="city"
                            class="input"
                            placeholder="Ville"
                          />
                          <input
                            type="text"
                            formControlName="postalCode"
                            class="input"
                            placeholder="Code postal"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="flex justify-end pt-4">
                    <button
                      type="submit"
                      [disabled]="profileForm.invalid || isLoading()"
                      class="btn-primary"
                    >
                      @if (isLoading()) {
                        Enregistrement...
                      } @else {
                        Enregistrer les modifications
                      }
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <!-- Formulaire de changement de mot de passe -->
            <div class="card">
              <div class="card-header">
                <h2 class="card-title text-lg">Changer le mot de passe</h2>
              </div>
              <div class="card-content">
                <form
                  [formGroup]="passwordForm"
                  (ngSubmit)="changePassword()"
                  class="space-y-4"
                >
                  <div>
                    <label for="currentPassword" class="label"
                      >Mot de passe actuel</label
                    >
                    <input
                      id="currentPassword"
                      type="password"
                      formControlName="currentPassword"
                      class="input mt-1"
                      [class.border-red-500]="
                        isPasswordFieldInvalid('currentPassword')
                      "
                    />
                  </div>

                  <div>
                    <label for="newPassword" class="label"
                      >Nouveau mot de passe</label
                    >
                    <input
                      id="newPassword"
                      type="password"
                      formControlName="newPassword"
                      class="input mt-1"
                      [class.border-red-500]="
                        isPasswordFieldInvalid('newPassword')
                      "
                    />
                    @if (isPasswordFieldInvalid('newPassword')) {
                      <p class="mt-1 text-sm text-red-500">
                        Minimum 8 caractères avec majuscule, minuscule et
                        chiffre
                      </p>
                    }
                  </div>

                  <div>
                    <label for="confirmNewPassword" class="label"
                      >Confirmer le nouveau mot de passe</label
                    >
                    <input
                      id="confirmNewPassword"
                      type="password"
                      formControlName="confirmPassword"
                      class="input mt-1"
                      [class.border-red-500]="
                        isPasswordFieldInvalid('confirmPassword')
                      "
                    />
                    @if (isPasswordFieldInvalid('confirmPassword')) {
                      <p class="mt-1 text-sm text-red-500">
                        Les mots de passe ne correspondent pas
                      </p>
                    }
                  </div>

                  <div class="flex justify-end pt-4">
                    <button
                      type="submit"
                      [disabled]="passwordForm.invalid || isLoading()"
                      class="btn-primary"
                    >
                      Changer le mot de passe
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <!-- Actions -->
            <div class="card">
              <div class="card-header">
                <h2 class="card-title text-lg">Actions</h2>
              </div>
              <div class="card-content">
                <button (click)="logout()" class="btn-destructive">
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        } @else {
          <!-- Loading state -->
          <div class="space-y-6">
            <div class="card p-6">
              <div class="animate-pulse space-y-4">
                <div class="h-4 bg-gray-200 rounded w-1/4"></div>
                <div class="h-8 bg-gray-200 rounded w-1/2"></div>
                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  user = this.authService.currentUser;
  isLoading = this.authService.isLoading;

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  ngOnInit(): void {
    this.initForms();
    this.loadProfile();
  }

  private initForms(): void {
    this.profileForm = this.fb.group({
      profile: this.fb.group({
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        phone: [''],
        address: this.fb.group({
          street: [''],
          city: [''],
          postalCode: [''],
          country: ['Madagascar'],
        }),
      }),
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  private async loadProfile(): Promise<void> {
    try {
      const user = await this.authService.getProfile();
      this.populateProfileForm(user);
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    }
  }

  private populateProfileForm(user: User): void {
    this.profileForm.patchValue({
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

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (
      newPassword &&
      confirmPassword &&
      newPassword.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  isProfileFieldInvalid(field: string): boolean {
    const control = this.profileForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isPasswordFieldInvalid(field: string): boolean {
    const control = this.passwordForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      BUYER: 'Acheteur',
      SELLER: 'Vendeur',
      ADMIN: 'Administrateur',
    };
    return labels[role] || role;
  }

  async updateProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    try {
      await this.authService.updateProfile(this.profileForm.value);
      this.toastService.success('Profil mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
    }
  }

  async changePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    try {
      await this.authService.changePassword(this.passwordForm.value);
      this.toastService.success('Mot de passe modifié avec succès');
      this.passwordForm.reset();
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
