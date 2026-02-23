import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { Component, TemplateRef, computed, input } from '@angular/core';
import { ZardTableImports } from '@/shared/components/table';

export interface DataTableColumn {
  id?: string;
  header: string;
  accessorKey?: string;
  accessorFn?: (row: unknown) => unknown;
  cell?: (row: unknown) => unknown;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, NgTemplateOutlet, ...ZardTableImports],
  template: `
    <div class="overflow-x-auto rounded-md border border-border">
      <table z-table>
        <thead z-table-header>
          <tr z-table-row>
            @for (column of columns(); track column.id || column.header) {
              <th z-table-head>{{ column.header }}</th>
            }
            @if (rowActions()) {
              <th z-table-head class="text-right">{{ actionsLabel() }}</th>
            }
          </tr>
        </thead>

        <tbody z-table-body>
          @for (row of data(); track trackByRow($index, row)) {
            <tr z-table-row>
              @for (column of columns(); track column.id || column.header) {
                <td z-table-cell>
                  {{ renderCell(column, row) }}
                </td>
              }
              @if (rowActions(); as actionsTpl) {
                <td z-table-cell class="text-right">
                  <ng-container
                    *ngTemplateOutlet="actionsTpl; context: { $implicit: row }"
                  />
                </td>
              }
            </tr>
          } @empty {
            <tr z-table-row>
              <td
                z-table-cell
                [attr.colspan]="columns().length + (rowActions() ? 1 : 0)"
                class="py-8 text-center text-muted-foreground"
              >
                {{ emptyMessage() }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class DataTableComponent {
  readonly data = input.required<unknown[]>();
  readonly columns = input.required<DataTableColumn[]>();
  readonly rowActions = input<TemplateRef<{ $implicit: unknown }> | null>(null);
  readonly actionsLabel = input('Actions');
  readonly emptyMessage = input('Aucune donnée disponible');

  readonly hasRows = computed(() => this.data().length > 0);

  protected trackByRow(index: number, row: unknown): string | number {
    if (row && typeof row === 'object' && '_id' in (row as Record<string, unknown>)) {
      const id = (row as Record<string, unknown>)['_id'];
      if (typeof id === 'string' || typeof id === 'number') {
        return id;
      }
    }
    return index;
  }

  protected renderCell(column: DataTableColumn, row: unknown): string {
    if (column.cell) {
      return this.stringifyCell(column.cell(row));
    }

    if (column.accessorFn) {
      return this.stringifyCell(column.accessorFn(row));
    }

    if (column.accessorKey && row && typeof row === 'object') {
      return this.stringifyCell((row as Record<string, unknown>)[column.accessorKey]);
    }

    return '-';
  }

  private stringifyCell(value: unknown): string {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    return JSON.stringify(value);
  }
}
