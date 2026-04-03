import { useLoading } from '../../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../../providers/SnackbarProvider.tsx';
import { useTranslation } from 'react-i18next';
import { useGetAssets, useRemoveAsset } from '@/hooks/invest';
import React, { useEffect, useMemo, useReducer } from 'react';
import { InvestAsset } from '@/common/api/invest';
import type { MyFinColumnDef } from '@/components/dashboard/Table/Types';
import { useGetLocalizedAssetType } from '../InvestUtilHooks.ts';
import MyFinStaticTable from '../../../components/MyFinStaticTable.tsx';
import { Coins, Pencil, PlusCircle, Search, Trash2 } from 'lucide-react';
import GenericConfirmationDialog from '../../../components/GenericConfirmationDialog.tsx';
import UpdateAssetValueDialog from './UpdateAssetValueDialog.tsx';
import AddEditInvestAssetDialog from './AddEditInvestAssetDialog.tsx';
import AssetValueHistoryDrawer from './AssetValueHistoryDrawer.tsx';
import PercentageChip from '../../../components/PercentageChip.tsx';
import { useFormatNumberAsCurrency } from '../../../utils/textHooks.ts';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
import { Checkbox } from '@/common/shadcn/ui/checkbox.tsx';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/common/shadcn/ui/tooltip.tsx';

type UiState = {
  assets?: InvestAsset[];
  filteredAssets?: InvestAsset[];
  searchQuery: string;
  showInactive: boolean;
  actionableAsset?: InvestAsset;
  isEditDialogOpen: boolean;
  isRemoveDialogOpen: boolean;
  isUpdateAssetValueDialogOpen: boolean;

  isHistoryDrawerOpen: boolean;
  historyDrawerAssetId?: bigint;
  historyDrawerAssetName?: string;
  historyDrawerHighlightMonth?: number;
  historyDrawerHighlightYear?: number;
};

const enum StateActionType {
  DataLoaded,
  SearchQueryUpdated,
  ShowInactiveUpdated,
  AddClick,
  EditClick,
  RemoveClick,
  DialogDismissed,
  DialogConfirmationClick,
  DialogUpdateAssetValueClick,
  OpenHistoryDrawer,
  CloseHistoryDrawer,
}

type StateAction =
  | {
      type: StateActionType.DataLoaded;
      payload: InvestAsset[];
    }
  | { type: StateActionType.SearchQueryUpdated; payload: string }
  | { type: StateActionType.ShowInactiveUpdated; payload: boolean }
  | { type: StateActionType.DialogDismissed }
  | { type: StateActionType.AddClick }
  | { type: StateActionType.EditClick; payload: InvestAsset }
  | { type: StateActionType.RemoveClick; payload: InvestAsset }
  | { type: StateActionType.DialogConfirmationClick }
  | {
      type: StateActionType.DialogUpdateAssetValueClick;
      payload: InvestAsset;
    }
  | {
      type: StateActionType.OpenHistoryDrawer;
      payload: {
        assetId: bigint;
        assetName: string;
        highlightMonth?: number;
        highlightYear?: number;
      };
    }
  | { type: StateActionType.CloseHistoryDrawer };

const createInitialState = (): UiState => {
  return {
    searchQuery: '',
    showInactive: false,
    isEditDialogOpen: false,
    isRemoveDialogOpen: false,
    isUpdateAssetValueDialogOpen: false,
    isHistoryDrawerOpen: false,
  };
};

const filterItems = (
  list: InvestAsset[],
  searchQuery: string,
  showInactive: boolean,
) => {
  return list.filter(
    (asset) =>
      JSON.stringify(asset).toLowerCase().includes(searchQuery.toLowerCase()) &&
      (showInactive || asset.units > 0),
  );
};

