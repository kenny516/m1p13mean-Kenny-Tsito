import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Review, CreateReviewRequest, UpdateReviewRequest, RatingStats } from '../models';
import { Pagination } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private api = inject(ApiService);

  /**
   * Récupère les avis d'un produit
   */
  async getProductReviews(
    productId: string,
    page = 1,
    limit = 10
  ): Promise<{ reviews: Review[]; pagination: Pagination }> {
    try {
      const response = await this.api.getWithPagination<Review[]>(
        `/products/${productId}/reviews`,
        { page: String(page), limit: String(limit) }
      );
      return {
        reviews: response.data || [],
        pagination: response.pagination || { page: 1, limit, total: 0, pages: 0 },
      };
    } catch {
      return { reviews: [], pagination: { page: 1, limit, total: 0, pages: 0 } };
    }
  }

  /**
   * Récupère les statistiques de rating d'un produit
   */
  async getRatingStats(productId: string): Promise<RatingStats> {
    return this.api.get<RatingStats>(`/products/${productId}/reviews/stats`);
  }

  /**
   * Créer un avis pour un produit
   */
  async createReview(productId: string, data: CreateReviewRequest): Promise<Review> {
    return this.api.post<Review>(`/products/${productId}/reviews`, data);
  }

  /**
   * Modifier son avis
   */
  async updateReview(reviewId: string, data: UpdateReviewRequest): Promise<Review> {
    return this.api.put<Review>(`/reviews/${reviewId}`, data);
  }

  /**
   * Supprimer son avis
   */
  async deleteReview(reviewId: string): Promise<void> {
    return this.api.delete<void>(`/reviews/${reviewId}`);
  }

  /**
   * Ajouter une réponse vendeur
   */
  async addSellerResponse(reviewId: string, comment: string): Promise<Review> {
    return this.api.post<Review>(`/reviews/${reviewId}/response`, { comment });
  }
}
