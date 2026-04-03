import type { ColumnDef } from '@tanstack/react-table';
import type { MyFinColumnDef, MyFinRow } from './Types.ts';

export function toColumnDefs(columns: MyFinColumnDef[]): ColumnDef<MyFinRow>[] {
  return columns.map((col) => ({
    id: col.field,
    accessorKey: col.field,
    header:
      col.renderHeader != null
        ? () => col.renderHeader?.({})
        : (col.headerName ?? col.field),
    cell: ({ row, getValue }) => {
      const value = getValue();
      const rendered = col.renderCell?.({
        id: row.original.id,
        field: col.field,
        value,
        row: row.original,
      });
      if (rendered !== undefined) return rendered;
      if (value == null) return '';
      if (typeof value === 'object') return '';
      return String(value);
    },
    size: col.width ?? col.minWidth ?? 80,
  }));
}
