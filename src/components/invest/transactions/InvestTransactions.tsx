import { useTranslation } from 'react-i18next';
import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import { CirclePlus, Pencil, Search, Trash2 } from 'lucide-react';
import {
  InvestAsset,
  InvestTransaction,
  InvestTransactionsPageResponse,
  InvestTransactionType,
} from '@/common/api/invest';
import { useGetInvestTransactions, useRemoveInvestTransaction } from '@/hooks/invest';
import DataTable from '../../../components/DataTable.tsx';
import { useLoading } from '../../../providers/LoadingProvider.tsx';
import { AlertSeverity, useSnackbar } from '../../../providers/SnackbarProvider.tsx';
import { debounce } from 'lodash';
import type { MyFinColumnDef } from '@/components/dashboard/Table/Types';
import {
  getDayNumberFromUnixTimestamp,
  getMonthShortStringFromUnixTimestamp,
  getShortYearFromUnixTimestamp,
} from '../../../utils/dateUtils.ts';
import { useGetLocalizedAssetType, useGetLocalizedInvestTransactionType } from '../InvestUtilHooks.ts';
import { formatNumberAsCurrency } from '../../../utils/textUtils.ts';
import AddEditInvestTransactionDialog from './AddEditInvestTransactionDialog.tsx';
import GenericConfirmationDialog from '../../../components/GenericConfirmationDialog.tsx';
import UpdateAssetValueDialog from '../assets/UpdateAssetValueDialog.tsx';
import AssetValueHistoryDrawer from '../assets/AssetValueHistoryDrawer.tsx';
import dayjs from 'dayjs';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
import { Badge } from '@/common/shadcn/ui/badge.tsx';
import { cn } from '@/common/shadcn/lib/utils';

type UiState = {
  isLoading: boolean;
  paginationModel: { pageSize: number; page: number };
  searchQuery: string;
  page?: InvestTransactionsPageResponse;
  actionableTransaction?: InvestTransaction;
  actionableAsset?: InvestAsset;
  isAddEditDialogOpen: boolean;
  isRemoveDialogOpen: boolean;
  isUpdateAssetValueDialogOpen: boolean;

  // Backdated transaction handling
  isBackdatedTrxDisclaimerOpen: boolean;
  pendingHistoryHighlightMonth?: number;
  pendingHistoryHighlightYear?: number;
  pendingHistoryAssetId?: bigint;
  pendingHistoryAssetName?: string;

  isHistoryDrawerOpen: boolean;
  historyDrawerAssetId?: bigint;
  historyDrawerAssetName?: string;
  historyDrawerHighlightMonth?: number;
  historyDrawerHighlightYear?: number;
};

const enum StateActionType {
  RequestStarted,
  RequestSuccess,
  RequestError,
  PaginationModelChanged,
  SearchQueryUpdated,
  AddClick,
  EditClick,
  RemoveClick,
  DialogDismissed,
  DialogSuccess,
  OpenBackdatedDisclaimer,
  OpenHistoryDrawer,
  CloseHistoryDrawer,
}

type StateAction =
  | {
  type: StateActionType.RequestSuccess;
  payload: InvestTransactionsPageResponse;
}
  | { type: StateActionType.RequestError }
  | { type: StateActionType.RequestStarted }
  | { type: StateActionType.SearchQueryUpdated; payload: string }
  | { type: StateActionType.AddClick }
  | { type: StateActionType.EditClick; payload: InvestTransaction }
  | { type: StateActionType.RemoveClick; payload: InvestTransaction }
  | { type: StateActionType.DialogDismissed }
  | {
  type: StateActionType.DialogSuccess;
  payload: {
    asset: InvestAsset;
    checkDate: number;
    prevDate?: number;
  };
}
  | {
  type: StateActionType.PaginationModelChanged;
  payload: { pageSize: number; page: number };
}
  | { type: StateActionType.OpenBackdatedDisclaimer }
  | { type: StateActionType.OpenHistoryDrawer }
  | { type: StateActionType.CloseHistoryDrawer };

const createInitialState = (): UiState => {
  return {
    isLoading: true,
    paginationModel: { pageSize: 20, page: 0 },
    searchQuery: '',
    isAddEditDialogOpen: false,
    isRemoveDialogOpen: false,
    isUpdateAssetValueDialogOpen: false,
    isBackdatedTrxDisclaimerOpen: false,
    isHistoryDrawerOpen: false,
  };
};

