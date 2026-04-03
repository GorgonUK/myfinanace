import { Fragment } from 'react';
import { flexRender, type Row } from '@tanstack/react-table';
import { cn } from '@/common/shadcn/lib/utils';
import type { MyFinColumnDef, MyFinRow } from './Types.ts';

type Props = {
  row: Row<MyFinRow>;
  columns: MyFinColumnDef[];
  /** Inner cell padding wrapper (DataTable vs static use slightly different vertical padding). */
  innerCellClassName?: string;
};

function headerLabelForColumn(
  col: MyFinColumnDef | undefined,
  fallbackId: string,
): string {
  if (!col) return fallbackId;
  return col.headerName ?? col.field ?? fallbackId;
}

/** Below `lg`, only the first column is a table cell; others stack underneath with labels (see dashboard/TableExample). */
export function DataTableBodyCells({
  row,
  columns,
  innerCellClassName = 'flex min-h-[40px] items-center px-2 py-1',
}: Props) {
  const cells = row.getVisibleCells();
  const canStack = cells.length === columns.length && columns.length > 1;

  if (!canStack) {
    return (
      <>
        {cells.map((cell) => (
          <td key={cell.id} className="align-middle text-foreground">
            <div className={innerCellClassName}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          </td>
        ))}
      </>
    );
  }

  return (
    <>
      {cells.map((cell, cellIndex) => {
        if (cellIndex === 0) {
          return (
            <td key={cell.id} className="align-middle text-foreground">
              <div className="min-w-0">
                <div className={innerCellClassName}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
                <dl className="border-border/40 space-y-2 border-t px-2 pb-2 pt-2 lg:hidden">
                  {cells.slice(1).map((restCell, i) => {
                    const col = columns[i + 1];
                    const label = headerLabelForColumn(
                      col,
                      String(restCell.column.id),
                    );
                    return (
                      <Fragment key={restCell.id}>
                        <dt className="sr-only">{label}</dt>
                        <dd className="min-w-0">
                          <div className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide">
                            {label}
                          </div>
                          <div className="text-foreground mt-0.5 min-w-0 text-sm break-words">
                            {flexRender(
                              restCell.column.columnDef.cell,
                              restCell.getContext(),
                            )}
                          </div>
                        </dd>
                      </Fragment>
                    );
                  })}
                </dl>
              </div>
            </td>
          );
        }

        return (
          <td
            key={cell.id}
            className={cn(
              'hidden align-middle text-foreground lg:table-cell',
            )}
          >
            <div className={innerCellClassName}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          </td>
        );
      })}
    </>
  );
}
