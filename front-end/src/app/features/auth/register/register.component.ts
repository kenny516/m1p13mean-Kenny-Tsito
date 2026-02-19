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
import { ZardLabelComponent } from '@/shared/components/label';
import { ZardIconComponent } from '@/shared/components/icon';

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
 * Design : Logo + formulaire dans une seule card, pas de navbar
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
    ZardLabelComponent,
    ZardIconComponent,
  ],
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-muted/30 p-4"
    >
      <z-card class="w-full max-w-lg overflow-hidden">
        <!-- Header avec logo dans la card -->
        <div class="bg-primary/5 border-b border-border px-6 py-5 text-center">
          <div class="flex justify-center mb-2">
            <div
              class="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white text-xl shadow-lg"
            >
              🏬
            </div>
          </div>
          <h1 class="text-xl font-bold text-foreground">MEAN Mall</h1>
          <p class="text-xs text-muted-foreground mt-0.5">
            Votre marketplace en ligne
          </p>
        </div>

        <!-- Formulaire -->
        <div class="p-6">
          <h2
            class="text-lg font-semibold text-foreground mb-5 text-center"
          >
            Créer un compte
          </h2>

          <form
            [formGroup]="registerForm"
            (ngSubmit)="onSubmit()"
            class="space-y-4"
          >
            <!-- Type de compte -->
            <div class="grid grid-cols-2 gap-3">
              <label class="cursor-pointer">
                <input
                  type="radio"
                  formControlName="role"
                  value="BUYER"
                  class="sr-only peer"
                />
                <div
                  class="p-3 border-2 rounded-lg transition-all peer-checked:border-primary peer-checked:bg-primary/5 hover:border-muted-foreground/50"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-xl">🛍️</span>
                    <div>
                      <p class="font-medium text-sm text-foreground">Acheteur</p>
                      <p class="text-xs text-muted-foreground">
                        Acheter des produits
                      </p>
                    </div>
                  </div>
                </div>
              </label>

              <label class="cursor-pointer">
                <input
                  type="radio"
                  formControlName="role"
                  value="SELLER"
                  class="sr-only peer"
                />
                <div
                  class="p-3 border-2 rounded-lg transition-all peer-checked:border-primary peer-checked:bg-primary/5 hover:border-muted-foreground/50"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-xl">🏪</span>
                    <div>
                      <p class="font-medium text-sm text-foreground">Vendeur</p>
                      <p class="text-xs text-muted-foreground">
                        Vendre mes produits
                      </p>
                    </div>
                  </div>
                </div>
              </label>
            </div>

            <!-- Email -->
            <div class="space-y-1.5">
              <z-label for="email">Adresse email</z-label>
              <div class="relative">
                <z-icon
                  zType="mail"
                  class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                />
                <input
                  z-input
                  id="email"
                  type="email"
                  formControlName="email"
                  placeholder="john@example.com"
                  class="w-full pl-10"
                />
              </div>
              @if (isFieldInvalid('email')) {
                <p class="text-xs text-destructive">
                  @if (getControl('email')?.errors?.['required']) {
                    L'email est requis
                  } @else if (getControl('email')?.errors?.['email']) {
                    Email invalide
                  }
                </p>
              }
            </div>

            <!-- Prénom & Nom -->
            <div formGroupName="profile" class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <z-label for="firstName">Prénom</z-label>
                <input
                  z-input
                  id="firstName"
                  type="text"
                  formControlName="firstName"
                  placeholder="Jean"
                  class="w-full"
                />
                @if (isFieldInvalid('profile.firstName')) {
                  <p class="text-xs text-destructive">
                    @if (
                      getControl('profile.firstName')?.errors?.['required']
                    ) {
                      Requis
                    } @else {
                      Min. 2 caractères
                    }
                  </p>
                }
              </div>
              <div class="space-y-1.5">
                <z-label for="lastName">Nom</z-label>
                <input
                  z-input
                  id="lastName"
                  type="text"
                  formControlName="lastName"
                  placeholder="Dupont"
                  class="w-full"
                />
                @if (isFieldInvalid('profile.lastName')) {
                  <p class="text-xs text-destructive">
                    @if (getControl('profile.lastName')?.errors?.['required']) {
                      Requis
                    } @else {
                      Min. 2 caractères
                    }
                  </p>
                }
              </div>
            </div>

            <!-- Téléphone -->
            <div class="space-y-1.5" formGroupName="profile">
              <z-label for="phone">Téléphone (optionnel)</z-label>
              <input
                z-input
                id="phone"
                type="tel"
                formControlName="phone"
                placeholder="+261 34 12 345 67"
                class="w-full"
              />
            </div>

            <!-- Mots de passe -->
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <z-label for="password">Mot de passe</z-label>
                <div class="relative">
                  <z-icon
                    zType="shield"
                    class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  />
                  <input
                    z-input
                    id="password"
                    type="password"
                    formControlName="password"
                    placeholder="••••••••"
                    class="w-full pl-10"
                  />
                </div>
                @if (isFieldInvalid('password')) {
                  <p class="text-xs text-destructive">Min. 8 car. + Maj + min + chiffre</p>
                }
              </div>
              <div class="space-y-1.5">
                <z-label for="confirmPassword">Confirmer</z-label>
                <input
                  z-input
                  id="confirmPassword"
                  type="password"
                  formControlName="confirmPassword"
                  placeholder="••••••••"
                  class="w-full"
                />
                @if (isFieldInvalid('confirmPassword')) {
                  <p class="text-xs text-destructive">Ne correspondent pas</p>
                }
              </div>
            </div>

            <!-- Submit -->
            <button
              z-button
              type="submit"
              [zDisabled]="registerForm.invalid || isLoading()"
              class="w-full mt-2"
            >
              @if (isLoading()) {
                <z-spinner class="mr-2 h-4 w-4" />
                Inscription...
              } @else {
                <z-icon zType="user-plus" class="mr-2 h-4 w-4" />
                Créer mon compte
              }
            </button>

            <!-- CGU -->
            <p class="text-center text-xs text-muted-foreground">
              En vous inscrivant, vous acceptez nos
              <a href="#" class="text-primary hover:underline">CGU</a>
              et
              <a href="#" class="text-primary hover:underline"
                >politique de confidentialité</a
              >.
            </p>
          </form>

          <!-- Separator -->
          <div class="relative my-5">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border"></div>
            </div>
            <div class="relative flex justify-center text-xs">
              <span class="bg-background px-2 text-muted-foreground">
                Déjà inscrit ?
              </span>
            </div>
          </div>

          <!-- Login link -->
          <a routerLink="/auth/login" z-button zType="outline" class="w-full">
            <z-icon zType="log-out" class="mr-2 h-4 w-4" />
            Se connecter
          </a>
        </div>
      </z-card>
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
