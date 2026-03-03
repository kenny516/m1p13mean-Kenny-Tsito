import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  input,
} from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-rating-stars",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-0.5" [class.cursor-pointer]="interactive">
      @for (star of stars(); track star.index) {
        <button
          type="button"
          [disabled]="!interactive"
          (click)="onStarClick(star.index)"
          (mouseenter)="onStarHover(star.index)"
          (mouseleave)="onStarLeave()"
          class="p-0.5 transition-transform disabled:cursor-default"
          [class.hover:scale-110]="interactive"
        >
          <svg
            [class]="'w-' + size + ' h-' + size"
            viewBox="0 0 24 24"
            [attr.fill]="star.filled ? fillColor : 'none'"
            [attr.stroke]="star.filled ? fillColor : strokeColor"
            stroke-width="1.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
        </button>
      }
      @if (showValue && !interactive) {
        <span class="ml-1 text-sm text-muted-foreground">
          ({{ value().toFixed(1) }})
        </span>
      }
    </div>
  `,
})
export class RatingStarsComponent {
  // Utiliser input() signal pour que computed() détecte les changements de valeur
  value = input(0);
  @Input() interactive = false;
  @Input() size: "4" | "5" | "6" = "5";
  @Input() showValue = false;
  @Input() fillColor = "rgb(250, 204, 21)"; // yellow-400
  @Input() strokeColor = "rgb(156, 163, 175)"; // gray-400

  @Output() ratingChange = new EventEmitter<number>();

  private hoverIndex = signal<number | null>(null);

  stars = computed(() => {
    const currentValue = this.hoverIndex() ?? this.value();
    return [1, 2, 3, 4, 5].map((index) => ({
      index,
      filled: index <= currentValue,
    }));
  });

  onStarClick(index: number): void {
    if (this.interactive) {
      this.ratingChange.emit(index);
    }
  }

  onStarHover(index: number): void {
    if (this.interactive) {
      this.hoverIndex.set(index);
    }
  }

  onStarLeave(): void {
    if (this.interactive) {
      this.hoverIndex.set(null);
    }
  }
}
