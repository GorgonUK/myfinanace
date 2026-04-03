import { debounce } from 'lodash';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Transaction } from '@/common/api/trx';
import { Card, CardContent } from '@/common/shadcn/ui/card';
import { useGetTransactions, useRemoveTransaction } from '@/hooks/trx';
import GenericConfirmationDialog from '@/components/GenericConfirmationDialog.tsx';
import DataTable from '@/components/DataTable.tsx';
import { useLoading } from '@/providers/LoadingProvider';
import { ROUTE_IMPORT_TRX } from '@/providers/RoutesProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '@/providers/SnackbarProvider.tsx';
import AddEditTransactionDialog from './AddEditTransactionDialog.tsx';
import { TransactionsToolbar } from './TransactionsToolbar';
import { useTransactionColumns } from './useTransactionColumns';
import { useTransactionRows } from './useTransactionRows';

const Transactions = () => {
  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 20,
    page: 0,
  });
  const [actionableTransaction, setActionableTransaction] =
    useState<Transaction | null>(null);
  const [isRemoveDialogOpen, setRemoveDialogOpen] = useState(false);
  const [isAddEditDialogOpen, setEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const getTransactionsRequest = useGetTransactions(
    paginationModel.page,
    paginationModel.pageSize,
    searchQuery,
  );
  const removeTransactionRequest = useRemoveTransaction();
  const debouncedSearchQuery = useMemo(() => debounce(setSearchQuery, 300), []);

  useEffect(
    () => () => {
      debouncedSearchQuery.cancel();
    },
    [debouncedSearchQuery],
  );

  useEffect(() => {
    if (getTransactionsRequest.isLoading) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [getTransactionsRequest.isLoading]);

  useEffect(() => {
    if (getTransactionsRequest.isError || removeTransactionRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [getTransactionsRequest.isError, removeTransactionRequest.isError]);

  useEffect(() => {
    if (isRemoveDialogOpen === false && isAddEditDialogOpen === false) {
      setActionableTransaction(null);
    }
  }, [isAddEditDialogOpen, isRemoveDialogOpen]);

  const removeTransaction = useCallback(() => {
    if (!actionableTransaction) return;
    removeTransactionRequest.mutate(actionableTransaction.transaction_id);
    setRemoveDialogOpen(false);
  }, [actionableTransaction, removeTransactionRequest]);

  const handleEditTransactionClick = useCallback((trx: Transaction) => {
    setActionableTransaction(trx);
    setEditDialogOpen(true);
  }, []);

  const handleRemoveTransactionClick = useCallback((trx: Transaction) => {
    setActionableTransaction(trx);
    setRemoveDialogOpen(true);
  }, []);

  const handleImportTransactionsClick = useCallback(() => {
    navigate(ROUTE_IMPORT_TRX);
  }, [navigate]);

  const handleAddTransactionClick = useCallback(() => {
    setEditDialogOpen(true);
  }, []);

  const columns = useTransactionColumns(
    handleEditTransactionClick,
    handleRemoveTransactionClick,
  );

  const trxData = getTransactionsRequest.data;
  const rows = useTransactionRows(trxData);

  if (getTransactionsRequest.isLoading || !trxData) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-[min(100%,1800px)] px-3 py-4 sm:px-4 md:p-6">
      <Card className="border-border/80 shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-6">
          {isAddEditDialogOpen && (
            <AddEditTransactionDialog
              isOpen={isAddEditDialogOpen}
              onClose={() => setEditDialogOpen(false)}
              onPositiveClick={() => setEditDialogOpen(false)}
              onNegativeClick={() => setEditDialogOpen(false)}
              transaction={actionableTransaction}
            />
          )}
          {isRemoveDialogOpen && (
            <GenericConfirmationDialog
              isOpen={isRemoveDialogOpen}
              onClose={() => setRemoveDialogOpen(false)}
              onPositiveClick={() => removeTransaction()}
              onNegativeClick={() => setRemoveDialogOpen(false)}
              titleText={t('transactions.deleteTransactionModalTitle', {
                id: actionableTransaction?.transaction_id,
              })}
              descriptionText={t('transactions.deleteTransactionModalSubtitle')}
              positiveText={t('common.delete')}
            />
          )}
          <TransactionsToolbar
            debouncedSearch={debouncedSearchQuery}
            onAddTransaction={handleAddTransactionClick}
            onImportTransactions={handleImportTransactionsClick}
            table={
              <DataTable
                isRefetching={getTransactionsRequest.isRefetching}
                rows={rows}
                columns={columns}
                itemCount={trxData.filtered_count}
                paginationModel={paginationModel}
                setPaginationModel={setPaginationModel}
                onRowClicked={(id) => {
                  const trx = trxData.results.find(
                    (row: Transaction) => row.transaction_id === id,
                  );
                  if (trx) {
                    handleEditTransactionClick(trx);
                  }
                }}
              />
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default memo(Transactions);
