import { useAppTheme } from '@/theme';
import { useLoading } from '../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../providers/SnackbarProvider.tsx';
import { useTranslation } from 'react-i18next';
import { useEffect, useReducer } from 'react';
import PageHeader from '../../components/PageHeader.tsx';
import {
  useSendRecoveryOtp,
  useSetRecoveryNewPassword,
} from '@/hooks/auth';
import { useNavigate } from 'react-router-dom';
import { ROUTE_AUTH } from '../../providers/RoutesProvider.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
import { Card } from '@/common/shadcn/ui/card.tsx';
import { Separator } from '@/common/shadcn/ui/separator.tsx';
import { Badge } from '@/common/shadcn/ui/badge.tsx';

type UiState = {
  isLoading: boolean;
  username: string;
  isUsernameEnabled: boolean;
  isNewPasswordEnabled: boolean;
  otpCode: string;
  newPassword1: string;
  newPassword2: string;
  isSendOtpButtonEnabled: boolean;
  isCtaButtonEnabled: boolean;
};

const enum StateActionType {
  RequestStarted,
  SetPasswordRequestSuccess,
  SendOtpRequestSuccess,
  RequestFailure,
  UsernameUpdated,
  OtpUpdated,
  Password1Updated,
  Password2Updated,
}

type StateAction =
  | { type: StateActionType.RequestStarted }
  | { type: StateActionType.SetPasswordRequestSuccess }
  | { type: StateActionType.SendOtpRequestSuccess }
  | { type: StateActionType.RequestFailure }
  | { type: StateActionType.UsernameUpdated; payload: string }
  | { type: StateActionType.OtpUpdated; payload: string }
  | { type: StateActionType.Password1Updated; payload: string }
  | { type: StateActionType.Password2Updated; payload: string };

const createInitialState = (): UiState => {
  return {
    isLoading: false,
    username: '',
    isUsernameEnabled: true,
    isNewPasswordEnabled: false,
    otpCode: '',
    newPassword1: '',
    newPassword2: '',
    isSendOtpButtonEnabled: false,
    isCtaButtonEnabled: false,
  };
};

const reduceState = (prevState: UiState, action: StateAction): UiState => {
  switch (action.type) {
    case StateActionType.RequestStarted:
      return {
        ...prevState,
        isLoading: true,
      };
    case StateActionType.SendOtpRequestSuccess:
      return {
        ...prevState,
        isLoading: false,
        isUsernameEnabled: false,
        isNewPasswordEnabled: true,
        isSendOtpButtonEnabled: false,
      };
    case StateActionType.SetPasswordRequestSuccess:
    case StateActionType.RequestFailure:
      return {
        ...prevState,
        isLoading: false,
      };
    case StateActionType.UsernameUpdated:
      return {
        ...prevState,
        username: action.payload,
        isSendOtpButtonEnabled: action.payload.length > 0,
      };
    case StateActionType.OtpUpdated:
      return {
        ...prevState,
        otpCode: action.payload,
        isCtaButtonEnabled:
          action.payload.length > 0 &&
          prevState.newPassword1.length > 0 &&
          prevState.newPassword2.length > 0,
      };
    case StateActionType.Password1Updated:
      return {
        ...prevState,
        newPassword1: action.payload,
        isCtaButtonEnabled:
          action.payload.length > 0 &&
          prevState.newPassword2.length > 0 &&
          prevState.otpCode.length > 0,
      };
    case StateActionType.Password2Updated:
      return {
        ...prevState,
        newPassword2: action.payload,
        isCtaButtonEnabled:
          action.payload.length > 0 &&
          prevState.newPassword1.length > 0 &&
          prevState.otpCode.length > 0,
      };
  }
};