const reduceState = (prevState: UiState, action: StateAction): UiState => {
  switch (action.type) {
    case StateActionType.RequestSuccess:
      return {
        ...prevState,
        page: action.payload,
        isLoading: false,
      };
    case StateActionType.RequestError:
      return {
        ...prevState,
        isLoading: false,
      };
    case StateActionType.RequestStarted:
      return {
        ...prevState,
        isLoading: true,
      };
    case StateActionType.PaginationModelChanged:
      return {
        ...prevState,
        paginationModel: action.payload,
      };
    case StateActionType.SearchQueryUpdated:
      return {
        ...prevState,
        searchQuery: action.payload,
      };
    case StateActionType.AddClick:
      return {
        ...prevState,
        isAddEditDialogOpen: true,
        isRemoveDialogOpen: false,
        actionableTransaction: undefined,
      };
    case StateActionType.EditClick:
      return {
        ...prevState,
        isAddEditDialogOpen: true,
        isRemoveDialogOpen: false,
        actionableTransaction: action.payload,
      };
    case StateActionType.RemoveClick:
      return {
        ...prevState,
        isAddEditDialogOpen: false,
        isRemoveDialogOpen: true,
        actionableTransaction: action.payload,
      };
    case StateActionType.DialogDismissed:
      return {
        ...prevState,
        isAddEditDialogOpen: false,
        isRemoveDialogOpen: false,
        isUpdateAssetValueDialogOpen: false,
        isBackdatedTrxDisclaimerOpen: false,
        actionableTransaction: undefined,
        actionableAsset: undefined,
      };
    case StateActionType.DialogSuccess: {
      const { asset, checkDate, prevDate } = action.payload;
      const now = dayjs();
      const currentMonth = now.month();
      const currentYear = now.year();

      const checkD = dayjs.unix(checkDate);
      const isCheckBackdated =
        checkD.month() !== currentMonth || checkD.year() !== currentYear;

      let isPrevBackdated = false;
      if (prevDate) {
        const prevD = dayjs.unix(prevDate);
        isPrevBackdated =
          prevD.month() !== currentMonth || prevD.year() !== currentYear;
      }

      if (isCheckBackdated || isPrevBackdated) {
        // Determine earliest date for highlighting
        let targetTs = checkDate;
        if (prevDate && prevDate < checkDate) {
          targetTs = prevDate;
        }
        const targetD = dayjs.unix(targetTs);

        return {
          ...prevState,
          isAddEditDialogOpen: false,
          isRemoveDialogOpen: false,
          isUpdateAssetValueDialogOpen: false,
          isBackdatedTrxDisclaimerOpen: true,
          actionableAsset: asset,
          pendingHistoryAssetId: asset.asset_id,
          pendingHistoryAssetName: asset.name,
          pendingHistoryHighlightMonth: targetD.month() + 1,
          pendingHistoryHighlightYear: targetD.year(),
        };
      }

      return {
        ...prevState,
        isAddEditDialogOpen: false,
        isRemoveDialogOpen: false,
        isUpdateAssetValueDialogOpen: true,
        actionableAsset: asset,
      };
    }
    case StateActionType.OpenBackdatedDisclaimer:
      // Helper action if needed, but DialogSuccess handles the logic
      return prevState;
    case StateActionType.OpenHistoryDrawer:
      return {
        ...prevState,
        isBackdatedTrxDisclaimerOpen: false,
        isHistoryDrawerOpen: true,
        historyDrawerAssetId: prevState.pendingHistoryAssetId,
        historyDrawerAssetName: prevState.pendingHistoryAssetName,
        historyDrawerHighlightMonth: prevState.pendingHistoryHighlightMonth,
        historyDrawerHighlightYear: prevState.pendingHistoryHighlightYear,
      };
    case StateActionType.CloseHistoryDrawer:
      return {
        ...prevState,
        isHistoryDrawerOpen: false,
        historyDrawerAssetId: undefined,
        historyDrawerAssetName: undefined,
        historyDrawerHighlightMonth: undefined,
        historyDrawerHighlightYear: undefined,
      };
    default:
      return prevState;
  }
};

