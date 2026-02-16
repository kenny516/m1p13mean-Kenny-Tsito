import { Component, inject } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, ToastService } from '../../../core';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardSpinnerComponent } from '@/shared/components/spinner';
/**
 * Interface pour les données du profil utilisateur
 */
interface UserProfile {
  firstName: string;
  lastName: string;
  phone?: string;
}

/**
 * Interface pour les données d'inscription
 */
interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  role: 'BUYER' | 'SELLER';
  profile: UserProfile;
}

/**
 * Composant d'inscription utilisant ZardUI
 * Permet aux nouveaux utilisateurs de créer un compte BUYER ou SELLER
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ZardButtonComponent,
    ZardInputDirective,
    ZardCardComponent,
    ZardSpinnerComponent,
  ],
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-2xl w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <div class="flex justify-center mb-4">
            <div
              class="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-3xl"
            >
              🏬
            </div>
          </div>
          <h1 class="text-4xl font-bold text-slate-900">MEAN Mall</h1>
          <p class="mt-2 text-sm text-slate-600">Votre marketplace en ligne</p>
          <h2 class="mt-6 text-2xl font-semibold text-slate-800">
            Créer un compte
          </h2>
        </div>

        <!-- Formulaire -->
        <z-card class="p-8">
          <form
            [formGroup]="registerForm"
            (ngSubmit)="onSubmit()"
            class="space-y-6"
          >
            <!-- Type de compte -->
            <div class="space-y-3">
              <span class="block text-sm font-medium text-slate-700">
                Type de compte
              </span>
              <div class="flex gap-4">
                <label
                  class="flex-1 cursor-pointer"
                  [class.opacity-50]="
                    registerForm.get('role')?.value !== 'BUYER'
                  "
                >
                  <input
                    type="radio"
                    formControlName="role"
                    value="BUYER"
                    class="sr-only peer"
                  />
                  <div
                    class="p-4 border-2 rounded-lg transition-all peer-checked:border-primary peer-checked:bg-primary/5"
                  >
                    <div class="flex items-center gap-3">
                      <span class="text-2xl">🛍️</span>
                      <div>
                        <p class="font-semibold text-slate-900">Acheteur</p>
                        <p class="text-xs text-slate-600">
                          Je veux acheter des produits
                        </p>
                      </div>
                    </div>
                  </div>
                </label>

                <label
                  class="flex-1 cursor-pointer"
                  [class.opacity-50]="
                    registerForm.get('role')?.value !== 'SELLER'
                  "
                >
                  <input
                    type="radio"
                    formControlName="role"
                    value="SELLER"
                    class="sr-only peer"
                  />
                  <div
                    class="p-4 border-2 rounded-lg transition-all peer-checked:border-primary peer-checked:bg-primary/5"
                  >
                    <div class="flex items-center gap-3">
                      <span class="text-2xl">🏪</span>
                      <div>
                        <p class="font-semibold text-slate-900">Vendeur</p>
                        <p class="text-xs text-slate-600">
                          Je veux vendre mes produits
                        </p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Email -->
            <div class="space-y-2">
              <label
                for="email"
                class="block text-sm font-medium text-slate-700"
              >
                Adresse email
              </label>
              <input
                z-input
                id="email"
                type="email"
                formControlName="email"
                placeholder="john@example.com"
                class="w-full"
              />
              @if (isFieldInvalid('email')) {
                <p class="text-sm text-red-500 mt-1">
                  @if (getControl('email')?.errors?.['required']) {
                    L'email est requis
                  } @else if (getControl('email')?.errors?.['email']) {
                    Email invalide
                  }
                </p>
              }
            </div>

            <!-- Informations personnelles -->
            <div formGroupName="profile" class="grid grid-cols-2 gap-4">
              <!-- Prénom -->
              <div class="space-y-2">
                <label
                  for="firstName"
                  class="block text-sm font-medium text-slate-700"
                >
                  Prénom
                </label>
                <input
                  z-input
                  id="firstName"
                  type="text"
                  formControlName="firstName"
                  placeholder="Jean"
                  class="w-full"
                />
                @if (isFieldInvalid('profile.firstName')) {
                  <p class="text-sm text-red-500 mt-1">
                    @if (
                      getControl('profile.firstName')?.errors?.['required']
                    ) {
                      Le prénom est requis
                    } @else if (
                      getControl('profile.firstName')?.errors?.['minlength']
                    ) {
                      Minimum 2 caractères
                    }
                  </p>
                }
              </div>

              <!-- Nom -->
              <div class="space-y-2">
                <label
                  for="lastName"
                  class="block text-sm font-medium text-slate-700"
                >
                  Nom
                </label>
                <input
                  z-input
                  id="lastName"
                  type="text"
                  formControlName="lastName"
                  placeholder="Dupont"
                  class="w-full"
                />
                @if (isFieldInvalid('profile.lastName')) {
                  <p class="text-sm text-red-500 mt-1">
                    @if (getControl('profile.lastName')?.errors?.['required']) {
                      Le nom est requis
                    } @else if (
                      getControl('profile.lastName')?.errors?.['minlength']
                    ) {
                      Minimum 2 caractères
                    }
                  </p>
                }
              </div>
            </div>

            <!-- Téléphone (optionnel) -->
            <div class="space-y-2" formGroupName="profile">
              <label
                for="phone"
                class="block text-sm font-medium text-slate-700"
              >
                Téléphone (optionnel)
              </label>
              <input
                z-input
                id="phone"
                type="tel"
                formControlName="phone"
                placeholder="+261 34 12 345 67"
                class="w-full"
              />
              @if (isFieldInvalid('profile.phone')) {
                <p class="text-sm text-red-500 mt-1">
                  Format: +261 ou 0 suivi de 9 chiffres
                </p>
              }
            </div>

            <!-- Mot de passe -->
            <div class="space-y-2">
              <label
                for="password"
                class="block text-sm font-medium text-slate-700"
              >
                Mot de passe
              </label>
              <input
                z-input
                id="password"
                type="password"
                formControlName="password"
                placeholder="••••••••"
                class="w-full"
              />
              @if (isFieldInvalid('password')) {
                <p class="text-sm text-red-500 mt-1">
                  @if (getControl('password')?.errors?.['required']) {
                    Le mot de passe est requis
                  } @else if (getControl('password')?.errors?.['minlength']) {
                    Minimum 8 caractères
                  } @else if (getControl('password')?.errors?.['pattern']) {
                    Doit contenir: majuscule, minuscule et chiffre
                  }
                </p>
              }
              @if (
                !isFieldInvalid('password') && getControl('password')?.value
              ) {
                <p class="text-xs text-slate-600 mt-1">
                  Minimum 8 caractères avec majuscule, minuscule et chiffre
                </p>
              }
            </div>

            <!-- Confirmation mot de passe -->
            <div class="space-y-2">
              <label
                for="confirmPassword"
                class="block text-sm font-medium text-slate-700"
              >
                Confirmer le mot de passe
              </label>
              <input
                z-input
                id="confirmPassword"
                type="password"
                formControlName="confirmPassword"
                placeholder="••••••••"
                class="w-full"
              />
              @if (isFieldInvalid('confirmPassword')) {
                <p class="text-sm text-red-500 mt-1">
                  @if (getControl('confirmPassword')?.errors?.['required']) {
                    La confirmation est requise
                  } @else if (
                    getControl('confirmPassword')?.errors?.['passwordMismatch']
                  ) {
                    Les mots de passe ne correspondent pas
                  }
                </p>
              }
            </div>

            <!-- Bouton d'inscription -->
            <button
              z-button
              type="submit"
              [zDisabled]="registerForm.invalid || isLoading()"
              class="w-full"
            >
              @if (isLoading()) {
                <z-spinner class="mr-2 h-5 w-5" />
                Inscription en cours...
              } @else {
                Créer mon compte
              }
            </button>

            <!-- CGU -->
            <p class="text-center text-xs text-slate-500">
              En vous inscrivant, vous acceptez nos
              <a href="#" class="text-primary hover:underline">
                conditions d'utilisation
              </a>
              et notre
              <a href="#" class="text-primary hover:underline">
                politique de confidentialité
              </a>
              .
            </p>
          </form>
        </z-card>

        <!-- Footer - Lien connexion -->
        <div class="text-center">
          <p class="text-sm text-slate-600">
            Vous avez déjà un compte ?
            <a
              routerLink="/auth/login"
              class="font-medium text-primary hover:underline ml-1"
            >
              Se connecter
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  isLoading = this.authService.isLoading;

  /**
   * Formulaire d'inscription avec validation stricte
   */
  registerForm: FormGroup = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
      role: ['BUYER', [Validators.required]],
      profile: this.fb.group({
        firstName: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
          ],
        ],
        lastName: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
          ],
        ],
        phone: ['', [Validators.pattern(/^(\+261|0)[0-9]{9}$/)]],
      }),
    },
    { validators: this.passwordMatchValidator },
  );

  /**
   * Validateur personnalisé pour vérifier que les mots de passe correspondent
   */
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  /**
   * Récupère un contrôle du formulaire
   */
  getControl(path: string): AbstractControl | null {
    return this.registerForm.get(path);
  }

  /**
   * Vérifie si un champ est invalide et a été touché
   */
  isFieldInvalid(field: string): boolean {
    const control = this.getControl(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  /**
   * Soumet le formulaire d'inscription
   */
  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    try {
      const formData = this.registerForm.value as RegisterFormData;
      const user = await this.authService.register(formData);
      this.toastService.success(
        `Bienvenue, ${user.profile.firstName} ! Votre compte a été créé.`,
      );
      this.authService.redirectByRole();
    } catch (error) {
      // L'erreur est gérée par l'intercepteur
      console.error("Erreur d'inscription:", error);
    }
  }
}
