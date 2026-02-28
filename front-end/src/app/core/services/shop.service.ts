import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import {
  Pagination,
  Shop,
  CreateShopRequest,
  UpdateShopRequest,
  ModerateShopRequest,
  AdminUpdateShopRequest,
  ShopFilters,
} from '../models';

export interface ShopsResponse {
  shops: Shop[];
  pagination: Pagination;
}

interface ShopMediaFiles {
  logoFile?: File;
  bannerFile?: File;
}

@Injectable({ providedIn: 'root' })
export class ShopService {
  private api = inject(ApiService);

  private buildShopFormData(
    data: CreateShopRequest | UpdateShopRequest,
    mediaFiles: ShopMediaFiles = {},
  ): FormData {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (Array.isArray(value) || typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
        return;
      }

      formData.append(key, String(value));
    });

    if (mediaFiles.logoFile) {
      formData.append('logo', mediaFiles.logoFile);
    }

    if (mediaFiles.bannerFile) {
      formData.append('banner', mediaFiles.bannerFile);
    }

    return formData;
  }

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
      if (filters?.status && filters.status !== 'ALL')
        params['status'] = filters.status;
      if (filters?.category) params['category'] = filters.category;

      const response = await this.api.getWithPagination<Shop[]>(
        '/shops/my-shops',
        params,
      );
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

  async createShopWithMedia(data: CreateShopRequest, mediaFiles: ShopMediaFiles = {}): Promise<Shop> {
    this.isLoadingSignal.set(true);
    try {
      const formData = this.buildShopFormData(data, mediaFiles);
      return await this.api.post<Shop>('/shops', formData);
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

  async updateShopWithMedia(
    id: string,
    data: UpdateShopRequest,
    mediaFiles: ShopMediaFiles = {},
  ): Promise<Shop> {
    this.isLoadingSignal.set(true);
    try {
      const formData = this.buildShopFormData(data, mediaFiles);
      const shop = await this.api.put<Shop>(`/shops/${id}`, formData);
      this.selectedShopSignal.set(shop);
      return shop;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  setSelectedShop(shop: Shop): void {
    this.selectedShopSignal.set(shop);
    this.shopsSignal.update((shops) =>
      shops.map((current) => (current._id === shop._id ? shop : current)),
    );
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

  // === MÉTHODES ADMIN ===

  /**
   * Récupère toutes les boutiques (admin uniquement)
   */
  async getAllShops(
    filters?: ShopFilters,
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
      if (filters?.status && filters.status !== 'ALL')
        params['status'] = filters.status;
      if (filters?.category) params['category'] = filters.category;
      if (filters?.startDate) params['startDate'] = filters.startDate;
      if (filters?.endDate) params['endDate'] = filters.endDate;
      if (filters?.sort) params['sort'] = filters.sort;

      const response = await this.api.getWithPagination<Shop[]>(
        '/admin/shops',
        params,
      );
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

  /**
   * Récupère les boutiques en attente de validation (admin uniquement)
   */
  async getPendingShops(
    filters?: ShopFilters,
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
      if (filters?.category) params['category'] = filters.category;
      if (filters?.sort) params['sort'] = filters.sort;

      const response = await this.api.getWithPagination<Shop[]>(
        '/admin/shops/pending',
        params,
      );
      if (!response.success || !response.data || !response.pagination) {
        throw new Error(
          'Erreur lors de la récupération des boutiques en attente',
        );
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

  /**
   * Modère une boutique (approuver ou rejeter) - admin uniquement
   */
  async moderateShop(id: string, data: ModerateShopRequest): Promise<Shop> {
    this.isLoadingSignal.set(true);
    try {
      const shop = await this.api.put<Shop>(
        `/admin/shops/${id}/validate`,
        data,
      );
      this.selectedShopSignal.set(shop);
      // Mettre à jour la boutique dans la liste si elle existe
      this.shopsSignal.update((shops) =>
        shops.map((s) => (s._id === id ? shop : s)),
      );
      return shop;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Met à jour les paramètres admin d'une boutique (commission, etc.)
   */
  async adminUpdateShop(
    id: string,
    data: AdminUpdateShopRequest,
  ): Promise<Shop> {
    this.isLoadingSignal.set(true);
    try {
      const shop = await this.api.put<Shop>(`/admin/shops/${id}`, data);
      this.selectedShopSignal.set(shop);
      // Mettre à jour la boutique dans la liste si elle existe
      this.shopsSignal.update((shops) =>
        shops.map((s) => (s._id === id ? shop : s)),
      );
      return shop;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Récupère une boutique par son ID (admin peut voir toutes les boutiques)
   */
  async getShopAdmin(id: string): Promise<Shop> {
    this.isLoadingSignal.set(true);
    try {
      const shop = await this.api.get<Shop>(`/admin/shops/${id}`);
      this.selectedShopSignal.set(shop);
      return shop;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }
}
