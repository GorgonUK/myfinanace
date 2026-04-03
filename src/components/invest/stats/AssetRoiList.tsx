import { useTranslation } from 'react-i18next';

import { InvestAsset } from '@/common/api/invest';
import { useMemo } from 'react';
import type { MyFinColumnDef } from '@/components/dashboard/Table/Types';
import { useGetLocalizedAssetType } from '../InvestUtilHooks.ts';
import MyFinStaticTable from '../../../components/MyFinStaticTable.tsx';
import { formatNumberAsCurrency } from '../../../utils/textUtils.ts';
import PercentageChip from '../../../components/PercentageChip.tsx';

type Props = {
  list: InvestAsset[];
};

const AssetRoiList = (props: Props) => {
  const { t } = useTranslation();

  const getLocalizedAssetType = useGetLocalizedAssetType();

  const filteredAssets = useMemo(() => {
    return props.list;
  }, [props.list]);

  const rows = useMemo(
    () =>
      props.list.map((asset) => ({
        id: asset.asset_id,
        name: { name: asset.name, type: asset.type },
        invested: {
          invested: asset.invested_value,
          pricePerUnit: asset.price_per_unit,
        },
        feesTaxes: asset.fees_taxes,
        currentValue: asset.current_value,
        currentYearRoi: asset,
        globalRoi: {
          absolute: asset.absolute_roi_value,
          percentage: asset.relative_roi_percentage,
        },
      })),
    [filteredAssets],
  );

  const columns: MyFinColumnDef[] = [
    {
      field: 'name',
      headerName: t('investments.name'),
      minWidth: 200,
      flex: 1,
      editable: false,
      sortable: false,
      renderCell: (params) => (
        <div className="py-2">
          <p className="text-base text-foreground">{params.value.name}</p>
          <p className="text-xs text-muted-foreground">
            {getLocalizedAssetType.invoke(params.value.type)}
            {params.value.broker}
          </p>
        </div>
      ),
    },
    {
      field: 'invested',
      headerName: t('investments.investedValue'),
      minWidth: 150,
      editable: false,
      sortable: false,
      renderCell: (params) => (
        <div className="flex flex-col gap-0.5">
          <p className="text-base text-foreground">
            {formatNumberAsCurrency(params.value.invested)}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('investments.perUnitPrice', {
              price: formatNumberAsCurrency(params.value.pricePerUnit),
            })}
          </p>
        </div>
      ),
    },
    {
      field: 'feesTaxes',
      headerName: t('investments.feesAndTaxes'),
      minWidth: 150,
      editable: false,
      sortable: false,
      renderCell: (params) => <p>{formatNumberAsCurrency(params.value)}</p>,
    },
    {
      field: 'currentValue',
      headerName: t('investments.currentValue'),
      minWidth: 120,
      editable: false,
      sortable: false,
      renderCell: (params) => <p>{formatNumberAsCurrency(params.value)}</p>,
    },
    {
      field: 'currentYearRoi',
      headerName: t('investments.currentYearROI'),
      minWidth: 150,
      editable: false,
      sortable: false,
      renderCell: (_params) => <i>{t('common.soon')}...</i>,
    },
    {
      field: 'globalRoi',
      headerName: t('investments.globalROI'),
      minWidth: 120,
      editable: false,
      sortable: false,
      renderCell: (params) => (
        <div className="flex flex-col items-center justify-center">
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

export default AssetRoiList;
