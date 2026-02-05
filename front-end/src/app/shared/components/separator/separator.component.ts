import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Composant Separator pour séparer visuellement des éléments
 */
@Component({
  selector: 'z-separator',
  standalone: true,
  imports: [CommonModule],
  template: ``,
  host: {
    '[class]': 'classes',
    role: 'separator',
    '[attr.aria-orientation]': 'orientation',
  },
})
export class ZardSeparatorComponent {
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';

  get classes(): string {
    const base = 'shrink-0 bg-border';
    return this.orientation === 'horizontal'
      ? `${base} h-[1px] w-full`
      : `${base} h-full w-[1px]`;
  }
}
