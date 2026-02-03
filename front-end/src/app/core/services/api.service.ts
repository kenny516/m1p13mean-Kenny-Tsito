import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { ApiResponse } from '../models';

/**
 * Service générique pour les appels API
 * Centralise toutes les requêtes HTTP vers le backend
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  /**
   * Effectue une requête GET
   * @param endpoint - Endpoint de l'API
   * @param params - Paramètres de requête optionnels
   * @returns Promise avec les données
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, { params }),
    );
    if (!response.success) {
      throw new Error(response.error?.message || 'Erreur inconnue');
    }
    return response.data as T;
  }

  /**
   * Effectue une requête POST
   * @param endpoint - Endpoint de l'API
   * @param data - Données à envoyer
   * @returns Promise avec les données
   */
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, data),
    );
    if (!response.success) {
      throw new Error(response.error?.message || 'Erreur inconnue');
    }
    return response.data as T;
  }

  /**
   * Effectue une requête PUT
   * @param endpoint - Endpoint de l'API
   * @param data - Données à envoyer
   * @returns Promise avec les données
   */
  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await firstValueFrom(
      this.http.put<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, data),
    );
    if (!response.success) {
      throw new Error(response.error?.message || 'Erreur inconnue');
    }
    return response.data as T;
  }

  /**
   * Effectue une requête PATCH
   * @param endpoint - Endpoint de l'API
   * @param data - Données à envoyer
   * @returns Promise avec les données
   */
  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await firstValueFrom(
      this.http.patch<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, data),
    );
    if (!response.success) {
      throw new Error(response.error?.message || 'Erreur inconnue');
    }
    return response.data as T;
  }

  /**
   * Effectue une requête DELETE
   * @param endpoint - Endpoint de l'API
   * @returns Promise avec les données
   */
  async delete<T>(endpoint: string): Promise<T> {
    const response = await firstValueFrom(
      this.http.delete<ApiResponse<T>>(`${this.baseUrl}${endpoint}`),
    );
    if (!response.success) {
      throw new Error(response.error?.message || 'Erreur inconnue');
    }
    return response.data as T;
  }

  /**
   * Effectue une requête GET complète (avec pagination)
   * @param endpoint - Endpoint de l'API
   * @param params - Paramètres de requête optionnels
   * @returns Promise avec la réponse complète
   */
  async getWithPagination<T>(
    endpoint: string,
    params?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, { params }),
    );
    return response;
  }
}
