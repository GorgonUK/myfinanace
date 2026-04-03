import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/common/shadcn/lib/utils';
import { DataTableBodyCells } from './DataTableBodyCells.tsx';
import { NoRows } from './components/NoRows.tsx';
import { toColumnDefs } from './columnUtils.ts';
import type { DataTableProps } from './Types.ts';

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 50, 100] as const;

const DataTable = (props: DataTableProps) => {
  const { t } = useTranslation();
  const {
    isRefetching,
    rows,
    columns,
    itemCount,
    paginationModel,
    setPaginationModel,
    onRowClicked,
  } = props;

  const columnDefs = useMemo(() => toColumnDefs(columns), [columns]);

  const pageCount = Math.max(
    1,
    Math.ceil(itemCount / paginationModel.pageSize) || 1,
  );

  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
    rowCount: itemCount,
    getRowId: (row) => String(row.id),
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({
              pageIndex: paginationModel.page,
              pageSize: paginationModel.pageSize,
            })
          : updater;
      setPaginationModel({
        page: next.pageIndex,
        pageSize: next.pageSize,
      });
    },
    state: {
      pagination: {
        pageIndex: paginationModel.page,
        pageSize: paginationModel.pageSize,
      },
    },
  });

  const headerGroups = table.getHeaderGroups();
  const tableRows = table.getRowModel().rows;

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
                  style={{
                    minWidth: header.column.columnDef.size,
                  }}
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
        <tbody>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onRowClicked?.(BigInt(String(row.original.id)));
                  }
                }}
              >
                <DataTableBodyCells row={row} columns={columns} />
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
            value={paginationModel.pageSize}
            onChange={(e) => {
              const pageSize = Number(e.target.value);
              setPaginationModel({ page: 0, pageSize });
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
            {paginationModel.page * paginationModel.pageSize + 1}–
            {Math.min(
              (paginationModel.page + 1) * paginationModel.pageSize,
              itemCount,
            )}{' '}
            {t('common.of', { defaultValue: 'of' })} {itemCount}
          </span>
          <button
            type="button"
            className="border-input rounded-md border px-2 py-1 text-sm disabled:opacity-40"
            disabled={paginationModel.page <= 0}
            onClick={() =>
              setPaginationModel((m) => ({
                ...m,
                page: Math.max(0, m.page - 1),
              }))
            }
          >
            {t('common.previous', { defaultValue: 'Previous' })}
          </button>
          <button
            type="button"
            className="border-input rounded-md border px-2 py-1 text-sm disabled:opacity-40"
            disabled={paginationModel.page >= pageCount - 1}
            onClick={() =>
              setPaginationModel((m) => ({
                ...m,
                page: Math.min(pageCount - 1, m.page + 1),
              }))
            }
          >
            {t('common.next', { defaultValue: 'Next' })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(DataTable);
export { NoRows } from './components/NoRows.tsx';