const InvestTransactions = () => {
  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();

  const [state, dispatch] = useReducer(reduceState, null, createInitialState);
  const getLocalizedAssetTypeText = useGetLocalizedAssetType();
  const getLocalizedInvestTransactionType =
    useGetLocalizedInvestTransactionType();
  const getTransactionsRequest = useGetInvestTransactions(
    state.paginationModel.page,
    state.paginationModel.pageSize,
    state.searchQuery,
  );
  const removeTransactionRequest = useRemoveInvestTransaction();

  // Loading
  useEffect(() => {
    if (state.isLoading) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [state.isLoading]);

  // Error
  useEffect(() => {
    if (getTransactionsRequest.isError || removeTransactionRequest.isError) {
      dispatch({ type: StateActionType.RequestError });
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [getTransactionsRequest.isError, removeTransactionRequest.isError]);

  // Success
  useEffect(() => {
    if (!getTransactionsRequest.data) return;
    dispatch({
      type: StateActionType.RequestSuccess,
      payload: getTransactionsRequest.data,
    });
  }, [getTransactionsRequest.data]);

  const handlePaginationModelChange: React.Dispatch<
    React.SetStateAction<{
      pageSize: number;
      page: number;
    }>
  > = useCallback((newModel) => {
    dispatch({
      type: StateActionType.PaginationModelChanged,
      payload:
        typeof newModel === 'function'
          ? newModel(state.paginationModel)
          : newModel,
    });
  }, []);

  const debouncedSearchQuery = debounce((value: string) => {
    dispatch({ type: StateActionType.SearchQueryUpdated, payload: value });
  }, 300);

  const rows = useMemo(
    () =>
      state.page?.results.map((result: InvestTransaction) => ({
        id: result.transaction_id,
        date: { date: result.date_timestamp, type: result.trx_type },
        asset: {
          name: result.name,
          broker: result.broker,
          type: result.asset_type,
        },
        units: {
          qty: result.units,
          ticker: result.ticker,
        },
        value: { price: result.total_price, feesTaxes: result.fees_taxes_amount },
        observations: result.note,
        actions: result,
      })),
    [state?.page?.results],
  );

  const columns: MyFinColumnDef[] = [
    {
      field: 'date',
      headerName: t('common.date'),
      minWidth: 100,
      align: 'center',
      editable: false,
      sortable: false,
      renderCell: (params) => (
        <div className="flex flex-col items-center gap-1 py-2">
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="text-center">
              <b>{getDayNumberFromUnixTimestamp(params.value.date)}</b>{' '}
              <span>
                {getMonthShortStringFromUnixTimestamp(params.value.date)}
                {" '"}
                {getShortYearFromUnixTimestamp(params.value.date)}
              </span>
            </span>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-xs font-normal',
              params.value.type === InvestTransactionType.Buy &&
                'border-green-600 text-green-700 dark:text-green-400',
              params.value.type === InvestTransactionType.Sell &&
                'border-amber-600 text-amber-800 dark:text-amber-400',
              params.value.type === InvestTransactionType.Income &&
                'border-blue-600 text-blue-700 dark:text-blue-400',
              params.value.type === InvestTransactionType.Cost &&
                'border-destructive text-destructive',
            )}
          >
            {getLocalizedInvestTransactionType.invoke(params.value.type)}
          </Badge>
        </div>
      ),
    },
    {
      field: 'asset',
      headerName: t('investments.asset'),
      minWidth: 300,
      editable: false,
      sortable: false,
      renderCell: (params) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground text-sm font-medium">
            {params.value.name}
          </span>
          <span className="text-muted-foreground text-xs">
            {getLocalizedAssetTypeText.invoke(params.value.type)} @{' '}
            {params.value.broker}
          </span>
        </div>
      ),
    },
    {
      field: 'units',
      headerName: t('investments.units'),
      minWidth: 100,
      editable: false,
      sortable: false,
      renderCell: (params) => (
        <div className="flex flex-col">
          <span className="text-foreground text-sm font-medium">
            {params.value.qty}
          </span>
          <span className="text-muted-foreground text-xs">
            {params.value.ticker}
          </span>
        </div>
      ),
    },
    {
      field: 'value',
      headerName: t('common.value'),
      minWidth: 250,
      editable: false,
      sortable: false,
      renderCell: (params) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground text-sm font-medium">
            {formatNumberAsCurrency(params.value.price)}
          </span>
          <span className="text-muted-foreground text-xs">
            {t('investments.feesAndTaxes')}:{' '}
            {formatNumberAsCurrency(params.value.feesTaxes)}
          </span>
        </div>
      ),
    },
    {
      field: 'observations',
      headerName: t('investments.observations'),
      minWidth: 200,
      flex: 1,
      editable: false,
      sortable: false,
      renderCell: (params) => <p>{params.value}</p>,
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      minWidth: 100,
      editable: false,
      sortable: false,
      renderCell: (params) => (
        <div className="flex flex-row gap-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('common.edit')}
            onClick={() =>
              dispatch({
                type: StateActionType.EditClick,
                payload: params.value,
              })
            }
          >
            <Pencil className="h-5 w-5 opacity-70" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('common.delete')}
            onClick={(event) => {
              event.stopPropagation();
              dispatch({
                type: StateActionType.RemoveClick,
                payload: params.value,
              });
            }}
          >
            <Trash2 className="h-5 w-5 opacity-70" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      {state.isUpdateAssetValueDialogOpen && (
        <UpdateAssetValueDialog
          isOpen={true}
          onSuccess={() => dispatch({ type: StateActionType.DialogDismissed })}
          onCanceled={() => dispatch({ type: StateActionType.DialogDismissed })}
          assetId={state.actionableAsset?.asset_id || -1n}
          currentValue={state.actionableAsset?.current_value || 0}
          assetName={state.actionableAsset?.name || ''}
        />
      )}
      {state.isAddEditDialogOpen && (
        <AddEditInvestTransactionDialog
          isOpen={true}
          onClose={() => dispatch({ type: StateActionType.DialogDismissed })}
          onSuccess={(asset, checkDate, prevDate) =>
            dispatch({
              type: StateActionType.DialogSuccess,
              payload: { asset, checkDate, prevDate },
            })
          }
          trx={state.actionableTransaction}
        />
      )}
      {state.isRemoveDialogOpen && (
        <GenericConfirmationDialog
          isOpen={true}
          onClose={() => dispatch({ type: StateActionType.DialogDismissed })}
          onPositiveClick={async () => {
            await removeTransactionRequest.mutateAsync(
              state.actionableTransaction?.transaction_id || -1n,
            );
            if (state.actionableTransaction) {
              // Create a partial asset object as we don't have the full asset here
              const asset = {
                asset_id: state.actionableTransaction.asset_id,
                name: state.actionableTransaction.name,
              } as InvestAsset;

              dispatch({
                type: StateActionType.DialogSuccess,
                payload: {
                  asset,
                  checkDate: state.actionableTransaction.date_timestamp,
                  prevDate: state.actionableTransaction.date_timestamp,
                },
              });
            } else {
              dispatch({ type: StateActionType.DialogDismissed });
            }
          }}
          onNegativeClick={() =>
            dispatch({ type: StateActionType.DialogDismissed })
          }
          titleText={t('investments.deleteTrxModalTitle', {
            id: state.actionableTransaction?.transaction_id,
          })}
          descriptionText={t('investments.deleteTrxModalSubtitle')}
          alert={t('investments.deleteTrxModalAlert')}
          positiveText={t('common.delete')}
        />
      )}
      {state.isBackdatedTrxDisclaimerOpen && (
        <GenericConfirmationDialog
          isOpen={true}
          onClose={() => dispatch({ type: StateActionType.DialogDismissed })}
          onPositiveClick={() =>
            dispatch({ type: StateActionType.OpenHistoryDrawer })
          }
          onNegativeClick={() =>
            dispatch({ type: StateActionType.DialogDismissed })
          }
          titleText={t('investments.backdatedTransactionTitle')}
          descriptionText={t('investments.backdatedTransactionDescription')}
          positiveText={t('investments.viewHistory')}
          negativeText={t('common.close')}
          alert={''}
        />
      )}
      {state.isHistoryDrawerOpen && state.historyDrawerAssetId && (
        <AssetValueHistoryDrawer
          isOpen={true}
          onClose={() => dispatch({ type: StateActionType.CloseHistoryDrawer })}
          assetId={state.historyDrawerAssetId}
          assetName={state.historyDrawerAssetName || ''}
          highlightMonth={state.historyDrawerHighlightMonth}
          highlightYear={state.historyDrawerHighlightYear}
        />
      )}
      <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <Button
            type="button"
            onClick={() => {
              dispatch({ type: StateActionType.AddClick });
            }}
          >
            <CirclePlus className="mr-2 size-5" />
            {t('transactions.addTransactionCTA')}
          </Button>
        </div>
        <div className="flex justify-stretch sm:justify-end lg:col-span-4">
          <div className="flex w-full max-w-md flex-col gap-2">
            <Label htmlFor="inv-trx-search">{t('common.search')}</Label>
            <div className="relative">
              <Search className="text-muted-foreground absolute right-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                id="inv-trx-search"
                className="pr-10"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  debouncedSearchQuery(event.target.value);
                }}
              />
            </div>
          </div>
        </div>
        <div className="lg:col-span-12">
        <DataTable
          isRefetching={getTransactionsRequest.isRefetching}
          rows={rows || []}
          columns={columns}
          itemCount={state.page?.filtered_count ?? 0}
          paginationModel={state.paginationModel}
          setPaginationModel={handlePaginationModelChange}
          onRowClicked={(id) => {
            const trx = state?.page?.results.find(
              (trx) => trx.transaction_id == id,
            );
            if (trx) {
              dispatch({
                type: StateActionType.EditClick,
                payload: trx,
              });
            }
          }}
        />
        </div>
      </div>
    </div>
  );
};

export default InvestTransactions;
