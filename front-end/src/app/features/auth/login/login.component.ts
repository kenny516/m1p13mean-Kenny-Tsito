import { Component, inject } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, ToastService } from '../../../core';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardCardComponent } from '@/shared/components/card';

/**
 * Composant de connexion utilisant ZardUI
 * Permet aux utilisateurs (BUYER, SELLER, ADMIN) de se connecter
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ZardButtonComponent,
    ZardInputDirective,
    ZardCardComponent
],
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-md w-full space-y-8">
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
          <p class="mt-2 text-sm text-slate-600">
            Votre marketplace en ligne
          </p>
          <h2 class="mt-6 text-2xl font-semibold text-slate-800">Connexion</h2>
        </div>

        <!-- Formulaire -->
        <z-card class="p-8">
          <form
            [formGroup]="loginForm"
            (ngSubmit)="onSubmit()"
            class="space-y-6"
          >
            <!-- Email -->
            <div class="space-y-2">
              <label for="email" class="block text-sm font-medium text-slate-700">
                Adresse email
              </label>
              <input
                z-input
                id="email"
                type="email"
                formControlName="email"
                placeholder="votre@email.com"
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

            <!-- Password -->
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
                  }
                </p>
              }
            </div>

            <!-- Mot de passe oublié -->
            <div class="flex items-center justify-end">
              <a
                href="#"
                class="text-sm font-medium text-primary hover:underline"
              >
                Mot de passe oublié ?
              </a>
            </div>

            <!-- Bouton de connexion -->
            <button
              z-button
              type="submit"
              [zDisabled]="loginForm.invalid || isLoading()"
              class="w-full"
            >
              @if (isLoading()) {
                <svg
                  class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Connexion en cours...
              } @else {
                Se connecter
              }
            </button>
          </form>
        </z-card>

        <!-- Footer - Lien inscription -->
        <div class="text-center">
          <p class="text-sm text-slate-600">
            Pas encore de compte ?
            <a
              routerLink="/auth/register"
              class="font-medium text-primary hover:underline ml-1"
            >
              Créer un compte
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  isLoading = this.authService.isLoading;

  /**
   * Formulaire de connexion avec validation
   */
  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  /**
   * Récupère un contrôle du formulaire
   */
  getControl(path: string): AbstractControl | null {
    return this.loginForm.get(path);
  }

  /**
   * Vérifie si un champ est invalide et a été touché
   */
  isFieldInvalid(field: string): boolean {
    const control = this.getControl(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  /**
   * Soumet le formulaire de connexion
   */
  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    try {
      const user = await this.authService.login(this.loginForm.value);
      this.toastService.success(`Bienvenue, ${user.profile.firstName} !`);
      this.authService.redirectByRole();
    } catch (error) {
      // L'erreur est gérée par l'intercepteur
      console.error('Erreur de connexion:', error);
    }
  }
}
