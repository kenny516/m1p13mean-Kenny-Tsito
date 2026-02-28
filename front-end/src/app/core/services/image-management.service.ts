import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Product, Shop, User } from '../models';

type AvatarType = 'user' | 'shop';

@Injectable({ providedIn: 'root' })
export class ImageManagementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  async uploadUserAvatar(_userId: string, file: File): Promise<User> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await firstValueFrom(
      this.http.put<ApiResponse<User>>(`${this.baseUrl}/auth/profile/avatar`, formData),
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Erreur lors de la mise à jour de l\'avatar');
    }

    return response.data;
  }

  async uploadShopAvatar(shopId: string, file: File): Promise<Shop> {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await firstValueFrom(
      this.http.put<ApiResponse<Shop>>(`${this.baseUrl}/shops/${shopId}/logo`, formData),
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Erreur lors de la mise à jour du logo boutique');
    }

    return response.data;
  }

  async uploadShopBanner(shopId: string, file: File): Promise<Shop> {
    const formData = new FormData();
    formData.append('banner', file);

    const response = await firstValueFrom(
      this.http.put<ApiResponse<Shop>>(`${this.baseUrl}/shops/${shopId}/banner`, formData),
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Erreur lors de la mise à jour de la bannière boutique');
    }

    return response.data;
  }

  async deleteAvatar(type: AvatarType, id: string): Promise<User | Shop> {
    const endpoint = type === 'user' ? '/auth/profile/avatar' : `/shops/${id}/logo`;

    const response = await firstValueFrom(
      this.http.delete<ApiResponse<User | Shop>>(`${this.baseUrl}${endpoint}`),
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Erreur lors de la suppression de l\'image');
    }

    return response.data;
  }

  async deleteShopBanner(shopId: string): Promise<Shop> {
    const response = await firstValueFrom(
      this.http.delete<ApiResponse<Shop>>(`${this.baseUrl}/shops/${shopId}/banner`),
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Erreur lors de la suppression de la bannière boutique');
    }

    return response.data;
  }

  async addProductImage(productId: string, _shopId: string, file: File): Promise<Product> {
    const formData = new FormData();
    formData.append('images', file);

    const response = await firstValueFrom(
      this.http.post<ApiResponse<Product>>(`${this.baseUrl}/products/${productId}/images`, formData),
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Erreur lors de l\'ajout de l\'image produit');
    }

    return response.data;
  }

  async deleteProductImage(productId: string, index: number): Promise<Product> {
    const response = await firstValueFrom(
      this.http.delete<ApiResponse<Product>>(`${this.baseUrl}/products/${productId}/image/${index}`),
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Erreur lors de la suppression de l\'image produit');
    }

    return response.data;
  }
}
