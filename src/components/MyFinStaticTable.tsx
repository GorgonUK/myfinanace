import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { memo, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/common/shadcn/lib/utils';
import { DataTableBodyCells } from './dashboard/Table/DataTableBodyCells.tsx';
import { NoRows } from './dashboard/Table/components/NoRows.tsx';
import { toColumnDefs } from './dashboard/Table/columnUtils.ts';
import type { MyFinStaticTableProps } from './dashboard/Table/Types.ts';

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 50, 100] as const;

const MyFinStaticTable = (props: MyFinStaticTableProps) => {
  const { t } = useTranslation();
  const {
    isRefetching,
    rows,
    columns,
    paginationModel,
    onPaginationModelChange,
    scrollToId,
    onRowClicked,
  } = props;

  const tableRef = useRef<HTMLTableSectionElement>(null);

  const columnDefs = useMemo(() => toColumnDefs(columns), [columns]);

  const pageIndex = paginationModel.page ?? 0;
  const pageSize = paginationModel.pageSize;

  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => String(row.id),
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({ pageIndex, pageSize })
          : updater;
      onPaginationModelChange?.({
        page: next.pageIndex,
        pageSize: next.pageSize,
      });
    },
    state: {
      pagination: {
        pageIndex,
        pageSize,
      },
    },
  });

  const tableRows = table.getRowModel().rows;
  const pageCount = table.getPageCount();

  useEffect(() => {
    if (scrollToId == null || scrollToId === '') return;
    const el = tableRef.current?.querySelector(
      `[data-row-id="${String(scrollToId)}"]`,
    );
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [scrollToId, rows]);

  const headerGroups = table.getHeaderGroups();

  return (
    <div className="relative flow-root w-full min-w-0 overflow-x-auto lg:overflow-x-visible">
      {isRefetching && (
        <div
          className="absolute left-0 right-0 top-0 z-10 h-1 overflow-hidden bg-muted"
          aria-busy="true"
        >
          <div className="h-full w-full animate-pulse bg-primary/50" />
        </div>
      )}
      <table className="min-w-full w-full border-collapse text-sm lg:table-fixed lg:w-auto">
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header, headerIndex) => (
                <th
                  key={header.id}
                  className={cn(
                    'border-b border-border bg-muted/80 px-2 py-3 text-left align-bottom text-sm font-bold text-foreground',
                    headerIndex > 0 && 'hidden lg:table-cell',
                  )}
                  style={{ minWidth: header.column.columnDef.size }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody ref={tableRef}>
          {tableRows.length === 0 && !isRefetching ? (
            <tr>
              <td colSpan={columns.length} className="p-0">
                <NoRows />
              </td>
            </tr>
          ) : (
            tableRows.map((row) => (
              <tr
                key={row.id}
                data-row-id={String(row.original.id)}
                className={
                  row.original.highlight === true
                    ? 'cursor-pointer bg-gradient-to-t from-[#0083B0] to-[#00B4DB] hover:bg-blue-600'
                    : 'cursor-pointer border-b border-border/40 bg-background hover:bg-muted/60'
                }
                onClick={() =>
                  onRowClicked?.(BigInt(String(row.original.id)))
                }
              >
                <DataTableBodyCells
                  row={row}
                  columns={columns}
                  innerCellClassName="flex min-h-[40px] items-center px-2 py-1.5"
                />
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="flex flex-col gap-2 border-t border-border px-2 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {t('common.rowsPerPage', { defaultValue: 'Rows per page' })}
          </span>
          <select
            className="border-input bg-background rounded-md border px-2 py-1 text-sm"
            value={pageSize}
            onChange={(e) => {
              const next = Number(e.target.value);
              onPaginationModelChange?.({ page: 0, pageSize: next });
            }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {rows.length === 0
              ? `0 ${t('common.of', { defaultValue: 'of' })} 0`
              : `${pageIndex * pageSize + 1}–${Math.min((pageIndex + 1) * pageSize, rows.length)} ${t('common.of', { defaultValue: 'of' })} ${rows.length}`}
          </span>
          <button
            type="button"
            className="border-input rounded-md border px-2 py-1 text-sm disabled:opacity-40"
            disabled={pageIndex <= 0}
            onClick={() => table.previousPage()}
          >
            {t('common.previous', { defaultValue: 'Previous' })}
          </button>
          <button
            type="button"
            className="border-input rounded-md border px-2 py-1 text-sm disabled:opacity-40"
            disabled={pageIndex >= pageCount - 1}
            onClick={() => table.nextPage()}
          >
            {t('common.next', { defaultValue: 'Next' })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(MyFinStaticTable);
