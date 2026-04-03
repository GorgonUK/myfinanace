import React, { useCallback, useMemo, useState } from 'react';
import { debounce } from 'lodash';
import type { MyFinColumnDef } from '@/components/dashboard/Table/Types';
import { formatNumberAsCurrency } from '../../../utils/textUtils.ts';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MyFinStaticTable from '../../../components/MyFinStaticTable.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';

type Props = {
  list: YearByYearSearchableListItem[];
  isLoading: boolean;
};

export type YearByYearSearchableListItem = {
  name: string;
  amount: number;
};

const YearByYearSearchableList = (props: Props) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearchQuery = useMemo(() => debounce(setSearchQuery, 300), []);
  const filteredList = useMemo(() => {
    return props.list
      .filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  }, [props.list, searchQuery]);

  const rows = filteredList.map((item) => ({
    id: item.name + item.amount,
    name: item.name,
    amount: item.amount,
  }));

  const columns: MyFinColumnDef[] = [
    {
      field: 'name',
      headerName: t('investments.name'),
      minWidth: 50,
      flex: 1,
      editable: false,
      sortable: false,
      renderCell: (params) => `${params.value}`,
    },
    {
      field: 'amount',
      headerName: t('common.amount'),
      minWidth: 100,
      editable: false,
      sortable: false,
      align: 'right',
      renderCell: (params) => (
        <div className="my-2">{formatNumberAsCurrency(params.value)}</div>
      ),
    },
  ];

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      debouncedSearchQuery(event.target.value);
    },
    [debouncedSearchQuery],
  );

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 flex justify-end md:col-span-6 md:col-start-7">
        <div className="flex w-full max-w-sm flex-col gap-2">
          <Label htmlFor="year-by-year-search">{t('common.search')}</Label>
          <div className="relative">
            <Input
              id="year-by-year-search"
              onChange={handleSearchChange}
              className="pr-10"
            />
            <Search className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2" />
          </div>
        </div>
      </div>
      <div className="col-span-12 mt-2">
        <MyFinStaticTable
          isRefetching={props.isLoading}
          rows={rows}
          columns={columns}
          paginationModel={{ pageSize: 5 }}
        />
      </div>
    </div>
  );
};

export default YearByYearSearchableList;
