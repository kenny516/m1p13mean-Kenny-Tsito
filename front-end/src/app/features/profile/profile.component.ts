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
import {
  AuthService,
  ToastService,
  User,
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

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardInputDirective,
    ZardLabelComponent,
    ZardIconComponent,
    ZardSkeletonComponent,
    ZardSpinnerComponent,
  ],
  template: `
    <div class="min-h-screen bg-muted/30 py-8">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-foreground">Mon Profil</h1>
          <p class="mt-1 text-sm text-muted-foreground">
            Gérez vos informations personnelles
          </p>
        </div>

        @if (user(); as userData) {
          <div class="space-y-6">
            <!-- Informations du compte -->
            <z-card class="p-6">
              <h2 class="text-lg font-semibold text-foreground mb-4">
                Informations du compte
              </h2>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <span class="text-sm text-muted-foreground">Email</span>
                  <p class="font-medium text-foreground">
                    {{ userData.email }}
                  </p>
                </div>
                <div>
                  <span class="text-sm text-muted-foreground">Rôle</span>
                  <span
                    class="ml-2 px-2 py-0.5 text-xs font-medium rounded-md"
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
                <div>
                  <span class="text-sm text-muted-foreground"
                    >Membre depuis</span
                  >
                  <p class="font-medium text-foreground">
                    {{ userData.createdAt | date: 'longDate' }}
                  </p>
                </div>
                <div>
                  <span class="text-sm text-muted-foreground">Statut</span>
                  <span
                    class="ml-2 px-2 py-0.5 text-xs font-medium rounded-md"
                    [ngClass]="{
                      'bg-green-600 text-white': userData.isValidated,
                      'bg-yellow-500 text-white': !userData.isValidated,
                    }"
                  >
                    {{ userData.isValidated ? 'Validé' : 'En attente' }}
                  </span>
                </div>
              </div>

              @if (userData.wallet) {
                <div class="mt-6 pt-6 border-t border-border">
                  <span class="text-sm text-muted-foreground"
                    >Solde du portefeuille</span
                  >
                  <p class="text-2xl font-bold text-green-600">
                    {{ userData.wallet.balance | number: '1.0-0' }}
                    {{ userData.wallet.currency }}
                  </p>
                  @if (userData.wallet.pendingBalance) {
                    <p class="text-sm text-yellow-600 mt-1">
                      En attente:
                      {{ userData.wallet.pendingBalance | number: '1.0-0' }}
                      {{ userData.wallet.currency }}
                    </p>
                  }
                  <div class="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div class="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <span class="text-green-600 dark:text-green-400"
                        >Total gagné</span
                      >
                      <p
                        class="font-semibold text-green-800 dark:text-green-300"
                      >
                        {{ userData.wallet.totalEarned || 0 | number: '1.0-0' }}
                        {{ userData.wallet.currency }}
                      </p>
                    </div>
                    <div class="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                      <span class="text-red-600 dark:text-red-400"
                        >Total dépensé</span
                      >
                      <p class="font-semibold text-red-800 dark:text-red-300">
                        {{ userData.wallet.totalSpent || 0 | number: '1.0-0' }}
                        {{ userData.wallet.currency }}
                      </p>
                    </div>
                  </div>
                </div>
              }
            </z-card>

            <!-- Formulaire de modification du profil -->
            <z-card class="p-6">
              <h2 class="text-lg font-semibold text-foreground mb-4">
                Modifier le profil
              </h2>
              <form
                [formGroup]="profileForm"
                (ngSubmit)="updateProfile()"
                class="space-y-4"
              >
                <div formGroupName="profile">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <z-label for="firstName">Prénom</z-label>
                      <input
                        z-input
                        id="firstName"
                        type="text"
                        formControlName="firstName"
                        class="mt-1 w-full"
                        [class.border-destructive]="
                          isProfileFieldInvalid('profile.firstName')
                        "
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
                        [class.border-destructive]="
                          isProfileFieldInvalid('profile.lastName')
                        "
                      />
                    </div>
                  </div>

                  <div class="mt-4">
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

                  <div class="mt-4" formGroupName="address">
                    <z-label>Adresse</z-label>
                    <div class="mt-2 space-y-2">
                      <input
                        z-input
                        type="text"
                        formControlName="street"
                        class="w-full"
                        placeholder="Rue"
                      />
                      <div class="grid grid-cols-2 gap-2">
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
                  </div>
                </div>

                <div class="flex justify-end pt-4">
                  <button
                    z-button
                    type="submit"
                    [disabled]="profileForm.invalid || isLoading()"
                  >
                    @if (isLoading()) {
                      <z-spinner class="mr-2 h-4 w-4" />
                    }
                    Enregistrer les modifications
                  </button>
                </div>
              </form>
            </z-card>

            <!-- Formulaire de changement de mot de passe -->
            <z-card class="p-6">
              <h2 class="text-lg font-semibold text-foreground mb-4">
                Changer le mot de passe
              </h2>
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
                    [class.border-destructive]="
                      isPasswordFieldInvalid('currentPassword')
                    "
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
                    [class.border-destructive]="
                      isPasswordFieldInvalid('newPassword')
                    "
                  />
                  @if (isPasswordFieldInvalid('newPassword')) {
                    <p class="mt-1 text-sm text-destructive">
                      Minimum 8 caractères avec majuscule, minuscule et chiffre
                    </p>
                  }
                </div>

                <div>
                  <z-label for="confirmNewPassword"
                    >Confirmer le nouveau mot de passe</z-label
                  >
                  <input
                    z-input
                    id="confirmNewPassword"
                    type="password"
                    formControlName="confirmPassword"
                    class="mt-1 w-full"
                    [class.border-destructive]="
                      isPasswordFieldInvalid('confirmPassword')
                    "
                  />
                  @if (isPasswordFieldInvalid('confirmPassword')) {
                    <p class="mt-1 text-sm text-destructive">
                      Les mots de passe ne correspondent pas
                    </p>
                  }
                </div>

                <div class="flex justify-end pt-4">
                  <button
                    z-button
                    type="submit"
                    [disabled]="passwordForm.invalid || isLoading()"
                  >
                    Changer le mot de passe
                  </button>
                </div>
              </form>
            </z-card>

            <!-- Actions -->
            <z-card class="p-6">
              <h2 class="text-lg font-semibold text-foreground mb-4">
                Actions
              </h2>
              <button z-button zType="destructive" (click)="logout()">
                <z-icon zType="log-out" class="mr-2" />
                Se déconnecter
              </button>
            </z-card>

            <!-- Historique des transactions -->
            @if (userData.wallet) {
              <z-card class="p-6">
                <div class="flex justify-between items-center mb-4">
                  <h2 class="text-lg font-semibold text-foreground">
                    Historique des transactions
                  </h2>
                  <button
                    z-button
                    zType="ghost"
                    zSize="sm"
                    (click)="loadTransactions()"
                    [disabled]="isLoadingTransactions()"
                  >
                    @if (isLoadingTransactions()) {
                      <z-spinner class="mr-2 h-4 w-4" />
                    }
                    Actualiser
                  </button>
                </div>

                @if (isLoadingTransactions() && transactions().length === 0) {
                  <div class="space-y-3">
                    @for (i of [1, 2, 3]; track i) {
                      <z-skeleton class="h-16 w-full" />
                    }
                  </div>
                } @else if (transactions().length === 0) {
                  <div class="text-center py-8 text-muted-foreground">
                    <z-icon zType="file-text" class="mx-auto h-12 w-12" />
                    <p class="mt-2">Aucune transaction</p>
                  </div>
                } @else {
                  <div class="space-y-3">
                    @for (
                      transaction of transactions();
                      track transaction._id
                    ) {
                      <div
                        class="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div class="flex items-center space-x-3">
                          <div
                            class="w-10 h-10 rounded-full flex items-center justify-center"
                            [ngClass]="{
                              'bg-green-100 dark:bg-green-900':
                                isPositiveTransaction(transaction.type),
                              'bg-red-100 dark:bg-red-900':
                                !isPositiveTransaction(transaction.type) &&
                                transaction.type !== 'REFUND' &&
                                transaction.type !== 'COMMISSION',
                              'bg-yellow-100 dark:bg-yellow-900':
                                transaction.type === 'REFUND',
                              'bg-purple-100 dark:bg-purple-900':
                                transaction.type === 'COMMISSION',
                            }"
                          >
                            <z-icon
                              [zType]="
                                isPositiveTransaction(transaction.type)
                                  ? 'plus'
                                  : 'minus'
                              "
                              [ngClass]="{
                                'text-green-600': isPositiveTransaction(
                                  transaction.type
                                ),
                                'text-red-600':
                                  !isPositiveTransaction(transaction.type) &&
                                  transaction.type !== 'COMMISSION',
                                'text-purple-600':
                                  transaction.type === 'COMMISSION',
                              }"
                            />
                          </div>
                          <div>
                            <p class="font-medium text-foreground">
                              {{ getTransactionLabel(transaction.type) }}
                            </p>
                            <p class="text-sm text-muted-foreground">
                              {{
                                transaction.createdAt | date: 'dd/MM/yyyy HH:mm'
                              }}
                            </p>
                            @if (transaction.description) {
                              <p class="text-xs text-muted-foreground">
                                {{ transaction.description }}
                              </p>
                            }
                          </div>
                        </div>
                        <div class="text-right">
                          <p
                            class="font-semibold"
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
                            }}
                            {{ transaction.amount | number: '1.0-0' }} MGA
                          </p>
                          <span
                            class="text-xs px-2 py-0.5 rounded-md font-medium"
                            [ngClass]="{
                              'bg-green-600 text-white':
                                transaction.status === 'COMPLETED',
                              'bg-yellow-500 text-white':
                                transaction.status === 'PENDING',
                              'bg-destructive text-white':
                                transaction.status === 'FAILED',
                              'bg-secondary text-secondary-foreground':
                                transaction.status === 'CANCELLED',
                            }"
                          >
                            {{ getStatusLabel(transaction.status) }}
                          </span>
                        </div>
                      </div>
                    }
                  </div>
                  @if (hasMoreTransactions()) {
                    <div class="mt-4 text-center">
                      <button
                        z-button
                        zType="ghost"
                        (click)="loadMoreTransactions()"
                        [disabled]="isLoadingTransactions()"
                      >
                        Voir plus
                      </button>
                    </div>
                  }
                }
              </z-card>
            }
          </div>
        } @else {
          <!-- Loading state -->
          <div class="space-y-6">
            <z-card class="p-6">
              <div class="space-y-4">
                <z-skeleton class="h-4 w-1/4" />
                <z-skeleton class="h-8 w-1/2" />
                <z-skeleton class="h-4 w-3/4" />
              </div>
            </z-card>
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
  private walletService = inject(WalletService);

  user = this.authService.currentUser;
  isLoading = this.authService.isLoading;

  // Transactions
  transactions = signal<WalletTransaction[]>([]);
  isLoadingTransactions = signal(false);
  hasMoreTransactions = signal(false);
  transactionPage = 1;

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

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
