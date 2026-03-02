import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import {
  AuthService,
  ImageManagementService,
  ToastService,
  User,
  WalletOperationRequest,
  WalletService,
  WalletTransaction,
} from '../../core';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardLabelComponent } from '@/shared/components/label';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { ZardSpinnerComponent } from '@/shared/components/spinner';
import {
  ZardTabGroupComponent,
  ZardTabComponent,
} from '@/shared/components/tabs';
import { ZardSelectImports } from '@/shared/components/select';
import { FilePickerComponent } from '@/shared/components/file-picker/file-picker.component';
import { IKImageDirective } from '@imagekit/angular';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardInputDirective,
    ZardLabelComponent,
    ZardIconComponent,
    ZardSkeletonComponent,
    ZardSpinnerComponent,
    ZardTabGroupComponent,
    ZardTabComponent,
    ...ZardSelectImports,
    FilePickerComponent,
    IKImageDirective,
  ],
  template: `
    <div class="min-h-screen bg-muted/30 py-6">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        @if (user(); as userData) {
          <!-- Header compact avec infos principales -->
          <div class="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <!-- Carte utilisateur -->
            <z-card class="p-4 lg:col-span-2">
              <div class="flex items-center gap-4">
                <div class="group flex flex-col items-center gap-2">
                  <div class="relative h-20 w-20">
                    @if (userData.profile.avatar) {
                      <img
                        [ikSrc]="userData.profile.avatar"
                        [transformation]="[{ width: 400, height: 400, quality: 90 }]"
                        [responsive]="false"
                        loading="lazy"
                        class="h-20 w-20 rounded-full border border-border object-cover"
                        alt="Avatar utilisateur"
                      />
                    } @else {
                      <div
                        class="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold"
                      >
                        {{
                          userData.profile.firstName?.[0] || userData.email[0]
                            | uppercase
                        }}
                      </div>
                    }
                  </div>

                  <div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      z-button
                      zType="outline"
                      zSize="sm"
                      type="button"
                      [disabled]="!userData.profile.avatar"
                      (click)="openMediaPreview(userData.profile.avatar)"
                    >
                      Voir
                    </button>
                    <app-file-picker
                      [label]="userData.profile.avatar ? 'Modifier' : 'Ajouter'"
                      buttonType="outline"
                      [disabled]="isAvatarBusy()"
                      (fileSelected)="onUserAvatarSelected($event)"
                    />
                    <button
                      z-button
                      zType="destructive"
                      zSize="sm"
                      type="button"
                      [disabled]="!userData.profile.avatar || isAvatarBusy()"
                      (click)="deleteUserAvatar()"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h1 class="text-xl font-bold text-foreground truncate">
                      {{
                        userData.profile.firstName || userData.profile.lastName
                          ? userData.profile.firstName +
                            ' ' +
                            userData.profile.lastName
                          : userData.email
                      }}
                    </h1>
                    <span
                      class="px-2 py-0.5 text-xs font-medium rounded-md shrink-0"
                      [ngClass]="{
                        'bg-primary text-primary-foreground':
                          userData.role === 'BUYER',
                        'bg-green-600 text-white': userData.role === 'SELLER',
                        'bg-secondary text-secondary-foreground':
                          userData.role === 'ADMIN',
                      }"
                    >
                      {{ getRoleLabel(userData.role) }}
                    </span>
                  </div>
                  <p class="text-sm text-muted-foreground truncate">
                    {{ userData.email }}
                  </p>
                  <p class="text-xs text-muted-foreground mt-1">
                    Membre depuis {{ userData.createdAt | date: 'MMMM yyyy' }}
                  </p>
                </div>
                <button
                  z-button
                  zType="destructive"
                  zSize="sm"
                  (click)="logout()"
                  class="shrink-0"
                >
                  <z-icon zType="log-out" class="h-4 w-4" />
                </button>
              </div>
            </z-card>

            <!-- Carte wallet -->
            @if (userData.wallet) {
              <z-card class="p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-muted-foreground">Solde</p>
                    <p class="text-2xl font-bold text-green-600">
                      {{ userData.wallet.balance | number: '1.0-0' }}
                      <span class="text-sm font-normal">{{
                        userData.wallet.currency
                      }}</span>
                    </p>
                  </div>
                  <div
                    class="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center"
                  >
                    <z-icon zType="wallet" class="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </z-card>
            }
          </div>

          <!-- Tabs pour le contenu -->
          <z-tab-group class="bg-background rounded-lg border border-border">
            <!-- Tab Profil -->
            <z-tab label="Mon profil">
              <div class="p-6">
                <form
                  [formGroup]="profileForm"
                  (ngSubmit)="updateProfile()"
                  class="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div formGroupName="profile" class="space-y-4">
                    <h3 class="font-semibold text-foreground">
                      Informations personnelles
                    </h3>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <z-label for="firstName">Prénom</z-label>
                        <input
                          z-input
                          id="firstName"
                          type="text"
                          formControlName="firstName"
                          class="mt-1 w-full"
                        />
                      </div>
                      <div>
                        <z-label for="lastName">Nom</z-label>
                        <input
                          z-input
                          id="lastName"
                          type="text"
                          formControlName="lastName"
                          class="mt-1 w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <z-label for="phone">Téléphone</z-label>
                      <input
                        z-input
                        id="phone"
                        type="tel"
                        formControlName="phone"
                        class="mt-1 w-full"
                        placeholder="+261 34 00 000 00"
                      />
                    </div>
                  </div>

                  <div formGroupName="profile" class="space-y-4">
                    <h3 class="font-semibold text-foreground">Adresse</h3>
                    <div formGroupName="address" class="space-y-3">
                      <input
                        z-input
                        type="text"
                        formControlName="street"
                        class="w-full"
                        placeholder="Rue"
                      />
                      <div class="grid grid-cols-2 gap-3">
                        <input
                          z-input
                          type="text"
                          formControlName="city"
                          placeholder="Ville"
                        />
                        <input
                          z-input
                          type="text"
                          formControlName="postalCode"
                          placeholder="Code postal"
                        />
                      </div>
                    </div>
                    <div class="pt-2">
                      <button
                        z-button
                        type="submit"
                        [disabled]="profileForm.invalid || isLoading()"
                        class="w-full"
                      >
                        @if (isLoading()) {
                          <z-spinner class="mr-2 h-4 w-4" />
                        }
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </z-tab>

            <!-- Tab Sécurité -->
            <z-tab label="Sécurité">
              <div class="p-6 max-w-md">
                <h3 class="font-semibold text-foreground mb-4">
                  Changer le mot de passe
                </h3>
                <form
                  [formGroup]="passwordForm"
                  (ngSubmit)="changePassword()"
                  class="space-y-4"
                >
                  <div>
                    <z-label for="currentPassword">Mot de passe actuel</z-label>
                    <input
                      z-input
                      id="currentPassword"
                      type="password"
                      formControlName="currentPassword"
                      class="mt-1 w-full"
                    />
                  </div>
                  <div>
                    <z-label for="newPassword">Nouveau mot de passe</z-label>
                    <input
                      z-input
                      id="newPassword"
                      type="password"
                      formControlName="newPassword"
                      class="mt-1 w-full"
                    />
                    @if (isPasswordFieldInvalid('newPassword')) {
                      <p class="mt-1 text-xs text-destructive">
                        Min. 8 caractères avec majuscule, minuscule et chiffre
                      </p>
                    }
                  </div>
                  <div>
                    <z-label for="confirmNewPassword">Confirmer</z-label>
                    <input
                      z-input
                      id="confirmNewPassword"
                      type="password"
                      formControlName="confirmPassword"
                      class="mt-1 w-full"
                    />
                    @if (isPasswordFieldInvalid('confirmPassword')) {
                      <p class="mt-1 text-xs text-destructive">
                        Les mots de passe ne correspondent pas
                      </p>
                    }
                  </div>
                  <button
                    z-button
                    type="submit"
                    [disabled]="passwordForm.invalid || isLoading()"
                    class="w-full"
                  >
                    Changer le mot de passe
                  </button>
                </form>
              </div>
            </z-tab>

            <!-- Tab Transactions -->
            @if (userData.wallet) {
              <z-tab label="Transactions">
                <div class="p-6">
                  <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div class="xl:col-span-2">
                      <div class="flex justify-between items-center mb-4">
                        <h3 class="font-semibold text-foreground">
                          Historique des transactions
                        </h3>
                        <button
                          z-button
                          zType="ghost"
                          zSize="sm"
                          (click)="loadTransactions()"
                          [disabled]="isLoadingTransactions()"
                        >
                          @if (isLoadingTransactions()) {
                            <z-spinner class="h-4 w-4" />
                          } @else {
                            <z-icon zType="loader-circle" class="h-4 w-4" />
                          }
                        </button>
                      </div>

                      @if (isLoadingTransactions() && transactions().length === 0) {
                        <div class="space-y-2">
                          @for (i of [1, 2, 3]; track i) {
                            <z-skeleton class="h-14 w-full" />
                          }
                        </div>
                      } @else if (transactions().length === 0) {
                        <div class="text-center py-8 text-muted-foreground">
                          <z-icon zType="file-text" class="mx-auto h-10 w-10" />
                          <p class="mt-2 text-sm">Aucune transaction</p>
                        </div>
                      } @else {
                        <div class="space-y-2">
                          @for (
                            transaction of transactions();
                            track transaction._id
                          ) {
                            <div
                              class="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                            >
                              <div class="flex items-center gap-3">
                                <div
                                  class="w-8 h-8 rounded-full flex items-center justify-center"
                                  [ngClass]="{
                                    'bg-green-100 dark:bg-green-900':
                                      isPositiveTransaction(transaction.type),
                                    'bg-red-100 dark:bg-red-900':
                                      !isPositiveTransaction(transaction.type),
                                  }"
                                >
                                  <z-icon
                                    [zType]="
                                      isPositiveTransaction(transaction.type)
                                        ? 'plus'
                                        : 'minus'
                                    "
                                    class="h-4 w-4"
                                    [ngClass]="{
                                      'text-green-600': isPositiveTransaction(
                                        transaction.type
                                      ),
                                      'text-red-600': !isPositiveTransaction(
                                        transaction.type
                                      ),
                                    }"
                                  />
                                </div>
                                <div>
                                  <p class="font-medium text-sm text-foreground">
                                    {{ getTransactionLabel(transaction.type) }}
                                  </p>
                                  <p class="text-xs text-muted-foreground">
                                    {{
                                      transaction.createdAt
                                        | date: 'dd/MM/yyyy HH:mm'
                                    }}
                                  </p>
                                  @if (transaction.description) {
                                    <p class="text-xs text-muted-foreground line-clamp-1">
                                      {{ transaction.description }}
                                    </p>
                                  }
                                </div>
                              </div>
                              <p
                                class="font-semibold text-sm"
                                [ngClass]="{
                                  'text-green-600': isPositiveTransaction(
                                    transaction.type
                                  ),
                                  'text-red-600': !isPositiveTransaction(
                                    transaction.type
                                  ),
                                }"
                              >
                                {{
                                  isPositiveTransaction(transaction.type)
                                    ? '+'
                                    : '-'
                                }}{{ transaction.amount | number: '1.0-0' }} MGA
                              </p>
                            </div>
                          }
                        </div>
                        @if (hasMoreTransactions()) {
                          <div class="mt-4 text-center">
                            <button
                              z-button
                              zType="ghost"
                              zSize="sm"
                              (click)="loadMoreTransactions()"
                              [disabled]="isLoadingTransactions()"
                            >
                              Voir plus
                            </button>
                          </div>
                        }
                      }
                    </div>

                    <div class="xl:col-span-1">
                      <div class="rounded-lg border border-border bg-card p-4">
                        <h3 class="font-semibold text-foreground">
                          Opération wallet
                        </h3>
                        <p class="mt-1 text-xs text-muted-foreground">
                          Recharger votre wallet ou retirer de l'argent.
                        </p>

                        <form
                          [formGroup]="walletOperationForm"
                          (ngSubmit)="submitWalletOperation()"
                          class="mt-4 space-y-4"
                        >
                          <div>
                            <label
                              z-label
                              for="operationType"
                              class="text-xs text-muted-foreground"
                            >
                              Type d'opération
                            </label>
                            <z-select
                              formControlName="operationType"
                              zPlaceholder="Choisir une opération"
                              class="mt-1 w-full"
                            >
                              <z-select-item zValue="DEPOSIT">
                                Recharge
                              </z-select-item>
                              <z-select-item zValue="WITHDRAWAL">
                                Retrait
                              </z-select-item>
                            </z-select>
                          </div>

                          <div>
                            <label
                              z-label
                              for="walletAmount"
                              class="text-xs text-muted-foreground"
                            >
                              Montant (MGA)
                            </label>
                            <input
                              z-input
                              id="walletAmount"
                              type="number"
                              min="1"
                              formControlName="amount"
                              class="mt-1 w-full"
                              placeholder="Ex: 50000"
                            />
                            @if (isWalletFieldInvalid('amount')) {
                              <p class="mt-1 text-xs text-destructive">
                                Entrez un montant valide supérieur à 0
                              </p>
                            }
                          </div>

                          @if (isDepositOperation()) {
                            <div>
                              <label
                                z-label
                                for="paymentMethod"
                                class="text-xs text-muted-foreground"
                              >
                                Méthode de paiement
                              </label>
                              <z-select
                                formControlName="paymentMethod"
                                zPlaceholder="Choisir une méthode"
                                class="mt-1 w-full"
                              >
                                <z-select-item zValue="CARD">Carte</z-select-item>
                                <z-select-item zValue="MOBILE_MONEY">
                                  Mobile Money
                                </z-select-item>
                                <z-select-item zValue="BANK_TRANSFER">
                                  Virement bancaire
                                </z-select-item>
                                <z-select-item zValue="CASH">Espèces</z-select-item>
                              </z-select>
                              @if (isWalletFieldInvalid('paymentMethod')) {
                                <p class="mt-1 text-xs text-destructive">
                                  La méthode de paiement est requise
                                </p>
                              }
                            </div>
                          }

                          <div>
                            <label
                              z-label
                              for="walletDescription"
                              class="text-xs text-muted-foreground"
                            >
                              Description (optionnel)
                            </label>
                            <textarea
                              id="walletDescription"
                              formControlName="description"
                              rows="3"
                              class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Ajouter une note"
                            ></textarea>
                            @if (isWalletFieldInvalid('description')) {
                              <p class="mt-1 text-xs text-destructive">
                                La description ne doit pas dépasser 500 caractères
                              </p>
                            }
                          </div>

                          <button
                            z-button
                            type="submit"
                            class="w-full"
                            [disabled]="
                              walletOperationForm.invalid ||
                              isSubmittingWalletOperation()
                            "
                          >
                            @if (isSubmittingWalletOperation()) {
                              <span class="inline-flex items-center gap-2">
                                <z-spinner class="h-4 w-4"></z-spinner>
                                Traitement...
                              </span>
                            } @else {
                              {{
                                currentWalletOperationType() === 'DEPOSIT'
                                  ? 'Recharger le wallet'
                                  : 'Retirer de l’argent'
                              }}
                            }
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </z-tab>
            }

            <!-- Tab Accès rapide -->
            <z-tab label="Accès rapide">
              <div class="p-6">
                <div
                  class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  @if (userData.role === 'BUYER') {
                    <a
                      routerLink="/buyer/products"
                      class="flex items-center p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                    >
                      <div
                        class="p-2 rounded-full bg-primary/10 text-primary mr-3 group-hover:bg-primary group-hover:text-white transition-colors"
                      >
                        <z-icon zType="search" class="h-5 w-5" />
                      </div>
                      <div>
                        <p class="font-medium text-foreground text-sm">
                          Produits
                        </p>
                        <p class="text-xs text-muted-foreground">
                          Parcourir le catalogue
                        </p>
                      </div>
                    </a>
                    <a
                      routerLink="/buyer/cart"
                      class="flex items-center p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                    >
                      <div
                        class="p-2 rounded-full bg-green-100 text-green-600 mr-3 group-hover:bg-green-600 group-hover:text-white transition-colors"
                      >
                        <z-icon zType="shopping-cart" class="h-5 w-5" />
                      </div>
                      <div>
                        <p class="font-medium text-foreground text-sm">
                          Panier
                        </p>
                        <p class="text-xs text-muted-foreground">
                          Gérer vos articles
                        </p>
                      </div>
                    </a>
                  }
                  @if (userData.role === 'ADMIN') {
                    <a
                      routerLink="/admin"
                      class="flex items-center p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                    >
                      <div
                        class="p-2 rounded-full bg-red-100 text-red-600 mr-3 group-hover:bg-red-600 group-hover:text-white transition-colors"
                      >
                        <z-icon zType="layout-dashboard" class="h-5 w-5" />
                      </div>
                      <div>
                        <p class="font-medium text-foreground text-sm">
                          Dashboard
                        </p>
                        <p class="text-xs text-muted-foreground">
                          Administration
                        </p>
                      </div>
                    </a>
                  }
                </div>
              </div>
            </z-tab>
          </z-tab-group>
        } @else {
          <!-- Loading state -->
          <div class="space-y-4">
            <z-skeleton class="h-24 w-full" />
            <z-skeleton class="h-64 w-full" />
          </div>
        }
      </div>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private imageManagementService = inject(ImageManagementService);
  private toastService = inject(ToastService);
  private walletService = inject(WalletService);

  user = this.authService.currentUser;
  isLoading = this.authService.isLoading;

  // Transactions
  transactions = signal<WalletTransaction[]>([]);
  isLoadingTransactions = signal(false);
  isSubmittingWalletOperation = signal(false);
  isAvatarBusy = signal(false);
  hasMoreTransactions = signal(false);
  transactionPage = 1;

  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  walletOperationForm!: FormGroup;

  ngOnInit(): void {
    this.initForms();
    this.loadProfile();
    this.loadTransactions();
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

    this.walletOperationForm = this.fb.group({
      operationType: ['DEPOSIT', [Validators.required]],
      amount: [null, [Validators.required, Validators.min(1)]],
      paymentMethod: ['MOBILE_MONEY'],
      description: ['', [Validators.maxLength(500)]],
    });

    this.walletOperationForm
      .get('operationType')
      ?.valueChanges.subscribe(() => this.updateWalletPaymentMethodValidation());

    this.updateWalletPaymentMethodValidation();
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

  isWalletFieldInvalid(field: string): boolean {
    const control = this.walletOperationForm.get(field);
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

  async onUserAvatarSelected(file: File): Promise<void> {
    const currentUser = this.user();
    if (!currentUser) return;

    this.isAvatarBusy.set(true);
    try {
      const updatedUser = await this.imageManagementService.uploadUserAvatar(currentUser._id, file);
      this.authService.setCurrentUser(updatedUser);
      this.toastService.success('Avatar mis à jour avec succès');
    } catch {
      this.toastService.error('Impossible de mettre à jour l\'avatar');
    } finally {
      this.isAvatarBusy.set(false);
    }
  }

  async deleteUserAvatar(): Promise<void> {
    const currentUser = this.user();
    if (!currentUser?.profile?.avatar) return;

    this.isAvatarBusy.set(true);
    try {
      const updatedUser = await this.imageManagementService.deleteAvatar('user', currentUser._id);
      this.authService.setCurrentUser(updatedUser as User);
      this.toastService.success('Avatar supprimé avec succès');
    } catch {
      this.toastService.error('Impossible de supprimer l\'avatar');
    } finally {
      this.isAvatarBusy.set(false);
    }
  }

  openMediaPreview(url?: string | null): void {
    if (!url) {
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  logout(): void {
    this.authService.logout();
  }

  // Méthodes pour les transactions
  async loadTransactions(): Promise<void> {
    this.isLoadingTransactions.set(true);
    this.transactionPage = 1;
    try {
      const response = await this.walletService.getTransactions({}, 1, 10);
      this.transactions.set(response.transactions);
      this.hasMoreTransactions.set(
        response.pagination.page < response.pagination.pages,
      );
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    } finally {
      this.isLoadingTransactions.set(false);
    }
  }

  async loadMoreTransactions(): Promise<void> {
    this.isLoadingTransactions.set(true);
    this.transactionPage++;
    try {
      const response = await this.walletService.getTransactions(
        {},
        this.transactionPage,
        10,
      );
      this.transactions.update((current) => [
        ...current,
        ...response.transactions,
      ]);
      this.hasMoreTransactions.set(
        response.pagination.page < response.pagination.pages,
      );
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    } finally {
      this.isLoadingTransactions.set(false);
    }
  }

  currentWalletOperationType(): string {
    return this.walletOperationForm.get('operationType')?.value || 'DEPOSIT';
  }

  isDepositOperation(): boolean {
    return this.currentWalletOperationType() === 'DEPOSIT';
  }

  async submitWalletOperation(): Promise<void> {
    if (this.walletOperationForm.invalid) {
      this.walletOperationForm.markAllAsTouched();
      return;
    }

    this.isSubmittingWalletOperation.set(true);
    try {
      const operationType = this.currentWalletOperationType();
      const payload: WalletOperationRequest = {
        amount: Number(this.walletOperationForm.get('amount')?.value),
        description:
          this.walletOperationForm.get('description')?.value?.trim() || '',
      };

      if (operationType === 'DEPOSIT') {
        payload.paymentMethod = this.walletOperationForm.get('paymentMethod')?.value;
      }

      if (operationType === 'DEPOSIT') {
        await this.walletService.deposit(payload);
      } else {
        await this.walletService.withdraw(payload);
      }

      this.toastService.success(
        operationType === 'DEPOSIT'
          ? 'Recharge effectuée avec succès'
          : 'Retrait effectué avec succès',
      );

      this.walletOperationForm.patchValue({
        amount: null,
        description: '',
      });

      await this.loadProfile();
      await this.loadTransactions();
    } catch (error) {
      this.toastService.error(this.extractWalletErrorMessage(error));
    } finally {
      this.isSubmittingWalletOperation.set(false);
    }
  }

  private extractWalletErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    if (typeof error === 'object' && error !== null) {
      const err = error as {
        message?: unknown;
        error?: {
          message?: unknown;
          error?: { message?: unknown };
        };
      };

      if (typeof err.error?.error?.message === 'string') {
        return err.error.error.message;
      }

      if (typeof err.error?.message === 'string') {
        return err.error.message;
      }

      if (typeof err.message === 'string') {
        return err.message;
      }
    }

    return 'Une erreur est survenue lors de l\'opération wallet';
  }

  private updateWalletPaymentMethodValidation(): void {
    const paymentMethodControl = this.walletOperationForm.get('paymentMethod');
    if (!paymentMethodControl) {
      return;
    }

    if (this.isDepositOperation()) {
      paymentMethodControl.setValidators([Validators.required]);
      if (!paymentMethodControl.value) {
        paymentMethodControl.setValue('MOBILE_MONEY');
      }
    } else {
      paymentMethodControl.clearValidators();
    }

    paymentMethodControl.updateValueAndValidity({ emitEvent: false });
  }

  getTransactionLabel(type: string): string {
    const labels: Record<string, string> = {
      DEPOSIT: 'Dépôt',
      WITHDRAWAL: 'Retrait',
      PURCHASE: 'Achat',
      SALE_INCOME: 'Vente',
      REFUND: 'Remboursement',
      COMMISSION: 'Commission',
      TRANSFER_IN: 'Transfert reçu',
      TRANSFER_OUT: 'Transfert envoyé',
    };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      COMPLETED: 'Complété',
      FAILED: 'Échoué',
      CANCELLED: 'Annulé',
    };
    return labels[status] || status;
  }

  isPositiveTransaction(type: string): boolean {
    const positiveTypes = ['DEPOSIT', 'SALE_INCOME', 'REFUND', 'TRANSFER_IN'];
    return positiveTypes.includes(type);
  }
}
