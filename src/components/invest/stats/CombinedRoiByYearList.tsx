import { YearlyRoi } from '@/common/api/invest';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import type { MyFinColumnDef } from '@/components/dashboard/Table/Types';
import MyFinStaticTable from '../../../components/MyFinStaticTable.tsx';
import { formatNumberAsCurrency } from '../../../utils/textUtils.ts';
import PercentageChip from '../../../components/PercentageChip.tsx';

export type CombinedRoiByYearData = {
  year: number;
} & YearlyRoi;

type Props = {
  list: CombinedRoiByYearData[];
};

const CombinedRoiByYearList = (props: Props) => {
  const { t } = useTranslation();

  const filteredItems = useMemo(() => {
    return props.list;
  }, [props.list]);

  const rows = useMemo(
    () =>
      props.list
        .sort((a, b) => b.year - a.year)
        .map((item) => ({
          id: item.year,
          year: item.year,
          inflow: item.total_inflow,
          outflow: item.total_outflow,
          globalValue: item.ending_value,
          globalRoi: {
            percentage: item.roi_percentage,
            absolute: item.roi_value,
          },
        })),
    [filteredItems],
  );
  const columns: MyFinColumnDef[] = [
    {
      field: 'year',
      headerName: t('investments.year'),
      minWidth: 50,
      editable: false,
      sortable: false,
      renderCell: (params) => (
        <p className="py-2 text-sm text-foreground">{params.value}</p>
      ),
    },
    {
      field: 'inflow',
      headerName: t('investments.inflow'),
      minWidth: 100,
      flex: 1,
      editable: false,
      sortable: false,
      renderCell: (params) => `${formatNumberAsCurrency(params.value)}`,
    },
    {
      field: 'outflow',
      headerName: t('investments.outflow'),
      minWidth: 100,
      flex: 1,
      editable: false,
      sortable: false,
      renderCell: (params) => `${formatNumberAsCurrency(params.value ?? 0)}`,
    },
    {
      field: 'globalValue',
      headerName: t('investments.globalValue'),
      minWidth: 100,
      flex: 1,
      editable: false,
      sortable: false,
      renderCell: (params) => `${formatNumberAsCurrency(params.value)}`,
    },
    {
      field: 'globalRoi',
      headerName: t('investments.globalROI'),
      minWidth: 120,
      editable: false,
      sortable: false,
      renderCell: (params) => (
        <div className="flex flex-col items-center justify-center py-2">
          {formatNumberAsCurrency(params.value.absolute)} <br />
          <PercentageChip
            percentage={params.value.percentage}
            className="mt-0.5 text-[0.9em]"
          />
        </div>
      ),
    },
  ];

  return (
    <MyFinStaticTable
      rows={rows}
      columns={columns}
      paginationModel={{ pageSize: 5 }}
      isRefetching={false}
    />
  );
};

export default CombinedRoiByYearList;
