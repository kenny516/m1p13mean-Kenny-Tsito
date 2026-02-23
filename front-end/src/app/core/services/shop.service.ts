import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Pagination, Shop, CreateShopRequest, UpdateShopRequest } from '../models';

export interface ShopsResponse {
  shops: Shop[];
  pagination: Pagination;
}

@Injectable({ providedIn: 'root' })
export class ShopService {
  private api = inject(ApiService);

  private shopsSignal = signal<Shop[]>([]);
  private selectedShopSignal = signal<Shop | null>(null);
  private paginationSignal = signal<Pagination | null>(null);
  private isLoadingSignal = signal(false);

  readonly shops = this.shopsSignal.asReadonly();
  readonly selectedShop = this.selectedShopSignal.asReadonly();
  readonly pagination = this.paginationSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  readonly hasMorePages = computed(() => {
    const pagination = this.paginationSignal();
    return pagination ? pagination.page < pagination.pages : false;
  });

  async getMyShops(
    filters?: { search?: string; status?: string; category?: string },
    page = 1,
    limit = 10,
  ): Promise<ShopsResponse> {
    this.isLoadingSignal.set(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };

      if (filters?.search) params['search'] = filters.search;
      if (filters?.status && filters.status !== 'ALL') params['status'] = filters.status;
      if (filters?.category) params['category'] = filters.category;

      const response = await this.api.getWithPagination<Shop[]>('/shops/my-shops', params);
      if (!response.success || !response.data || !response.pagination) {
        throw new Error('Erreur lors de la récupération des boutiques');
      }

      this.shopsSignal.set(response.data);
      this.paginationSignal.set(response.pagination);

      return {
        shops: response.data,
        pagination: response.pagination,
      };
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async getShop(id: string): Promise<Shop> {
    this.isLoadingSignal.set(true);
    try {
      const shop = await this.api.get<Shop>(`/shops/${id}`);
      this.selectedShopSignal.set(shop);
      return shop;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async createShop(data: CreateShopRequest): Promise<Shop> {
    this.isLoadingSignal.set(true);
    try {
      return await this.api.post<Shop>('/shops', data);
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async updateShop(id: string, data: UpdateShopRequest): Promise<Shop> {
    this.isLoadingSignal.set(true);
    try {
      const shop = await this.api.put<Shop>(`/shops/${id}`, data);
      this.selectedShopSignal.set(shop);
      return shop;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async submitShop(id: string): Promise<Shop> {
    return this.api.patch<Shop>(`/shops/${id}/submit`, {});
  }

  async archiveShop(id: string): Promise<Shop> {
    return this.api.patch<Shop>(`/shops/${id}/archive`, {});
  }

  async activateShop(id: string): Promise<Shop> {
    return this.api.patch<Shop>(`/shops/${id}/activate`, {});
  }

  async deleteShop(id: string): Promise<void> {
    await this.api.delete<void>(`/shops/${id}`);
    this.shopsSignal.update((shops) => shops.filter((shop) => shop._id !== id));
  }
}
