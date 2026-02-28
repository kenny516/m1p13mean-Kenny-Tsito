import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import {
  Product,
  ProductFilters,
  CreateProductRequest,
  UpdateProductRequest,
  ProductStatus,
} from '../models';
import { Pagination } from '../models/api.model';

/**
 * Interface pour la réponse paginée des produits
 */
export interface ProductsResponse {
  products: Product[];
  pagination: Pagination;
}

/**
 * Service de gestion des produits
 * Fournit les méthodes pour lister, filtrer et récupérer les produits
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private api = inject(ApiService);

  private buildProductFormData(
    data: CreateProductRequest | UpdateProductRequest,
    files: File[] = [],
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

    files.forEach((file) => {
      formData.append('images', file);
    });

    return formData;
  }

  // Signals pour l'état réactif
  private productsSignal = signal<Product[]>([]);
  private selectedProductSignal = signal<Product | null>(null);
  private paginationSignal = signal<Pagination | null>(null);
  private isLoadingSignal = signal(false);
  private categoriesSignal = signal<string[]>([]);

  // Computeds publics
  readonly products = this.productsSignal.asReadonly();
  readonly selectedProduct = this.selectedProductSignal.asReadonly();
  readonly pagination = this.paginationSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly categories = this.categoriesSignal.asReadonly();

  // Computed pour vérifier s'il y a plus de pages
  readonly hasMorePages = computed(() => {
    const pag = this.paginationSignal();
    return pag ? pag.page < pag.pages : false;
  });

  /**
   * Récupère la liste des produits avec pagination et filtres
   * @param filters - Filtres de recherche
   * @param page - Numéro de page
   * @param limit - Nombre d'éléments par page
   */
  async getProducts(
    filters?: ProductFilters,
    page = 1,
    limit = 12,
  ): Promise<ProductsResponse> {
    this.isLoadingSignal.set(true);
    try {
      // Construire les paramètres de requête
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };

      // Ajouter les filtres s'ils sont définis
      if (filters) {
        if (filters.search) params['search'] = filters.search;
        if (filters.category) params['category'] = filters.category;
        if (filters.minPrice !== undefined)
          params['minPrice'] = String(filters.minPrice);
        if (filters.maxPrice !== undefined)
          params['maxPrice'] = String(filters.maxPrice);
        if (filters.shopId) params['shopId'] = filters.shopId;
        if (filters.sort) params['sort'] = filters.sort;
        if (filters.status && filters.status !== 'ALL')
          params['status'] = filters.status;
        if (filters.tags) {
          const tagsArray = Array.isArray(filters.tags)
            ? filters.tags
            : [filters.tags];
          params['tags'] = tagsArray.join(',');
        }
      }

      const response = await this.api.getWithPagination<Product[]>(
        '/products',
        params,
      );

      if (response.success && response.data) {
        this.productsSignal.set(response.data);
        if (response.pagination) {
          this.paginationSignal.set(response.pagination);
        }
        return { products: response.data, pagination: response.pagination! };
      }

      throw new Error('Erreur lors de la récupération des produits');
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Récupère un produit par son ID
   * @param id - Identifiant du produit
   */
  async getProduct(id: string): Promise<Product> {
    this.isLoadingSignal.set(true);
    try {
      const product = await this.api.get<Product>(`/products/${id}`);
      this.selectedProductSignal.set(product);
      return product;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Réinitialise le produit sélectionné
   */
  clearSelectedProduct(): void {
    this.selectedProductSignal.set(null);
  }

  /**
   * Récupère les catégories uniques des produits
   */
  async getCategories(): Promise<string[]> {
    try {
      // Récupérer tous les produits pour extraire les catégories
      // Note: idéalement, ce serait un endpoint dédié côté backend
      const response = await this.api.getWithPagination<Product[]>(
        '/products',
        { limit: '1000', status: 'ACTIVE' },
      );

      if (response.success && response.data) {
        const uniqueCategories: string[] = [
          ...new Set(response.data.map((p: Product) => p.category)),
        ].filter(Boolean) as string[];
        this.categoriesSignal.set(uniqueCategories);
        return uniqueCategories;
      }

      return [];
    } catch {
      return [];
    }
  }

  // ============================================
  // Méthodes pour les vendeurs (SELLER)
  // ============================================

  /**
   * Récupère les produits du vendeur connecté
   */
  async getMyProducts(
    filters?: ProductFilters,
    page = 1,
    limit = 10,
  ): Promise<ProductsResponse> {
    this.isLoadingSignal.set(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };

      if (filters) {
        if (filters.search) params['search'] = filters.search;
        if (filters.status && filters.status !== 'ALL')
          params['status'] = filters.status;
        if (filters.category) params['category'] = filters.category;
        if (filters.shopId) params['shopId'] = filters.shopId;
      }

      const response = await this.api.getWithPagination<Product[]>(
        '/products/my-products',
        params,
      );

      if (response.success && response.data) {
        this.productsSignal.set(response.data);
        if (response.pagination) {
          this.paginationSignal.set(response.pagination);
        }
        return { products: response.data, pagination: response.pagination! };
      }

      throw new Error('Erreur lors de la récupération des produits');
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Crée un nouveau produit
   * @param data - Données du produit
   */
  async createProduct(data: CreateProductRequest): Promise<Product> {
    this.isLoadingSignal.set(true);
    try {
      return await this.api.post<Product>('/products', data);
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async createProductWithImages(
    data: CreateProductRequest,
    files: File[] = [],
  ): Promise<Product> {
    this.isLoadingSignal.set(true);
    try {
      const formData = this.buildProductFormData(data, files);
      return await this.api.post<Product>('/products', formData);
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Met à jour un produit
   * @param id - Identifiant du produit
   * @param data - Données à mettre à jour
   */
  async updateProduct(
    id: string,
    data: UpdateProductRequest,
  ): Promise<Product> {
    this.isLoadingSignal.set(true);
    try {
      const product = await this.api.put<Product>(`/products/${id}`, data);
      this.selectedProductSignal.set(product);
      return product;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async updateProductWithImages(
    id: string,
    data: UpdateProductRequest,
    files: File[] = [],
  ): Promise<Product> {
    this.isLoadingSignal.set(true);
    try {
      const formData = this.buildProductFormData(data, files);
      const product = await this.api.put<Product>(`/products/${id}`, formData);
      this.selectedProductSignal.set(product);
      return product;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Supprime un produit
   * @param id - Identifiant du produit
   */
  async deleteProduct(id: string): Promise<void> {
    this.isLoadingSignal.set(true);
    try {
      await this.api.delete(`/products/${id}`);
      // Retirer le produit de la liste locale
      this.productsSignal.update((products: Product[]) =>
        products.filter((p: Product) => p._id !== id),
      );
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  // ============================================
  // Méthodes pour les admins (ADMIN)
  // ============================================

  /**
   * Récupère tous les produits (tous statuts) pour l'admin
   * @param filters - Filtres de recherche
   * @param page - Numéro de page
   * @param limit - Nombre d'éléments par page
   */
  async getAllProducts(
    filters?: ProductFilters,
    page = 1,
    limit = 10,
  ): Promise<ProductsResponse> {
    this.isLoadingSignal.set(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };

      if (filters) {
        if (filters.search) params['search'] = filters.search;
        if (filters.status && filters.status !== 'ALL')
          params['status'] = filters.status;
        if (filters.category) params['category'] = filters.category;
        if (filters.shopId) params['shopId'] = filters.shopId;
        if (filters.sort) params['sort'] = filters.sort;
      }

      const response = await this.api.getWithPagination<Product[]>(
        '/admin/products',
        params,
      );

      if (response.success && response.data) {
        this.productsSignal.set(response.data);
        if (response.pagination) {
          this.paginationSignal.set(response.pagination);
        }
        return { products: response.data, pagination: response.pagination! };
      }

      throw new Error('Erreur lors de la récupération des produits');
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Récupère les produits en attente de validation (admin)
   * @param filters - Filtres additionnels
   * @param page - Numéro de page
   * @param limit - Nombre d'éléments par page
   */
  async getPendingProducts(
    filters?: Omit<ProductFilters, 'status'>,
    page = 1,
    limit = 10,
  ): Promise<ProductsResponse> {
    return this.getAllProducts({ ...filters, status: 'PENDING' }, page, limit);
  }

  /**
   * Modère un produit (approuver/rejeter) - Admin uniquement
   * @param id - Identifiant du produit
   * @param data - Données de modération (status + rejectionReason optionnel)
   */
  async moderateProduct(
    id: string,
    data: { status: ProductStatus; rejectionReason?: string },
  ): Promise<Product> {
    this.isLoadingSignal.set(true);
    try {
      const product = await this.api.put<Product>(
        `/admin/products/${id}/validate`,
        data,
      );
      // Mettre à jour le produit dans la liste locale si présent
      this.productsSignal.update((products: Product[]) =>
        products.map((p: Product) => (p._id === id ? product : p)),
      );
      return product;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }
}
