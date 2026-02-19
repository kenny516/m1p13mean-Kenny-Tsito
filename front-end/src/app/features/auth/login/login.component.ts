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
import { ZardLabelComponent } from '@/shared/components/label';
import { ZardSpinnerComponent } from '@/shared/components/spinner';
import { ZardIconComponent } from '@/shared/components/icon';

/**
 * Composant de connexion utilisant ZardUI
 * Design : Logo + formulaire dans une seule card, pas de navbar
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ZardButtonComponent,
    ZardInputDirective,
    ZardCardComponent,
    ZardLabelComponent,
    ZardSpinnerComponent,
    ZardIconComponent,
  ],
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-muted/30 p-4"
    >
      <z-card class="w-full max-w-md overflow-hidden">
        <!-- Header avec logo dans la card -->
        <div class="bg-primary/5 border-b border-border px-8 py-6 text-center">
          <div class="flex justify-center mb-3">
            <div
              class="w-14 h-14 bg-primary rounded-xl flex items-center justify-center text-white text-2xl shadow-lg"
            >
              🏬
            </div>
          </div>
          <h1 class="text-2xl font-bold text-foreground">MEAN Mall</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Votre marketplace en ligne
          </p>
        </div>

        <!-- Formulaire -->
        <div class="p-8">
          <h2 class="text-xl font-semibold text-foreground mb-6 text-center">
            Connexion
          </h2>

          <form
            [formGroup]="loginForm"
            (ngSubmit)="onSubmit()"
            class="space-y-5"
          >
            <!-- Email -->
            <div class="space-y-2">
              <z-label for="email">Adresse email</z-label>
              <div class="relative">
                <z-icon
                  zType="mail"
                  class="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                />
                <input
                  z-input
                  id="email"
                  type="email"
                  formControlName="email"
                  placeholder="votre@email.com"
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

            <!-- Password -->
            <div class="space-y-2">
              <z-label for="password">Mot de passe</z-label>
              <div class="relative">
                <z-icon
                  zType="shield"
                  class="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
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
                <p class="text-xs text-destructive">
                  Le mot de passe est requis
                </p>
              }
            </div>

            <!-- Forgot password -->
            <div class="flex justify-end">
              <a href="#" class="text-xs text-primary hover:underline">
                Mot de passe oublié ?
              </a>
            </div>

            <!-- Submit -->
            <button
              z-button
              type="submit"
              [zDisabled]="loginForm.invalid || isLoading()"
              class="w-full"
            >
              @if (isLoading()) {
                <z-spinner class="mr-2 h-4 w-4" />
                Connexion...
              } @else {
                <z-icon zType="log-out" class="mr-2 h-4 w-4" />
                Se connecter
              }
            </button>
          </form>

          <!-- Separator -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border"></div>
            </div>
            <div class="relative flex justify-center text-xs">
              <span class="bg-background px-2 text-muted-foreground">
                Pas encore inscrit ?
              </span>
            </div>
          </div>

          <!-- Register link -->
          <a
            routerLink="/auth/register"
            z-button
            zType="outline"
            class="w-full"
          >
            <z-icon zType="user-plus" class="mr-2 h-4 w-4" />
            Créer un compte
          </a>
        </div>
      </z-card>
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
