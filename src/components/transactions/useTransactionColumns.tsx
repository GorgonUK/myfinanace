import type { MyFinColumnDef } from '@/components/dashboard/Table/Types';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Transaction } from '@/common/api/trx';
import { TransactionActionsCell } from './cells/ActionsCell';
import { TransactionDateCell } from './cells/DateCell';
import { TransactionCategoryCell } from './cells/CategoryCell';
import { TransactionDescriptionCell } from './cells/DescriptionCell';
import { TransactionEntityCell } from './cells/EntityCell';
import { TransactionFlowCell } from './cells/FlowCell';
import { TransactionValueCell } from './cells/ValueCell';
export function useTransactionColumns(
  handleEditTransactionClick: (trx: Transaction) => void,
  handleRemoveTransactionClick: (trx: Transaction) => void,
): MyFinColumnDef[] {
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        field: 'date',
        headerName: t('common.date'),
        flex: 100,
        minWidth: 100,
        editable: false,
        sortable: false,
        renderCell: (params) => <TransactionDateCell params={params} />,
      },
      {
        field: 'flow',
        headerName: t('transactions.flow'),
        flex: 200,
        minWidth: 200,
        editable: false,
        sortable: false,
        renderCell: (params) => <TransactionFlowCell params={params} />,
      },
      {
        field: 'description',
        headerName: t('common.description'),
        flex: 400,
        minWidth: 240,
        editable: false,
        sortable: false,
        renderCell: (params) => (
          <TransactionDescriptionCell params={params} />
        ),
      },
      {
        field: 'category',
        headerName: t('transactions.category'),
        flex: 180,
        minWidth: 140,
        editable: false,
        sortable: false,
        renderCell: (params) => <TransactionCategoryCell params={params} />,
      },
      {
        field: 'entity',
        headerName: t('transactions.entity'),
        flex: 180,
        minWidth: 140,
        editable: false,
        sortable: false,
        renderCell: (params) => <TransactionEntityCell params={params} />,
      },
      {
        field: 'value',
        headerName: t('common.value'),
        flex: 170,
        minWidth: 100,
        editable: false,
        sortable: false,
        renderCell: (params) => <TransactionValueCell params={params} />,
      },
      {
        field: 'actions',
        headerName: t('common.actions'),
        flex: 150,
        minWidth: 100,
        editable: false,
        sortable: false,
        renderCell: (params) => (
          <TransactionActionsCell
            params={params}
            onEdit={handleEditTransactionClick}
            onRemove={handleRemoveTransactionClick}
          />
        ),
      },
    ],
    [t, handleEditTransactionClick, handleRemoveTransactionClick],
  );
}
