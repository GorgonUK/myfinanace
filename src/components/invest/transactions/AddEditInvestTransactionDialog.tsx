import {
  CircleHelp,
  CopyPlus,
  Disc3,
  FileText,
  Send,
  Undo,
  UserCircle,
} from 'lucide-react';
import { DatePickerField } from '@/common/shadcn/DatePickerField.tsx';
import dayjs, { Dayjs } from 'dayjs';
import React, { useEffect, useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { NumericFormat } from 'react-number-format';
import CurrencyIcon from '../../../components/CurrencyIcon.tsx';
import { useLoading } from '../../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../../providers/SnackbarProvider.tsx';
import {
  useAddInvestTransaction,
  useEditInvestTransaction,
  useGetAssets,
} from '@/hooks/invest';
import {
  InvestAsset,
  InvestTransaction,
  InvestTransactionType,
} from '@/common/api/invest';
import {
  convertDayJsToUnixTimestamp,
  convertUnixTimestampToDayJs,
} from '../../../utils/dateUtils.ts';
import { IdLabelPair } from '../../transactions/AddEditTransactionDialog.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Checkbox } from '@/common/shadcn/ui/checkbox.tsx';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/common/shadcn/ui/dialog.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/common/shadcn/ui/select.tsx';
import { ToggleGroup, ToggleGroupItem } from '@/common/shadcn/ui/toggle-group.tsx';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/common/shadcn/ui/tooltip.tsx';
import { cn } from '@/common/shadcn/lib/utils';

type UiState = {
  isLoading: boolean;
  dateInput: Dayjs | null;
  typeInput: InvestTransactionType;
  valueInput: number;
  observationsInput: string;
  unitsInput: number;
  assetInput: IdLabelPair | null;
  feesTaxesInput: number;
  deductFeesInUnits: boolean;
  feesUnitsInput: number;
  assets: InvestAsset[];
  isFeesTaxesInputVisible: boolean;
  isEdit: boolean;
};

const enum StateActionType {
  RequestError,
  RequestSuccess,
  DateUpdated,
  TypeUpdated,
  ValueUpdated,
  ObservationsUpdated,
  UnitsUpdated,
  AssetUpdated,
  FeesTaxesUpdated,
  DeductFeesInUnitsToggled,
  FeesUnitsUpdated,
  SubmitClick,
  SubmitCompleted,
}

type StateAction =
  | { type: StateActionType.RequestSuccess; payload: InvestAsset[] }
  | { type: StateActionType.RequestError }
  | { type: StateActionType.DateUpdated; payload: Dayjs | null }
  | { type: StateActionType.TypeUpdated; payload: InvestTransactionType }
  | { type: StateActionType.ValueUpdated; payload: number }
  | { type: StateActionType.ObservationsUpdated; payload: string }
  | { type: StateActionType.UnitsUpdated; payload: number }
  | { type: StateActionType.AssetUpdated; payload: IdLabelPair | null }
  | { type: StateActionType.FeesTaxesUpdated; payload: number }
  | { type: StateActionType.DeductFeesInUnitsToggled }
  | { type: StateActionType.FeesUnitsUpdated; payload: number }
  | { type: StateActionType.SubmitClick }
  | { type: StateActionType.SubmitCompleted };

const createInitialState = (args: {
  trx: InvestTransaction | undefined;
}): UiState => {
  return {
    isLoading: true,
    dateInput: convertUnixTimestampToDayJs(args.trx?.date_timestamp),
    typeInput: args.trx?.trx_type ?? InvestTransactionType.Buy,
    valueInput: args.trx?.total_price ?? 0,
    observationsInput: args.trx?.note ?? '',
    unitsInput: args.trx?.units ?? 0,
    assetInput: args.trx
      ? { id: args.trx!.asset_id, label: args.trx!.name }
      : null,
    feesTaxesInput: args.trx?.fees_taxes_amount ?? 0,
    deductFeesInUnits: (args.trx?.fees_taxes_units ?? 0) > 0,
    feesUnitsInput: args.trx?.fees_taxes_units ?? 0,
    assets: [],
    isFeesTaxesInputVisible: true,
    isEdit: args.trx != null,
  };
};

const reduceState = (prevState: UiState, action: StateAction): UiState => {
  switch (action.type) {
    case StateActionType.RequestSuccess:
      return {
        ...prevState,
        assets: action.payload,
        isLoading: false,
      };
    case StateActionType.RequestError:
      return {
        ...prevState,
        isLoading: false,
      };
    case StateActionType.DateUpdated:
      return {
        ...prevState,
        dateInput: action.payload,
      };
    case StateActionType.ValueUpdated:
      return {
        ...prevState,
        valueInput: action.payload,
        unitsInput:
          prevState.typeInput === InvestTransactionType.Income &&
          action.payload > 0
            ? 0
            : prevState.unitsInput,
      };
    case StateActionType.UnitsUpdated:
      return {
        ...prevState,
        unitsInput: action.payload,
        valueInput:
          prevState.typeInput === InvestTransactionType.Income &&
          action.payload > 0
            ? 0
            : prevState.valueInput,
        feesUnitsInput:
          prevState.deductFeesInUnits &&
          prevState.typeInput === InvestTransactionType.Income
            ? prevState.feesTaxesInput
            : prevState.feesUnitsInput,
      };
    case StateActionType.TypeUpdated:
      return {
        ...prevState,
        typeInput: action.payload,
        isFeesTaxesInputVisible: action.payload !== InvestTransactionType.Cost,
        feesTaxesInput:
          action.payload !== InvestTransactionType.Cost
            ? prevState.feesTaxesInput
            : 0,
        deductFeesInUnits: false,
        feesUnitsInput: 0,
        unitsInput:
          action.payload === InvestTransactionType.Income &&
          prevState.valueInput > 0
            ? 0
            : prevState.unitsInput,
      };
    case StateActionType.AssetUpdated:
      return {
        ...prevState,
        assetInput: action.payload,
      };
    case StateActionType.FeesTaxesUpdated:
      return {
        ...prevState,
        feesTaxesInput: action.payload,
        feesUnitsInput: prevState.deductFeesInUnits
          ? action.payload
          : prevState.feesUnitsInput,
      };
    case StateActionType.ObservationsUpdated:
      return {
        ...prevState,
        observationsInput: action.payload,
      };
    case StateActionType.DeductFeesInUnitsToggled: {
      const newDeductState = !prevState.deductFeesInUnits;
      return {
        ...prevState,
        deductFeesInUnits: newDeductState,
        feesUnitsInput: newDeductState ? prevState.feesTaxesInput : 0,
      };
    }
    case StateActionType.FeesUnitsUpdated:
      return {
        ...prevState,
        feesUnitsInput: action.payload,
      };
    case StateActionType.SubmitClick:
      return {
        ...prevState,
        isLoading: true,
      };
    case StateActionType.SubmitCompleted:
      return {
        ...prevState,
        isLoading: false,
      };
  }
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (asset: InvestAsset, checkDate: number, prevDate?: number) => void;
  trx: InvestTransaction | undefined;
};

const AddEditInvestTransactionDialog = (props: Props) => {
  const isEditForm = props.trx !== undefined;
  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();

  const addTransactionRequest = useAddInvestTransaction();
  const editTransactionRequest = useEditInvestTransaction();
  const getAssetsRequest = useGetAssets();

  const [state, dispatch] = useReducer(
    reduceState,
    { trx: props.trx },
    createInitialState,
  );

  useEffect(() => {
    if (state.isLoading) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [state.isLoading]);

  useEffect(() => {
    if (
      getAssetsRequest.isError ||
      addTransactionRequest.isError ||
      editTransactionRequest.isError
    ) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
      dispatch({ type: StateActionType.RequestError });
    }
  }, [
    getAssetsRequest.isError,
    addTransactionRequest.isError,
    editTransactionRequest.isError,
  ]);

  useEffect(() => {
    if (!getAssetsRequest.data) return;
    dispatch({
      type: StateActionType.RequestSuccess,
      payload: getAssetsRequest.data,
    });
  }, [getAssetsRequest.data]);

  useEffect(() => {
    if (!addTransactionRequest.data && !editTransactionRequest.data) return;
    dispatch({
      type: StateActionType.SubmitCompleted,
    });

    setTimeout(() => {
      const asset = state.assets.find(
        (asset) => asset.asset_id == state.assetInput?.id,
      );
      const checkDate = convertDayJsToUnixTimestamp(state.dateInput ?? dayjs());
      const prevDate = props.trx?.date_timestamp;
      if (asset) props.onSuccess(asset, checkDate, prevDate);
    }, 0);
  }, [editTransactionRequest.data, addTransactionRequest.data]);

  const onTransactionTypeSelected = (newType: string) => {
    if (
      Object.values(InvestTransactionType).includes(
        newType as InvestTransactionType,
      )
    ) {
      dispatch({
        type: StateActionType.TypeUpdated,
        payload: newType as InvestTransactionType,
      });
    }
  };

  const getAmountTooltipKey = (type: InvestTransactionType) => {
    switch (type) {
      case InvestTransactionType.Buy:
        return 'investments.tooltips.amount_buy';
      case InvestTransactionType.Sell:
        return 'investments.tooltips.amount_sell';
      case InvestTransactionType.Income:
        return 'investments.tooltips.amount_income';
      case InvestTransactionType.Cost:
        return 'investments.tooltips.amount_cost';
      default:
        return 'investments.tooltips.amount_buy';
    }
  };

  const getUnitsTooltipKey = (type: InvestTransactionType) => {
    switch (type) {
      case InvestTransactionType.Buy:
        return 'investments.tooltips.units_buy';
      case InvestTransactionType.Sell:
        return 'investments.tooltips.units_sell';
      case InvestTransactionType.Income:
        return 'investments.tooltips.units_income';
      case InvestTransactionType.Cost:
        return 'investments.tooltips.units_cost';
      default:
        return 'investments.tooltips.units_buy';
    }
  };

  const getFeesTooltipKey = (
    type: InvestTransactionType,
    deductInUnits: boolean,
  ) => {
    const mode = deductInUnits ? 'units' : 'cash';
    switch (type) {
      case InvestTransactionType.Buy:
        return `investments.tooltips.fees_buy_cash`;
      case InvestTransactionType.Sell:
        return `investments.tooltips.fees_sell_cash`;
      case InvestTransactionType.Income:
        return `investments.tooltips.fees_income_${mode}`;
      case InvestTransactionType.Cost:
        return `investments.tooltips.fees_cost_cash`;
      default:
        return `investments.tooltips.fees_buy_cash`;
    }
  };

  const amountTooltipKey = getAmountTooltipKey(state.typeInput);
  const unitsTooltipKey = getUnitsTooltipKey(state.typeInput);
  const feesTooltipKey = getFeesTooltipKey(
    state.typeInput,
    state.deductFeesInUnits,
  );

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch({ type: StateActionType.SubmitClick });
    if (isEditForm) {
      editTransactionRequest.mutate({
        trxId: props.trx?.transaction_id ?? -1n,
        request: {
          date_timestamp: convertDayJsToUnixTimestamp(
            state.dateInput ?? dayjs(),
          ),
          note: state.observationsInput,
          total_price: state.valueInput,
          units: state.unitsInput,
          fees_amount: state.feesTaxesInput,
          fees_units: state.feesUnitsInput,
          asset_id: state.assetInput?.id ?? -1n,
          type: state.typeInput,
        },
      });
    } else {
      addTransactionRequest.mutate({
        date_timestamp: convertDayJsToUnixTimestamp(
          state.dateInput ?? dayjs(),
        ),
        note: state.observationsInput,
        total_price: state.valueInput,
        units: state.unitsInput,
        fees_amount: state.feesTaxesInput,
        fees_units: state.feesUnitsInput,
        asset_id: state.assetInput?.id ?? -1n,
        type: state.typeInput,
      });
    }
  };

  const assetOptions: IdLabelPair[] =
    state.assets?.map((a) => ({
      id: a.asset_id,
      label: a.name,
    })) ?? [];

  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-3xl">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <DialogHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <DialogTitle className="text-left lg:max-w-[60%]">
                {t(
                  isEditForm
                    ? 'transactions.editTransactionModalTitle'
                    : 'transactions.addNewTransaction',
                  {
                    id: props.trx?.transaction_id,
                  },
                )}
              </DialogTitle>
              <ToggleGroup
                type="single"
                value={state.typeInput}
                onValueChange={(v) => v && onTransactionTypeSelected(v)}
                className="flex flex-wrap justify-start lg:justify-end"
                aria-label={t('transactions.typeOfTrx')}
              >
                <ToggleGroupItem
                  value={InvestTransactionType.Buy}
                  aria-label={t('investments.buy')}
                >
                  <TypeLabelWithTooltip
                    labelKey={'investments.buy'}
                    helpKey={'investments.buy_help'}
                  />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value={InvestTransactionType.Sell}
                  aria-label={t('investments.sell')}
                >
                  <TypeLabelWithTooltip
                    labelKey={'investments.sell'}
                    helpKey={'investments.sell_help'}
                  />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value={InvestTransactionType.Income}
                  aria-label={t('investments.income')}
                >
                  <TypeLabelWithTooltip
                    labelKey={'investments.income'}
                    helpKey={'investments.income_help'}
                  />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value={InvestTransactionType.Cost}
                  aria-label={t('investments.cost')}
                >
                  <TypeLabelWithTooltip
                    labelKey={'investments.cost'}
                    helpKey={'investments.cost_help'}
                  />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-4">
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="inv-value">{t('common.value')}</Label>
              <div className="relative flex w-full items-center">
                <span className="pointer-events-none absolute left-3 z-10">
                  <CurrencyIcon />
                </span>
                <NumericFormat
                  value={state.valueInput ?? ''}
                  onValueChange={(values) => {
                    const { floatValue } = values;
                    dispatch({
                      type: StateActionType.ValueUpdated,
                      payload: floatValue ?? 0,
                    });
                  }}
                  customInput={Input}
                  id="inv-value"
                  required
                  autoFocus
                  className={cn('pr-10 pl-10')}
                  decimalScale={2}
                  fixedDecimalScale
                  thousandSeparator
                  onFocus={(event) => {
                    event.target.select();
                  }}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2">
                  <SmallHelpIcon translationKey={amountTooltipKey} />
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 md:col-span-3">
              <Label htmlFor="inv-units">{t('investments.units')}</Label>
              <div className="relative flex w-full items-center">
                <Disc3 className="text-muted-foreground pointer-events-none absolute left-3 size-4" />
                <NumericFormat
                  required
                  id="inv-units"
                  name="units"
                  value={state.unitsInput ?? ''}
                  onValueChange={(values) => {
                    const { floatValue } = values;
                    dispatch({
                      type: StateActionType.UnitsUpdated,
                      payload: floatValue ?? 0,
                    });
                  }}
                  onFocus={(event) => {
                    event.target.select();
                  }}
                  customInput={Input}
                  className={cn('pr-10 pl-10')}
                  decimalScale={10}
                  fixedDecimalScale
                  thousandSeparator
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2">
                  <SmallHelpIcon translationKey={unitsTooltipKey} />
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 md:col-span-4">
              <Label>{t('investments.asset')}</Label>
              <Select
                value={
                  state.assetInput != null
                    ? String(state.assetInput.id)
                    : undefined
                }
                onValueChange={(v) => {
                  const opt = assetOptions.find((a) => String(a.id) === v);
                  dispatch({
                    type: StateActionType.AssetUpdated,
                    payload: opt ?? null,
                  });
                }}
                required
              >
                <SelectTrigger className="relative w-full pl-10">
                  <UserCircle className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                  <SelectValue placeholder={t('investments.asset')} />
                </SelectTrigger>
                <SelectContent>
                  {assetOptions.map((a) => (
                    <SelectItem key={String(a.id)} value={String(a.id)}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 md:col-span-3">
              <DatePickerField
                name="date"
                label={t('transactions.dateOfTransaction')}
                value={state.dateInput}
                onChange={(newValue) =>
                  dispatch({
                    type: StateActionType.DateUpdated,
                    payload: newValue ?? dayjs(),
                  })
                }
                format="DD/MM/YYYY"
                required
              />
            </div>

            <div
              className={cn(
                'flex flex-col gap-2',
                state.isFeesTaxesInputVisible ? 'md:col-span-9' : 'md:col-span-12',
              )}
            >
              <Label htmlFor="inv-desc">{t('common.description')}</Label>
              <div className="relative">
                <FileText className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  id="inv-desc"
                  name="description"
                  value={state.observationsInput}
                  onChange={(e) =>
                    dispatch({
                      type: StateActionType.ObservationsUpdated,
                      payload: e.target.value,
                    })
                  }
                  type="text"
                  className="pl-10"
                />
              </div>
            </div>

            {state.isFeesTaxesInputVisible && (
              <div className="flex flex-col gap-2 md:col-span-3">
                <Label htmlFor="inv-fees">{t('investments.feesAndTaxes')}</Label>
                <div className="relative flex w-full items-center">
                  <CopyPlus className="text-muted-foreground pointer-events-none absolute left-3 size-4" />
                  <NumericFormat
                    value={state.feesTaxesInput || '0'}
                    onValueChange={(values) => {
                      const { floatValue } = values;
                      dispatch({
                        type: StateActionType.FeesTaxesUpdated,
                        payload: floatValue ?? 0,
                      });
                    }}
                    customInput={Input}
                    id="inv-fees"
                    required
                    className={cn('pr-10 pl-10')}
                    onFocus={(event) => {
                      event.target.select();
                    }}
                    decimalScale={2}
                    fixedDecimalScale
                    thousandSeparator
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2">
                    <SmallHelpIcon translationKey={feesTooltipKey} />
                  </span>
                </div>
              </div>
            )}

            {state.typeInput === InvestTransactionType.Income &&
              state.unitsInput > 0 &&
              state.feesTaxesInput > 0 && (
                <>
                  <div className="flex flex-col gap-2 md:col-span-4 md:items-end">
                    <div className="flex w-full items-start gap-2 md:justify-end md:text-right">
                      <Checkbox
                        id="deduct-fees-units"
                        checked={state.deductFeesInUnits}
                        onCheckedChange={() =>
                          dispatch({
                            type: StateActionType.DeductFeesInUnitsToggled,
                          })
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <Label
                          htmlFor="deduct-fees-units"
                          className="cursor-pointer"
                        >
                          <TypeLabelWithTooltip
                            labelKey="transactions.deductFeesInUnits"
                            helpKey="transactions.deductFeesInUnitsHelp"
                          />
                        </Label>
                      </div>
                    </div>
                  </div>
                  {state.deductFeesInUnits && (
                    <div className="flex flex-col gap-2 md:col-span-5">
                      <Label htmlFor="inv-fees-units">
                        {t('transactions.feesDeductedInUnits')}
                      </Label>
                      <div className="relative">
                        <Disc3 className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                        <NumericFormat
                          value={state.feesUnitsInput || '0'}
                          onValueChange={(values) => {
                            const { floatValue } = values;
                            dispatch({
                              type: StateActionType.FeesUnitsUpdated,
                              payload: floatValue ?? 0,
                            });
                          }}
                          customInput={Input}
                          id="inv-fees-units"
                          required
                          className="pl-10"
                          onFocus={(event) => {
                            event.target.select();
                          }}
                          decimalScale={10}
                          fixedDecimalScale
                          thousandSeparator
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={props.onClose}>
              <Undo className="mr-2 size-4" />
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              <Send className="mr-2 size-4" />
              {t(isEditForm ? 'common.edit' : 'common.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const TypeLabelWithTooltip = (props: {
  labelKey: string;
  showHelp?: boolean;
  helpKey?: string;
  className?: string;
}) => {
  const { labelKey, showHelp = true, helpKey, className } = props;
  const { t } = useTranslation();

  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
    >
      <span>{t(labelKey)}</span>
      {showHelp && helpKey && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground inline-flex shrink-0"
              aria-label={t(helpKey)}
              onClick={(e) => e.stopPropagation()}
            >
              <CircleHelp className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{t(helpKey)}</TooltipContent>
        </Tooltip>
      )}
    </span>
  );
};

const SmallHelpIcon = (props: { translationKey: string | null }) => {
  const { translationKey } = props;
  const { t } = useTranslation();
  if (!translationKey) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground inline-flex"
          aria-label={t(translationKey)}
        >
          <CircleHelp className="size-[18px]" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{t(translationKey)}</TooltipContent>
    </Tooltip>
  );
};

export default AddEditInvestTransactionDialog;
