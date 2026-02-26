import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZardIconComponent, IconType } from '../icon';
import { ZardButtonComponent } from '../button';

/**
 * Composant d'état vide uniforme
 * Affiche un message et une action quand il n'y a pas de données
 *
 * Usage:
 * <app-empty-state
 *   icon="users"
 *   title="Aucun utilisateur trouvé"
 *   description="Modifiez vos filtres ou créez un nouvel utilisateur"
 *   [actionLabel]="'Créer un utilisateur'"
 *   (action)="onCreate()"
 * />
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, ZardIconComponent, ZardButtonComponent],
  template: `
    <div class="p-12 text-center">
      <z-icon
        [zType]="icon"
        class="mx-auto h-12 w-12 text-muted-foreground"
      />
      <h3 class="mt-4 text-lg font-medium text-foreground">{{ title }}</h3>
      @if (description) {
        <p class="mt-2 text-muted-foreground">{{ description }}</p>
      }
      @if (actionLabel) {
        <button z-button class="mt-4" (click)="onAction()">
          {{ actionLabel }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon: IconType = 'file-question';
  @Input() title = 'Aucun résultat';
  @Input() description?: string;
  @Input() actionLabel?: string;
  @Input() action?: () => void;

  onAction(): void {
    if (this.action) {
      this.action();
    }
  }
}
