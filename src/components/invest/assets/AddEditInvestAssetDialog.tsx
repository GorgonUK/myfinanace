import { useLoading } from '../../../providers/LoadingProvider.tsx';
import { AlertSeverity, useSnackbar } from '../../../providers/SnackbarProvider.tsx';
import { Trans, useTranslation } from 'react-i18next';
import React, { useEffect, useReducer } from 'react';
import { AssetType, InvestAsset } from '@/common/api/invest';
import { useAddAsset, useEditAsset } from '@/hooks/invest';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/common/shadcn/ui/dialog.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';
import {
  Wallet,
  Building2,
  Hash,
  Folder,
  Send,
  Undo,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/common/shadcn/ui/select.tsx';
import { useGetLocalizedAssetType } from '../InvestUtilHooks.ts';

type UiState = {
  isLoading: boolean;
  nameInput: string;
  brokerInput: string;
  tickerInput: string;
  typeInput?: AssetType;
};

const enum StateActionType {
  RequestStarted,
  RequestSuccess,
  RequestError,
  NameUpdated,
  BrokerUpdated,
  TickerUpdated,
  TypeUpdated,
}

type StateAction =
  | { type: StateActionType.RequestStarted }
  | { type: StateActionType.RequestSuccess }
  | { type: StateActionType.RequestError }
  | { type: StateActionType.NameUpdated; payload: string }
  | { type: StateActionType.BrokerUpdated; payload: string }
  | { type: StateActionType.TickerUpdated; payload: string }
  | { type: StateActionType.TypeUpdated; payload: AssetType };

const createInitialState = (args: {
  asset: InvestAsset | undefined;
}): UiState => {
  return {
    isLoading: false,
    nameInput: args.asset?.name ?? '',
    brokerInput: args.asset?.broker ?? '',
    tickerInput: args.asset?.ticker ?? '',
    typeInput: args.asset?.type,
  };
};

const reduceState = (prevState: UiState, action: StateAction): UiState => {
  switch (action.type) {
    case StateActionType.RequestStarted:
      return {
        ...prevState,
        isLoading: true,
      };
    case StateActionType.RequestSuccess:
    case StateActionType.RequestError:
      return {
        ...prevState,
        isLoading: false,
      };
    case StateActionType.NameUpdated:
      return {
        ...prevState,
        nameInput: action.payload,
      };
    case StateActionType.BrokerUpdated:
      return {
        ...prevState,
        brokerInput: action.payload,
      };
    case StateActionType.TickerUpdated:
      return {
        ...prevState,
        tickerInput: action.payload,
      };
    case StateActionType.TypeUpdated:
      return {
        ...prevState,
        typeInput: action.payload,
      };
  }
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onNegativeClick: () => void;
  asset: InvestAsset | undefined;
};

const AddEditInvestAssetDialog = (props: Props) => {
  const isEditForm = props.asset != null;

  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();

  const addAssetRequest = useAddAsset();
  const editAssetRequest = useEditAsset();
  const getLocalizedAssetType = useGetLocalizedAssetType();

  const [state, dispatch] = useReducer(
    reduceState,
    {
      asset: props.asset,
    },
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
    if (addAssetRequest.isError || editAssetRequest.isError) {
      dispatch({ type: StateActionType.RequestError });
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [addAssetRequest.isError, editAssetRequest.isError]);

  useEffect(() => {
    if (!addAssetRequest.data && !editAssetRequest.data) return;
    dispatch({
      type: StateActionType.RequestSuccess,
    });
    setTimeout(() => {
      props.onSuccess();
    }, 0);
  }, [addAssetRequest.data, editAssetRequest.data]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch({ type: StateActionType.RequestStarted });
    if (isEditForm && props.asset) {
      editAssetRequest.mutate({
        name: state.nameInput,
        broker: state.brokerInput,
        ticker: state.tickerInput,
        type: state.typeInput as AssetType,
        asset_id: props.asset.asset_id,
      });
    } else {
      addAssetRequest.mutate({
        name: state.nameInput,
        broker: state.brokerInput,
        ticker: state.tickerInput,
        type: state.typeInput as AssetType,
      });
    }
  };

  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              <Trans
                i18nKey={
                  isEditForm
                    ? 'investments.editAssetModalTitle'
                    : 'investments.addNewAssetModalTitle'
                }
                values={{
                  name: props.asset?.name,
                }}
              />
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-12">
            <div className="flex flex-col gap-2 sm:col-span-8">
              <Label htmlFor="asset-name">{t('investments.name')}</Label>
              <div className="relative">
                <Wallet className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  id="asset-name"
                  name="name"
                  required
                  value={state.nameInput || ''}
                  onChange={(e) =>
                    dispatch({
                      type: StateActionType.NameUpdated,
                      payload: e.target.value,
                    })
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:col-span-4">
              <Label htmlFor="asset-ticker">{t('investments.ticker')}</Label>
              <div className="relative">
                <Hash className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  id="asset-ticker"
                  name="ticker"
                  required
                  value={state.tickerInput || ''}
                  onChange={(e) =>
                    dispatch({
                      type: StateActionType.TickerUpdated,
                      payload: e.target.value,
                    })
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:col-span-8">
              <Label htmlFor="asset-type">{t('common.type')}</Label>
              <Select
                value={state.typeInput ?? ''}
                onValueChange={(v) =>
                  dispatch({
                    type: StateActionType.TypeUpdated,
                    payload: v as AssetType,
                  })
                }
                required
              >
                <SelectTrigger
                  id="asset-type"
                  className="w-full"
                  icon={
                    <Folder className="text-muted-foreground size-4 shrink-0" />
                  }
                >
                  <SelectValue placeholder={t('common.type')} />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AssetType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {getLocalizedAssetType.invoke(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 sm:col-span-4">
              <Label htmlFor="asset-broker">{t('investments.broker')}</Label>
              <div className="relative">
                <Building2 className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  id="asset-broker"
                  name="broker"
                  required
                  value={state.brokerInput || ''}
                  onChange={(e) =>
                    dispatch({
                      type: StateActionType.BrokerUpdated,
                      payload: e.target.value,
                    })
                  }
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={props.onNegativeClick}
            >
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

export default AddEditInvestAssetDialog;
