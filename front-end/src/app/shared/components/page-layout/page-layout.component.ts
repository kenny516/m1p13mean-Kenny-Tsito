import { Component, Input, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZardCardComponent } from '../card';

/**
 * Composant de layout de page uniforme
 * Utilise les constantes de design pour garantir la cohérence
 *
 * Usage:
 * <app-page-layout
 *   title="Titre de la page"
 *   description="Description optionnelle"
 *   [headerActions]="actionsTpl"
 * >
 *   <!-- Contenu de la page -->
 * </app-page-layout>
 */
@Component({
  selector: 'app-page-layout',
  standalone: true,
  imports: [CommonModule, ZardCardComponent],
  template: `
    <div class="min-h-screen bg-muted/30 py-8">
      <div [class]="containerClass">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 class="text-2xl font-bold text-foreground">{{ title }}</h1>
            @if (description) {
              <p class="mt-1 text-muted-foreground">{{ description }}</p>
            }
          </div>
          @if (headerActions) {
            <div class="mt-4 sm:mt-0 flex items-center gap-4">
              <ng-container *ngTemplateOutlet="headerActions"></ng-container>
            </div>
          }
        </div>

        <!-- Filtres (optionnel) -->
        @if (filters) {
          <z-card class="mb-6">
            <div class="p-4">
              <ng-container *ngTemplateOutlet="filters"></ng-container>
            </div>
          </z-card>
        }

        <!-- Contenu principal -->
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class PageLayoutComponent {
  @Input() title = '';
  @Input() description?: string;
  @Input() headerActions?: TemplateRef<unknown>;
  @Input() filters?: TemplateRef<unknown>;
  @Input() containerSize: 'default' | 'small' | 'large' = 'default';

  get containerClass(): string {
    const sizes = {
      default: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
      small: 'max-w-4xl mx-auto px-4 sm:px-6',
      large: 'max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8',
    };
    return sizes[this.containerSize];
  }
}
