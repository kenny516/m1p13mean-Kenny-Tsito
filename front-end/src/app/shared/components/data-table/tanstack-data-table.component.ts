import { CommonModule, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  TemplateRef,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import {
  createTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  type Row,
  type TableOptionsResolved,
  type RowData,
  type Updater,
} from '@tanstack/table-core';
import { ZardTableImports } from '@/shared/components/table';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import type { ZardIcon } from '@/shared/components/icon/icons';

// Étendre les types TanStack pour les métadonnées personnalisées
declare module '@tanstack/table-core' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    headerClass?: string;
    cellClass?: string;
  }
}

/**
 * Interface pour définir une colonne avec support de template personnalisé
 */
export interface DataTableColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T & string;
  accessorFn?: (row: T) => unknown;
  enableSorting?: boolean;
  meta?: {
    headerClass?: string;
    cellClass?: string;
  };
  // Pour le rendu personnalisé via template
  cellTemplate?: TemplateRef<{ $implicit: T; value: unknown }>;
}

export interface SortChangeEvent {
  column: string;
  direction: 'asc' | 'desc' | null;
}

/**
 * Interface pour le contexte d'un template de cellule
 */
export interface CellTemplateContext<T> {
  $implicit: T;
  value: unknown;
}

@Component({
  selector: 'app-tanstack-data-table',
  standalone: true,
  imports: [
    CommonModule,
    NgTemplateOutlet,
    ...ZardTableImports,
    ZardIconComponent,
    ZardSkeletonComponent,
  ],
  template: `
    <div class="overflow-x-auto rounded-md border border-border">
      <table z-table>
        <thead z-table-header>
          <tr z-table-row>
            @for (column of columnDefs(); track column.id) {
              <th
                z-table-head
                [class]="column.meta?.headerClass || ''"
                [class.cursor-pointer]="column.enableSorting !== false"
                [class.select-none]="column.enableSorting !== false"
                (click)="
                  column.enableSorting !== false && toggleSort(column.id)
                "
              >
                <div class="flex items-center gap-2">
                  <span>{{ column.header }}</span>
                  @if (column.enableSorting !== false) {
                    <span class="flex flex-col">
                      @if (getSortDirection(column.id) === 'asc') {
                        <z-icon
                          zType="chevron-up"
                          class="h-4 w-4 text-foreground"
                        />
                      } @else if (getSortDirection(column.id) === 'desc') {
                        <z-icon
                          zType="chevron-down"
                          class="h-4 w-4 text-foreground"
                        />
                      } @else {
                        <z-icon
                          zType="chevrons-up-down"
                          class="h-4 w-4 text-muted-foreground"
                        />
                      }
                    </span>
                  }
                </div>
              </th>
            }
            @if (rowActions()) {
              <th z-table-head class="text-right">{{ actionsLabel() }}</th>
            }
          </tr>
        </thead>

        <tbody z-table-body>
          @if (isLoading()) {
            <!-- État de chargement -->
            @for (i of loadingRows(); track i) {
              <tr z-table-row>
                @for (column of columnDefs(); track column.id) {
                  <td z-table-cell [class]="column.meta?.cellClass || ''">
                    <z-skeleton class="h-6 w-full" />
                  </td>
                }
                @if (rowActions()) {
                  <td z-table-cell class="text-right">
                    <z-skeleton class="h-8 w-20 ml-auto" />
                  </td>
                }
              </tr>
            }
          } @else {
            @for (row of tableRows(); track trackByRow($index, row)) {
              <tr z-table-row class="hover:bg-muted/50 transition-colors">
                @for (column of columnDefs(); track column.id) {
                  <td z-table-cell [class]="column.meta?.cellClass || ''">
                    @if (cellTemplates()[column.id]; as tpl) {
                      <ng-container
                        *ngTemplateOutlet="
                          tpl;
                          context: {
                            $implicit: row.original,
                            value: getCellValue(column, row.original),
                          }
                        "
                      />
                    } @else {
                      {{ renderCell(column, row.original) }}
                    }
                  </td>
                }
                @if (rowActions(); as actionsTpl) {
                  <td z-table-cell class="text-right">
                    <ng-container
                      *ngTemplateOutlet="
                        actionsTpl;
                        context: { $implicit: row.original }
                      "
                    />
                  </td>
                }
              </tr>
            } @empty {
              <tr z-table-row>
                <td
                  z-table-cell
                  [attr.colspan]="columnDefs().length + (rowActions() ? 1 : 0)"
                  class="py-12 text-center"
                >
                  <div class="flex flex-col items-center gap-2">
                    <z-icon
                      [zType]="emptyIcon()"
                      class="h-12 w-12 text-muted-foreground"
                    />
                    <p class="text-muted-foreground">{{ emptyMessage() }}</p>
                  </div>
                </td>
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  `,
})
export class TanstackDataTableComponent<T extends { _id?: string }> {
  // Inputs
  readonly data = input.required<T[]>();
  readonly columnDefs = input.required<DataTableColumnDef<T>[]>();
  readonly rowActions = input<TemplateRef<{ $implicit: T }> | null>(null);
  readonly actionsLabel = input('Actions');
  readonly emptyMessage = input('Aucune donnée disponible');
  readonly emptyIcon = input<ZardIcon>('inbox');
  readonly isLoading = input(false);
  readonly loadingRowCount = input(5);

