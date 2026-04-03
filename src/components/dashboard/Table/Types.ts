import type React from 'react';

/** Row id as stored in grid data (matches prior DataGrid flexibility). */
export type MyFinRowId = bigint | number | string;

/** Row shape for data tables. */
export type MyFinRow = Record<string, unknown> & { id: MyFinRowId };

export type MyFinRenderCellParams<TData extends MyFinRow = MyFinRow> = {
  id: MyFinRowId;
  field: string;
  /** Cell value (same as MUI DataGrid `params.value`). */
  value: any;
  row: TData;
};

export type MyFinColumnDef<TData extends MyFinRow = MyFinRow> = {
  field: string;
  headerName?: string;
  /** MUI DataGrid-style custom header (e.g. import mapping selects). */
  renderHeader?: (params?: unknown) => React.ReactNode;
  flex?: number;
  minWidth?: number;
  width?: number;
  filterable?: boolean;
  align?: 'left' | 'right' | 'center';
  editable?: boolean;
  sortable?: boolean;
  renderCell?: (params: MyFinRenderCellParams<TData>) => React.ReactNode;
};

export type MyFinRowsProp = MyFinRow[];

export type DataTableProps = {
  isRefetching: boolean;
  rows: MyFinRowsProp;
  columns: MyFinColumnDef[];
  itemCount: number;
  paginationModel: { pageSize: number; page: number };
  setPaginationModel: React.Dispatch<
    React.SetStateAction<{ pageSize: number; page: number }>
  >;
  onRowClicked?: (id: bigint) => void;
};

export type MyFinStaticTableProps = {
  isRefetching: boolean;
  rows: MyFinRowsProp;
  columns: MyFinColumnDef[];
  paginationModel: { pageSize: number; page?: number };
  onRowClicked?: (id: bigint) => void;
  onPaginationModelChange?: (model: { pageSize: number; page: number }) => void;
  scrollToId?: number | string;
};
