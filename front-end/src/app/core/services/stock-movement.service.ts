import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import {
  CreateStockMovementRequest,
  SaleStatus,
  StockMovement,
  StockMovementFilters,
  StockMovementLine,
} from '../models/stock-movement.model';
import { Pagination } from '../models/api.model';

export interface StockMovementsResponse {
  movements: StockMovement[];
  pagination: Pagination;
}

export interface StockMovementLinesResponse {
  lines: StockMovementLine[];
  pagination: Pagination;
}

@Injectable({ providedIn: 'root' })
export class StockMovementService {
  private api = inject(ApiService);

  private movementsSignal = signal<StockMovement[]>([]);
  private linesSignal = signal<StockMovementLine[]>([]);
  private selectedMovementSignal = signal<StockMovement | null>(null);
  private paginationSignal = signal<Pagination | null>(null);
  private isLoadingSignal = signal(false);

  readonly movements = this.movementsSignal.asReadonly();
  readonly lines = this.linesSignal.asReadonly();
  readonly selectedMovement = this.selectedMovementSignal.asReadonly();
  readonly pagination = this.paginationSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  readonly hasMorePages = computed(() => {
    const pagination = this.paginationSignal();
    return pagination ? pagination.page < pagination.pages : false;
  });

  async getMovements(
    filters?: StockMovementFilters,
    page = 1,
    limit = 10,
  ): Promise<StockMovementsResponse> {
    this.isLoadingSignal.set(true);
    try {
      const params = this.buildListParams(filters, page, limit);
      const response = await this.api.getWithPagination<StockMovement[]>('/stock-movements', params);

      if (!response.success || !response.data || !response.pagination) {
        throw new Error('Erreur lors du chargement des mouvements');
      }

      this.movementsSignal.set(response.data);
      this.paginationSignal.set(response.pagination);

      return {
        movements: response.data,
        pagination: response.pagination,
      };
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async getMovement(id: string): Promise<StockMovement> {
    this.isLoadingSignal.set(true);
    try {
      const movement = await this.api.get<StockMovement>(`/stock-movements/${id}`);
      this.selectedMovementSignal.set(movement);
      return movement;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async getLines(
    filters?: StockMovementFilters,
    page = 1,
    limit = 10,
  ): Promise<StockMovementLinesResponse> {
    this.isLoadingSignal.set(true);
    try {
      const params = this.buildListParams(filters, page, limit);
      const response = await this.api.getWithPagination<StockMovementLine[]>(
        '/stock-movements/lines',
        params,
      );

      if (!response.success || !response.data || !response.pagination) {
        throw new Error('Erreur lors du chargement des lignes');
      }

      this.linesSignal.set(response.data);
      this.paginationSignal.set(response.pagination);

      return {
        lines: response.data,
        pagination: response.pagination,
      };
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async createMovement(payload: CreateStockMovementRequest): Promise<StockMovement> {
    this.isLoadingSignal.set(true);
    try {
      return await this.api.post<StockMovement>('/stock-movements', payload);
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async updateSaleStatus(id: string, status: SaleStatus): Promise<StockMovement> {
    return this.api.patch<StockMovement>(`/stock-movements/${id}/sale-status`, { status });
  }

  async getSales(
    filters?: StockMovementFilters,
    page = 1,
    limit = 10,
  ): Promise<StockMovementsResponse> {
    this.isLoadingSignal.set(true);
    try {
      const params = this.buildListParams(filters, page, limit);
      const response = await this.api.getWithPagination<StockMovement[]>(
        '/stock-movements/sales',
        params,
      );

      if (!response.success || !response.data || !response.pagination) {
        throw new Error('Erreur lors du chargement des ventes');
      }

      this.movementsSignal.set(response.data);
      this.paginationSignal.set(response.pagination);

      return {
        movements: response.data,
        pagination: response.pagination,
      };
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async getSupplies(
    filters?: StockMovementFilters,
    page = 1,
    limit = 10,
  ): Promise<StockMovementsResponse> {
    this.isLoadingSignal.set(true);
    try {
      const params = this.buildListParams(filters, page, limit);
      const response = await this.api.getWithPagination<StockMovement[]>(
        '/stock-movements/supplies',
        params,
      );

      if (!response.success || !response.data || !response.pagination) {
        throw new Error('Erreur lors du chargement des approvisionnements');
      }

      this.movementsSignal.set(response.data);
      this.paginationSignal.set(response.pagination);

      return {
        movements: response.data,
        pagination: response.pagination,
      };
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async getProductStock(productId: string): Promise<{ total: number; reserved: number; available: number }> {
    return this.api.get<{ total: number; reserved: number; available: number }>(
      `/stock-movements/product/${productId}/stock`,
    );
  }

  private buildListParams(
    filters: StockMovementFilters | undefined,
    page: number,
    limit: number,
  ): Record<string, string> {
    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    };

    if (!filters) return params;

    if (filters.movementType) params['movementType'] = filters.movementType;
    if (filters.shopId) params['shopId'] = filters.shopId;
    if (filters.productId) params['productId'] = filters.productId;
    if (filters.status) params['status'] = filters.status;
    if (filters.sort) params['sort'] = filters.sort;

    return params;
  }
}