  // Templates pour le rendu personnalisé des cellules
  readonly cellTemplates = input<
    Record<string, TemplateRef<CellTemplateContext<T>>>
  >({});

  // Outputs
  readonly sortChange = output<SortChangeEvent>();
  readonly rowClick = output<T>();

  // État interne du tri
  private sortingState = signal<SortingState>([]);

  // Tableau de skeleton pour le loading
  protected readonly loadingRows = computed(() =>
    Array.from({ length: this.loadingRowCount() }, (_, i) => i),
  );

  // Table TanStack
  private table = computed(() => {
    const columns: ColumnDef<T>[] = this.columnDefs().map((col) => ({
      id: col.id,
      header: col.header,
      accessorKey: col.accessorKey,
      accessorFn: col.accessorFn as ((row: T) => unknown) | undefined,
      enableSorting: col.enableSorting !== false,
      meta: col.meta,
    }));

    const options = {
      data: this.data(),
      columns,
      state: {
        sorting: this.sortingState(),
      },
      onStateChange: () => {
        // Requis par TanStack mais géré manuellement via onSortingChange
      },
      onSortingChange: (updater: Updater<SortingState>) => {
        const newState =
          typeof updater === 'function'
            ? updater(this.sortingState())
            : updater;
        this.sortingState.set(newState);

        // Émettre l'événement de tri
        if (newState.length > 0) {
          this.sortChange.emit({
            column: newState[0].id,
            direction: newState[0].desc ? 'desc' : 'asc',
          });
        } else {
          this.sortChange.emit({
            column: '',
            direction: null,
          });
        }
      },
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      // Désactiver le tri côté client car on utilise le tri serveur
      manualSorting: true,
      renderFallbackValue: null,
    } as TableOptionsResolved<T>;

    return createTable(options);
  });

  // Lignes de la table
  protected readonly tableRows = computed(() => {
    return this.table().getRowModel().rows;
  });

  /**
   * Basculer le tri sur une colonne
   */
  protected toggleSort(columnId: string): void {
    const currentSort = this.sortingState();
    const currentColSort = currentSort.find(
      (s: { id: string; desc: boolean }) => s.id === columnId,
    );

    let newSorting: SortingState;

    if (!currentColSort) {
      // Pas de tri sur cette colonne → tri ascendant
      newSorting = [{ id: columnId, desc: false }];
    } else if (!currentColSort.desc) {
      // Tri ascendant → tri descendant
      newSorting = [{ id: columnId, desc: true }];
    } else {
      // Tri descendant → pas de tri
      newSorting = [];
    }

    this.sortingState.set(newSorting);

    // Émettre l'événement
    if (newSorting.length > 0) {
      this.sortChange.emit({
        column: newSorting[0].id,
        direction: newSorting[0].desc ? 'desc' : 'asc',
      });
    } else {
      this.sortChange.emit({
        column: '',
        direction: null,
      });
    }
  }

  /**
   * Obtenir la direction de tri actuelle pour une colonne
   */
  protected getSortDirection(columnId: string): 'asc' | 'desc' | null {
    const sort = this.sortingState().find(
      (s: { id: string; desc: boolean }) => s.id === columnId,
    );
    if (!sort) return null;
    return sort.desc ? 'desc' : 'asc';
  }

  /**
   * Tracker pour les lignes
   */
  protected trackByRow(index: number, row: Row<T>): string | number {
    return row.original._id || index;
  }

  /**
   * Obtenir la valeur d'une cellule
   */
  protected getCellValue(column: DataTableColumnDef<T>, row: T): unknown {
    if (column.accessorFn) {
      return column.accessorFn(row);
    }
    if (column.accessorKey) {
      return row[column.accessorKey];
    }
    return undefined;
  }

  /**
   * Rendre une cellule en texte
   */
  protected renderCell(column: DataTableColumnDef<T>, row: T): string {
    const value = this.getCellValue(column, row);
    return this.stringifyValue(value);
  }

  /**
   * Convertir une valeur en chaîne
   */
  private stringifyValue(value: unknown): string {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'string' || typeof value === 'number')
      return String(value);
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (value instanceof Date) return value.toLocaleDateString('fr-FR');
    return JSON.stringify(value);
  }
}
