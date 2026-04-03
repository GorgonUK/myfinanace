import { useLoading } from '../../../providers/LoadingProvider.tsx';
import { AlertSeverity, useSnackbar } from '../../../providers/SnackbarProvider.tsx';
import { Trans, useTranslation } from 'react-i18next';
import React, { useEffect, useReducer } from 'react';
import { Send, Undo } from 'lucide-react';
import { useUpdateAssetValue } from '@/hooks/invest';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/common/shadcn/ui/dialog.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
import { NumericFormat } from 'react-number-format';
import CurrencyIcon from '../../../components/CurrencyIcon.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { cn } from '@/common/shadcn/lib/utils';

type UiState = {
  isLoading: boolean;
  assetId: bigint;
  value: number;
  assetName: string;
};

const enum StateActionType {
  RequestStarted,
  RequestFinished,
  AmountUpdated,
}

type StateAction =
  | { type: StateActionType.RequestStarted }
  | { type: StateActionType.RequestFinished }
  | { type: StateActionType.AmountUpdated; payload: number };

const createInitialState = (args: {
  currentValue: number;
  assetId: bigint;
  assetName: string;
}): UiState => {
  return {
    isLoading: false,
    value: args.currentValue,
    assetId: args.assetId,
    assetName: args.assetName,
  };
};

const reduceState = (prevState: UiState, action: StateAction): UiState => {
  switch (action.type) {
    case StateActionType.RequestStarted:
      return {
        ...prevState,
        isLoading: true,
      };
    case StateActionType.RequestFinished:
      return {
        ...prevState,
        isLoading: false,
      };
    case StateActionType.AmountUpdated:
      return {
        ...prevState,
        value: action.payload,
      };
  }
};

type Props = {
  isOpen: boolean;
  onSuccess: () => void;
  onCanceled: () => void;
  assetId: bigint;
  currentValue: number;
  assetName: string;
  month?: number;
  year?: number;
  onViewHistory?: () => void;
};

const UpdateAssetValueDialog = (props: Props) => {
  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();

  const [state, dispatch] = useReducer(
    reduceState,
    {
      assetName: props.assetName,
      currentValue: props.currentValue,
      assetId: props.assetId,
    },
    createInitialState,
  );

  const updateAssetValueRequest = useUpdateAssetValue();

  useEffect(() => {
    if (state.isLoading) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [state.isLoading, loader]);

  useEffect(() => {
    if (!updateAssetValueRequest.data) return;
    dispatch({ type: StateActionType.RequestFinished });
    snackbar.showSnackbar(
      t('investments.updateValueSuccess'),
      AlertSeverity.SUCCESS,
    );
  }, [updateAssetValueRequest.data]);

  useEffect(() => {
    if (!updateAssetValueRequest.isError) return;
    dispatch({ type: StateActionType.RequestFinished });
    snackbar.showSnackbar(
      t('common.somethingWentWrongTryAgain'),
      AlertSeverity.ERROR,
    );
  }, [updateAssetValueRequest.isError]);

  useEffect(() => {
    if (!state.isLoading && updateAssetValueRequest.data) {
      props.onSuccess();
    }
  }, [state.isLoading, updateAssetValueRequest.data]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch({ type: StateActionType.RequestStarted });
    updateAssetValueRequest.mutate({
      assetId: state.assetId,
      newValue: state.value,
      month: props.month,
      year: props.year,
    });
  };

  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={(open) => !open && props.onCanceled()}
    >
      <DialogContent className="max-w-md sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              <Trans
                i18nKey={
                  props.month && props.year
                    ? 'investments.updateHistoricalValue'
                    : 'investments.currentInvestValue'
                }
                values={{
                  name: props.assetName,
                  date:
                    props.month && props.year
                      ? `${props.month}/${props.year}`
                      : undefined,
                }}
              />
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2 md:max-w-xs">
              <Label htmlFor="amount">{t('common.value')}</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <CurrencyIcon />
                </span>
                <NumericFormat
                  required
                  id="amount"
                  name="amount"
                  customInput={Input}
                  className={cn('pl-10')}
                  decimalScale={2}
                  fixedDecimalScale
                  thousandSeparator
                  value={state.value || ''}
                  onValueChange={(values) => {
                    const { floatValue } = values;
                    dispatch({
                      type: StateActionType.AmountUpdated,
                      payload: Number(floatValue),
                    });
                  }}
                  onFocus={(event) => {
                    event.target.select();
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            {props.onViewHistory && (
              <Button
                type="button"
                variant="ghost"
                className="sm:mr-auto"
                onClick={props.onViewHistory}
              >
                {t('investments.viewHistory')}
              </Button>
            )}
            <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={props.onCanceled}
              >
                <Undo className="mr-2 size-4" />
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                <Send className="mr-2 size-4" />
                {t('common.edit')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateAssetValueDialog;
