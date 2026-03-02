import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Settings, UpdateSettingsDto } from '../models/settings.model';

/**
 * Service de gestion des paramètres de la plateforme (Admin)
 * Fournit les méthodes pour récupérer et mettre à jour les settings
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private api = inject(ApiService);

  // Signals pour l'état réactif
  private settingsSignal = signal<Settings | null>(null);
  private isLoadingSignal = signal(false);
  private isSavingSignal = signal(false);

  // Computeds publics
  readonly settings = this.settingsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly isSaving = this.isSavingSignal.asReadonly();

  /**
   * Récupère les paramètres de la plateforme
   */
  async getSettings(): Promise<Settings> {
    this.isLoadingSignal.set(true);
    try {
      const settings = await this.api.get<Settings>('/settings');
      this.settingsSignal.set(settings);
      return settings;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Met à jour les paramètres de la plateforme
   */
  async updateSettings(data: UpdateSettingsDto): Promise<Settings> {
    this.isSavingSignal.set(true);
    try {
      const settings = await this.api.put<Settings>('/admin/settings', data);
      this.settingsSignal.set(settings);
      return settings;
    } finally {
      this.isSavingSignal.set(false);
    }
  }

  /**
   * Met à jour un paramètre spécifique
   */
  async updateSetting<K extends keyof UpdateSettingsDto>(
    key: K,
    value: UpdateSettingsDto[K],
  ): Promise<Settings> {
    return this.updateSettings({ [key]: value } as UpdateSettingsDto);
  }

  /**
   * Récupère la valeur actuelle d'un paramètre (depuis le cache)
   */
  getSetting<K extends keyof Settings>(key: K): Settings[K] | undefined {
    return this.settingsSignal()?.[key];
  }

  /**
   * Réinitialise le cache des settings
   */
  clearCache(): void {
    this.settingsSignal.set(null);
  }
}
