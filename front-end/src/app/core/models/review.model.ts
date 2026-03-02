/**
 * Interface pour un avis produit
 */
export interface Review {
  _id: string;
  productId: string;
  userId: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  rating: number;
  comment?: string;
  sellerResponse?: {
    comment: string;
    respondedAt: Date;
  };
  isVerifiedPurchase: boolean;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface pour créer un avis
 */
export interface CreateReviewRequest {
  rating: number;
  comment?: string;
}

/**
 * Interface pour modifier un avis
 */
export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
}

/**
 * Interface pour les statistiques de rating
 */
export interface RatingStats {
  average: number;
  total: number;
  distribution: Record<number, number>;
}
