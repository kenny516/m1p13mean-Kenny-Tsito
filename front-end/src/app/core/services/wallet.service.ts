import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Wallet, WalletTransaction } from '../models';
import { Pagination } from '../models/api.model';

/**
 * Interface pour les filtres de transactions
 */
export interface TransactionFilters {
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Interface pour la réponse paginée des transactions
 */
export interface TransactionsResponse {
  transactions: WalletTransaction[];
  pagination: Pagination;
}

/**
 * Interface pour un dépôt/retrait
 */
export interface WalletOperationRequest {
  amount: number;
  paymentMethod?: 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CASH';
  description?: string;
}

/**
 * Interface pour la réponse d'une opération wallet
 */
export interface WalletOperationResponse {
  transaction: {
    _id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    status: string;
  };
  newBalance: number;
}

/**
 * Service de gestion du portefeuille
 */
@Injectable({ providedIn: 'root' })
export class WalletService {
  private api = inject(ApiService);

  // Signals pour l'état réactif
  private walletSignal = signal<Wallet | null>(null);
  private transactionsSignal = signal<WalletTransaction[]>([]);
  private isLoadingSignal = signal(false);

  // Computeds publics
  readonly wallet = this.walletSignal.asReadonly();
  readonly transactions = this.transactionsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  /**
   * Récupère le wallet de l'utilisateur connecté
   */
  async getWallet(): Promise<Wallet> {
    this.isLoadingSignal.set(true);
    try {
      const wallet = await this.api.get<Wallet>('/wallets');
      this.walletSignal.set(wallet);
      return wallet;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Récupère l'historique des transactions
   */
  async getTransactions(
    filters: TransactionFilters = {},
    page = 1,
    limit = 10,
  ): Promise<TransactionsResponse> {
    this.isLoadingSignal.set(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString(),
      };

      if (filters.type) params['type'] = filters.type;
      if (filters.status) params['status'] = filters.status;
      if (filters.startDate) params['startDate'] = filters.startDate;
      if (filters.endDate) params['endDate'] = filters.endDate;

      const response = await this.api.getWithPagination<WalletTransaction[]>(
        '/wallets/transactions',
        params,
      );

      const transactions = response.data || [];
      this.transactionsSignal.set(transactions);

      return {
        transactions,
        pagination: response.pagination!,
      };
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Effectue un dépôt
   */
  async deposit(
    data: WalletOperationRequest,
  ): Promise<WalletOperationResponse> {
    this.isLoadingSignal.set(true);
    try {
      const response = await this.api.post<WalletOperationResponse>(
        '/wallets/deposit',
        data,
      );
      // Mettre à jour le solde
      const currentWallet = this.walletSignal();
      if (currentWallet) {
        this.walletSignal.set({
          ...currentWallet,
          balance: response.newBalance,
        });
      }
      return response;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Effectue un retrait
   */
  async withdraw(
    data: WalletOperationRequest,
  ): Promise<WalletOperationResponse> {
    this.isLoadingSignal.set(true);
    try {
      const response = await this.api.post<WalletOperationResponse>(
        '/wallets/withdraw',
        data,
      );
      // Mettre à jour le solde
      const currentWallet = this.walletSignal();
      if (currentWallet) {
        this.walletSignal.set({
          ...currentWallet,
          balance: response.newBalance,
        });
      }
      return response;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }
}
