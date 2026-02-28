import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { ZardButtonComponent } from '@/shared/components/button';

@Component({
  selector: 'app-file-picker',
  standalone: true,
  imports: [CommonModule, ZardButtonComponent],
  template: `
    <input
      #input
      type="file"
      class="hidden"
      [accept]="accept"
      [multiple]="multiple"
      (change)="onFileChange($event)"
    />

    <button
      z-button
      type="button"
      [zType]="buttonType"
      [disabled]="disabled"
      (click)="open()"
    >
      {{ label }}
    </button>
  `,
})
export class FilePickerComponent {
  @ViewChild('input', { static: true }) private inputRef!: ElementRef<HTMLInputElement>;

  @Input() accept = 'image/*';
  @Input() label = 'Changer la photo';
  @Input() disabled = false;
  @Input() multiple = false;
  @Input() buttonType: 'default' | 'outline' | 'destructive' | 'ghost' | 'link' = 'outline';

  @Output() fileSelected = new EventEmitter<File>();
  @Output() filesSelected = new EventEmitter<File[]>();

  open(): void {
    if (!this.disabled) {
      this.inputRef.nativeElement.click();
    }
  }

  onFileChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files || []);
    const file = files[0];

    if (files.length > 0) {
      this.filesSelected.emit(files);
    }

    if (file) {
      this.fileSelected.emit(file);
    }

    target.value = '';
  }
}
