import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Composant Label simple pour les formulaires
 * Remplace les labels HTML natifs avec un style cohérent
 */
@Component({
  selector: 'z-label',
  standalone: true,
  imports: [CommonModule],
  template: `
    <label
      [attr.for]="for || null"
      class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    >
      <ng-content></ng-content>
    </label>
  `,
  host: {
    class: 'block',
  },
})
export class ZardLabelComponent {
  @Input() for = '';
}
