import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ZardIconComponent } from '@/shared/components/icon';

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterLink, ZardIconComponent],
  template: `
    <nav class="flex items-center gap-1.5 text-sm">
      @for (item of items; track item.label; let last = $last) {
        @if (item.route && !last) {
          <a
            [routerLink]="item.route"
            class="text-muted-foreground hover:text-foreground transition-colors"
          >
            {{ item.label }}
          </a>
        } @else {
          <span [class]="last ? 'text-foreground font-medium' : 'text-muted-foreground'">
            {{ item.label }}
          </span>
        }
        @if (!last) {
          <z-icon zType="chevron-right" class="h-3.5 w-3.5 text-muted-foreground" />
        }
      }
    </nav>
  `,
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
}