const RecoverPassword = () => {
  const theme = useAppTheme();
  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const sendOtpRequest = useSendRecoveryOtp();
  const setNewPasswordRequest = useSetRecoveryNewPassword();

  const [state, dispatch] = useReducer(reduceState, null, createInitialState);

  useEffect(() => {
    if (state.isLoading) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [state.isLoading]);

  useEffect(() => {
    if (setNewPasswordRequest.isError || sendOtpRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
      dispatch({
        type: StateActionType.RequestFailure,
      });
    }
  }, [setNewPasswordRequest.isError, sendOtpRequest.isError]);

  useEffect(() => {
    if (!sendOtpRequest.isSuccess) return;
    dispatch({
      type: StateActionType.SendOtpRequestSuccess,
    });
    snackbar.showSnackbar(t('login.checkYourEmailForOtp'), AlertSeverity.INFO);
  }, [sendOtpRequest.isSuccess]);

  useEffect(() => {
    if (!setNewPasswordRequest.isSuccess) return;
    dispatch({
      type: StateActionType.SetPasswordRequestSuccess,
    });
    snackbar.showSnackbar(
      t('profile.changePasswordSuccessMessage'),
      AlertSeverity.SUCCESS,
    );
    navigate(ROUTE_AUTH);
  }, [setNewPasswordRequest.isSuccess]);

  const onSendOtpButtonClick = () => {
    sendOtpRequest.mutate(state.username);
    dispatch({ type: StateActionType.RequestStarted });
  };

  const onButtonClick = () => {
    if (state.newPassword1 != state.newPassword2) {
      snackbar.showSnackbar(
        t('profile.passwordsDoNotMatchMessage'),
        AlertSeverity.ERROR,
      );
      return;
    }
    setNewPasswordRequest.mutate({
      username: state.username,
      otp: state.otpCode,
      new_password1: state.newPassword1,
      new_password2: state.newPassword2,
    });
    dispatch({ type: StateActionType.RequestStarted });
  };

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="mx-auto max-w-md px-4">
        <div className="mt-10 flex flex-col items-center justify-center p-6">
          <img
            src={
              theme.palette.mode === 'dark'
                ? '/res/logo_light_transparentbg.png'
                : '/res/logo_dark_transparentbg.png'
            }
            width="60%"
            className="mb-5"
            alt=""
          />
        </div>
      </div>
      <Card className="m-4 mt-0 border bg-card p-4 shadow-sm">
        <div className="flex flex-col justify-between">
          <PageHeader
            title={t('login.accountRecovery')}
            subtitle={t('login.accountRecoveryStrapline')}
          />
        </div>
        <div className="mt-4 grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-8">
            <Label htmlFor="recover-username">{t('login.username')}</Label>
            <Input
              id="recover-username"
              type="text"
              autoComplete="username"
              className="mt-2"
              required
              disabled={!state.isUsernameEnabled}
              value={state.username}
              onChange={(e) =>
                dispatch({
                  type: StateActionType.UsernameUpdated,
                  payload: e.target.value,
                })
              }
            />
          </div>
          <div className="col-span-12 flex items-end md:col-span-4">
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full"
              disabled={!state.isSendOtpButtonEnabled}
              onClick={() => {
                onSendOtpButtonClick();
              }}
            >
              {t('login.sendOtp')}
            </Button>
          </div>
          {state.isNewPasswordEnabled ? (
            <div className="col-span-12 space-y-4">
              <div className="my-4 flex items-center gap-3">
                <Separator className="flex-1" />
                <Badge variant="secondary">{t('login.setNewPassword')}</Badge>
                <Separator className="flex-1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp">{t('login.otpCode')}</Label>
                <Input
                  id="otp"
                  type="text"
                  required
                  value={state.otpCode}
                  onChange={(e) =>
                    dispatch({
                      type: StateActionType.OtpUpdated,
                      payload: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 space-y-2 md:col-span-6">
                  <Label htmlFor="np1">{t('profile.newPassword')}</Label>
                  <Input
                    id="np1"
                    type="password"
                    required
                    value={state.newPassword1}
                    onChange={(e) =>
                      dispatch({
                        type: StateActionType.Password1Updated,
                        payload: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-span-12 space-y-2 md:col-span-6">
                  <Label htmlFor="np2">
                    {t('profile.newPasswordConfirmation')}
                  </Label>
                  <Input
                    id="np2"
                    type="password"
                    required
                    value={state.newPassword2}
                    onChange={(e) =>
                      dispatch({
                        type: StateActionType.Password2Updated,
                        payload: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={onButtonClick}
                  autoFocus
                  disabled={!state.isCtaButtonEnabled}
                >
                  {t('profile.changePasswordCTA')}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
};

export default RecoverPassword;