const reduceState = (prevState: UiState, action: StateAction): UiState => {
  switch (action.type) {
    case StateActionType.DataLoaded:
      return {
        ...prevState,
        assets: action.payload,
        filteredAssets: filterItems(
          action.payload,
          prevState?.searchQuery,
          prevState?.showInactive,
        ),
      };
    case StateActionType.SearchQueryUpdated:
      return {
        ...prevState,
        searchQuery: action.payload,
        filteredAssets: filterItems(
          prevState.assets || [],
          action.payload,
          prevState?.showInactive,
        ),
      };
    case StateActionType.ShowInactiveUpdated:
      return {
        ...prevState,
        showInactive: action.payload,
        filteredAssets: filterItems(
          prevState.assets || [],
          prevState.searchQuery,
          action.payload,
        ),
      };
    case StateActionType.DialogDismissed:
      return {
        ...prevState,
        isRemoveDialogOpen: false,
        isEditDialogOpen: false,
        isUpdateAssetValueDialogOpen: false,
        actionableAsset: undefined,
      };
    case StateActionType.DialogConfirmationClick:
      return {
        ...prevState,
        isEditDialogOpen: true,
        isRemoveDialogOpen: false,
        isUpdateAssetValueDialogOpen: false,
        actionableAsset: undefined,
      };
    case StateActionType.DialogUpdateAssetValueClick:
      return {
        ...prevState,
        isEditDialogOpen: false,
        isRemoveDialogOpen: false,
        isUpdateAssetValueDialogOpen: true,
        actionableAsset: action.payload,
      };
    case StateActionType.RemoveClick:
      return {
        ...prevState,
        isEditDialogOpen: false,
        isRemoveDialogOpen: true,
        isUpdateAssetValueDialogOpen: false,
        actionableAsset: action.payload,
      };
    case StateActionType.AddClick:
      return {
        ...prevState,
        isEditDialogOpen: true,
        isRemoveDialogOpen: false,
        isUpdateAssetValueDialogOpen: false,
        actionableAsset: undefined,
      };
    case StateActionType.EditClick:
      return {
        ...prevState,
        isEditDialogOpen: true,
        isRemoveDialogOpen: false,
        isUpdateAssetValueDialogOpen: false,
        actionableAsset: action.payload,
      };
    case StateActionType.OpenHistoryDrawer:
      return {
        ...prevState,
        isHistoryDrawerOpen: true,
        historyDrawerAssetId: action.payload.assetId,
        historyDrawerAssetName: action.payload.assetName,
        historyDrawerHighlightMonth: action.payload.highlightMonth,
        historyDrawerHighlightYear: action.payload.highlightYear,
        isUpdateAssetValueDialogOpen: false,
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
  }
};

const InvestAssets = () => {
  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();

  const getAssetsRequest = useGetAssets();
  const removeAssetRequest = useRemoveAsset();
  const getLocalizedAssetTypeText = useGetLocalizedAssetType();
  const formatNumberAsCurrency = useFormatNumberAsCurrency();
  const [state, dispatch] = useReducer(reduceState, null, createInitialState);

  useEffect(() => {
    if (getAssetsRequest.isFetching || removeAssetRequest.isPending) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [getAssetsRequest.isFetching, removeAssetRequest.isPending]);

  useEffect(() => {
    if (getAssetsRequest.isError || removeAssetRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [getAssetsRequest.isError, removeAssetRequest.isError]);

  useEffect(() => {
    if (!getAssetsRequest.data) return;
    dispatch({
      type: StateActionType.DataLoaded,
      payload: getAssetsRequest.data,
    });
  }, [getAssetsRequest.data]);

  const rows = useMemo(
    () =>
      state?.filteredAssets?.map((asset: InvestAsset) => ({
        id: asset.asset_id,
        name: { name: asset.name, broker: asset.broker, type: asset.type },
        units: { qty: asset.units, ticker: asset.ticker },
        investedValue: {
          invested: asset.currently_invested_value,
          pricePerUnit: asset.price_per_unit,
        },
        feesTaxes: asset.fees_taxes,
        currentValue: asset,
        currentRoi: {
          absolute: asset.absolute_roi_value,
          percentage: asset.relative_roi_percentage,
        },
        actions: asset,
      })),
    [state?.filteredAssets],
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
      minWidth: 120,
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
      field: 'investedValue',
      headerName: t('investments.investedValue'),
      minWidth: 150,
      editable: false,
      sortable: false,
      renderCell: (params) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground text-sm font-medium">
            {formatNumberAsCurrency.invoke(params.value.invested)}
          </span>
          <span className="text-muted-foreground text-xs">
            {t('investments.perUnitPrice', {
              price: formatNumberAsCurrency.invoke(params.value.pricePerUnit),
            })}
          </span>
        </div>
      ),
    },
    {
      field: 'feesTaxes',
      headerName: t('investments.feesAndTaxes'),
      minWidth: 120,
      editable: false,
      sortable: false,
      renderCell: (params) => (
        <p>{formatNumberAsCurrency.invoke(params.value)}</p>
      ),
    },
    {
      field: 'currentValue',
      headerName: t('investments.currentValue'),
      minWidth: 120,
      editable: false,
      sortable: false,
      renderCell: (params) => (
        <div className="flex flex-wrap items-center gap-1">
          <span>{formatNumberAsCurrency.invoke(params.value.current_value)}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-primary"
                onClick={(event) => {
                  event.stopPropagation();
                  dispatch({
                    type: StateActionType.DialogUpdateAssetValueClick,
                    payload: params.value,
                  });
                }}
              >
                <Coins className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('investments.updateValue')}</TooltipContent>
          </Tooltip>
        </div>
      ),
    },
    {
      field: 'currentRoi',
      headerName: t('investments.currentROI'),
      minWidth: 120,
      editable: false,
      sortable: false,
      renderCell: (params) => (
        <div className="flex flex-col items-center justify-center gap-1">
          {formatNumberAsCurrency.invoke(params.value.absolute)}
          <PercentageChip
            percentage={params.value.percentage}
            hideIcon
            className="text-[0.9em]"
          />
        </div>
      ),
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
            <Pencil className="size-5 opacity-70" />
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
            <Trash2 className="size-5 opacity-70" />
          </Button>
        </div>
      ),
    },
  ];

  if (!state) return null;
  return (
    <div className="grid gap-4">
      {state.isEditDialogOpen && (
        <AddEditInvestAssetDialog
          isOpen={true}
          onClose={() => dispatch({ type: StateActionType.DialogDismissed })}
          onSuccess={() => dispatch({ type: StateActionType.DialogDismissed })}
          onNegativeClick={() =>
            dispatch({ type: StateActionType.DialogDismissed })
          }
          asset={state.actionableAsset}
        />
      )}
      {state.isUpdateAssetValueDialogOpen && (
        <UpdateAssetValueDialog
          isOpen={true}
          onSuccess={() => dispatch({ type: StateActionType.DialogDismissed })}
          onCanceled={() => dispatch({ type: StateActionType.DialogDismissed })}
          assetId={state.actionableAsset?.asset_id || -1n}
          currentValue={state.actionableAsset?.current_value || 0}
          assetName={state.actionableAsset?.name || ''}
          onViewHistory={() => {
            if (state.actionableAsset) {
              dispatch({
                type: StateActionType.OpenHistoryDrawer,
                payload: {
                  assetId: state.actionableAsset.asset_id,
                  assetName: state.actionableAsset.name,
                },
              });
            }
          }}
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
      {state.isRemoveDialogOpen && (
        <GenericConfirmationDialog
          isOpen={true}
          onClose={() => dispatch({ type: StateActionType.DialogDismissed })}
          onPositiveClick={() => {
            removeAssetRequest.mutate(state.actionableAsset?.asset_id || -1n);
            dispatch({ type: StateActionType.DialogDismissed });
          }}
          onNegativeClick={() =>
            dispatch({ type: StateActionType.DialogDismissed })
          }
          titleText={t('investments.deleteAssetModalTitle', {
            name: state.actionableAsset?.name,
          })}
          descriptionText={t('investments.deleteAssetModalSubtitle')}
          alert={t('investments.deleteAssetModalAlert')}
          positiveText={t('common.delete')}
        />
      )}
      <div className="grid gap-4 md:grid-cols-12 md:items-end">
        <div className="space-y-3 md:col-span-8">
          <Button
            type="button"
            className="mb-0"
            onClick={() => {
              dispatch({ type: StateActionType.AddClick });
            }}
          >
            <PlusCircle className="mr-2 size-5" />
            {t('investments.addAssetCTA')}
          </Button>
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-inactive"
              checked={state.showInactive == true}
              onCheckedChange={(c) =>
                dispatch({
                  type: StateActionType.ShowInactiveUpdated,
                  payload: c === true,
                })
              }
            />
            <Label htmlFor="show-inactive" className="cursor-pointer font-normal">
              {t('investments.showInactives')}
            </Label>
          </div>
        </div>
        <div className="flex justify-end md:col-span-4">
          <div className="flex w-full max-w-xs flex-col gap-2">
            <Label htmlFor="asset-search">{t('common.search')}</Label>
            <div className="relative">
              <Search className="text-muted-foreground absolute right-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                id="asset-search"
                className="pr-10"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  dispatch({
                    type: StateActionType.SearchQueryUpdated,
                    payload: event.target.value,
                  });
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <MyFinStaticTable
        isRefetching={getAssetsRequest.isRefetching}
        rows={rows || []}
        columns={columns}
        paginationModel={{ pageSize: 20 }}
        onRowClicked={(id) => {
          const asset = state.assets?.find((asset) => asset.asset_id == id);
          if (!asset) return;
          dispatch({ type: StateActionType.EditClick, payload: asset });
        }}
      />
    </div>
  );
};

export default InvestAssets;
