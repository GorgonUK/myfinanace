import { useLoading } from '../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../providers/SnackbarProvider.tsx';
import { useTranslation } from 'react-i18next';
import { useEffect, useReducer } from 'react';
import { CURRENCIES, Currency } from '@/config/Currency.ts';
import { useChangeCurrency } from '@/hooks/auth';
import { useUserData } from '../../providers/UserProvider.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/common/shadcn/ui/select.tsx';

type UiState = {
  isLoading: boolean;
  currency: Currency;
};

const enum StateActionType {
  RequestStarted,
  RequestFailure,
  RequestSuccess,
  CurrencyUpdated,
}

type StateAction =
  | { type: StateActionType.CurrencyUpdated; payload: Currency }
  | { type: StateActionType.RequestStarted }
  | { type: StateActionType.RequestFailure }
  | { type: StateActionType.RequestSuccess };

const createInitialState = (arg: { currencyCode: string }): UiState => {
  return {
    isLoading: true,
    currency: CURRENCIES[arg.currencyCode],
  };
};

const reduceState = (prevState: UiState, action: StateAction): UiState => {
  switch (action.type) {
    case StateActionType.RequestStarted:
      return {
        ...prevState,
        isLoading: true,
      };
    case StateActionType.RequestFailure:
    case StateActionType.RequestSuccess:
      return {
        ...prevState,
        isLoading: false,
      };
    case StateActionType.CurrencyUpdated:
      return {
        ...prevState,
        currency: action.payload,
      };
  }
};

const currencyOptions = Object.values(CURRENCIES);

const ChangeCurrencyForm = () => {
  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();

  const { userSessionData, partiallyUpdateUserSessionData } = useUserData();

  const [state, dispatch] = useReducer(
    reduceState,
    { currencyCode: userSessionData?.currency ?? CURRENCIES.EUR.code },
    createInitialState,
  );

  const changeCurrencyRequest = useChangeCurrency();

  useEffect(() => {
    if (state.isLoading) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [state.isLoading]);

  useEffect(() => {
    if (changeCurrencyRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [changeCurrencyRequest.isError]);

  useEffect(() => {
    if (!changeCurrencyRequest.data) return;
    dispatch({
      type: StateActionType.RequestSuccess,
    });
    partiallyUpdateUserSessionData({ currency: state.currency.code });
  }, [changeCurrencyRequest.data]);

  const onButtonClick = () => {
    changeCurrencyRequest.mutate(state.currency.code);
    dispatch({ type: StateActionType.RequestStarted });
  };

  return (
    <div className="grid w-full max-w-2xl gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="currency">{t('common.currency')}</Label>
        <Select
          value={state.currency.code}
          onValueChange={(code) => {
            const next = currencyOptions.find((c) => c.code === code);
            if (next) {
              dispatch({
                type: StateActionType.CurrencyUpdated,
                payload: next,
              });
            }
          }}
        >
          <SelectTrigger id="currency" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currencyOptions.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {`${c.name} (${c.symbol}/${c.code})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={onButtonClick}>
          {t('profile.changeCurrencyCTA')}
        </Button>
      </div>
    </div>
  );
};

export default ChangeCurrencyForm;
