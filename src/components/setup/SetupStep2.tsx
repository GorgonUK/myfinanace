import { useLoading } from '../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../providers/SnackbarProvider.tsx';
import { useTranslation } from 'react-i18next';
import { useEffect, useReducer } from 'react';
import { ChevronsRight } from 'lucide-react';
import { useInitSetup } from '@/hooks/auth';
import { Currency } from '@/config/Currency.ts';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';

type UiState = {
  isLoading: boolean;
  password1: string;
  password2: string;
  isNextButtonEnabled: boolean;
};

const enum StateActionType {
  Password1Updated,
  Password2Updated,
  RequestStarted,
  RequestFailure,
  RequestSuccess,
}

type StateAction =
  | { type: StateActionType.RequestStarted }
  | { type: StateActionType.RequestFailure }
  | { type: StateActionType.RequestSuccess }
  | { type: StateActionType.Password1Updated; payload: string }
  | { type: StateActionType.Password2Updated; payload: string };

const createInitialState = (): UiState => {
  return {
    isLoading: false,
    password1: '',
    password2: '',
    isNextButtonEnabled: false,
  };
};

const isInputValid = (password1: string, password2: string) => {
  return password1.length > 0 && password2 == password1;
};

const reduceState = (prevState: UiState, action: StateAction): UiState => {
  switch (action.type) {
    case StateActionType.Password1Updated:
      return {
        ...prevState,
        password1: action.payload,
        isNextButtonEnabled: isInputValid(action.payload, prevState.password2),
      };
    case StateActionType.Password2Updated:
      return {
        ...prevState,
        password2: action.payload,
        isNextButtonEnabled: isInputValid(prevState.password1, action.payload),
      };
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
  }
};

type Props = {
  username: string;
  email: string;
  currency: Currency;
  onNext: () => void;
};

const SetupStep2 = (props: Props) => {
  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();

  const [state, dispatch] = useReducer(reduceState, null, createInitialState);

  const initSetupRequest = useInitSetup();

  useEffect(() => {
    if (state.isLoading) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [state.isLoading]);

  useEffect(() => {
    if (initSetupRequest.isError) {
      dispatch({
        type: StateActionType.RequestFailure,
      });
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [initSetupRequest.isError]);

  useEffect(() => {
    if (!initSetupRequest.data) return;
    dispatch({
      type: StateActionType.RequestSuccess,
    });
    setTimeout(() => {
      props.onNext();
    }, 0);
  }, [initSetupRequest.data]);

  const handleButtonClick = () => {
    dispatch({ type: StateActionType.RequestStarted });
    initSetupRequest.mutate({
      username: props.username,
      email: props.email,
      password: state.password1,
      currency: props.currency.code,
    });
  };

  return (
    <div className="p-1">
      <div className="flex flex-col gap-4">
        <p className="pb-8 text-base">{t('setup.step1Description')}</p>
        <div className="space-y-2">
          <Label htmlFor="setup-password">Password</Label>
          <Input
            id="setup-password"
            name="password"
            type="password"
            value={state.password1}
            onChange={(e) =>
              dispatch({
                type: StateActionType.Password1Updated,
                payload: e.target.value,
              })
            }
            aria-invalid={state.password1 != state.password2 && state.password2 !== ''}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="setup-password2">
            {t('setup.step2PasswordConfirmationLabel')}
          </Label>
          <Input
            id="setup-password2"
            name="password2"
            type="password"
            value={state.password2}
            onChange={(e) =>
              dispatch({
                type: StateActionType.Password2Updated,
                payload: e.target.value,
              })
            }
            aria-invalid={state.password1 != state.password2 && state.password1 !== ''}
          />
        </div>
        <div className="mt-4 flex justify-center">
          <Button
            size="lg"
            className="gap-2"
            disabled={!state.isNextButtonEnabled}
            onClick={() => handleButtonClick()}
          >
            {t('common.next')}
            <ChevronsRight className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SetupStep2;
