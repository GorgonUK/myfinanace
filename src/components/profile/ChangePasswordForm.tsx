import { useLoading } from '../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../providers/SnackbarProvider.tsx';
import { useTranslation } from 'react-i18next';
import { useEffect, useReducer } from 'react';
import { useChangePassword, useLogout } from '@/hooks/auth';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';

type UiState = {
  isLoading: boolean;
  currentPassword: string;
  newPassword1: string;
  newPassword2: string;
  isCtaButtonEnabled: boolean;
};

const enum StateActionType {
  RequestStarted,
  RequestSuccess,
  RequestFailure,
  CurrentPasswordUpdated,
  NewPassword1Updated,
  NewPassword2Updated,
}

type StateAction =
  | { type: StateActionType.RequestStarted }
  | { type: StateActionType.RequestSuccess }
  | { type: StateActionType.RequestFailure }
  | { type: StateActionType.CurrentPasswordUpdated; payload: string }
  | { type: StateActionType.NewPassword1Updated; payload: string }
  | { type: StateActionType.NewPassword2Updated; payload: string };

const createInitialState = (): UiState => {
  return {
    isLoading: false,
    isCtaButtonEnabled: false,
    currentPassword: '',
    newPassword1: '',
    newPassword2: '',
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
    case StateActionType.RequestFailure:
      return {
        ...prevState,
        isLoading: false,
      };
    case StateActionType.CurrentPasswordUpdated:
      return {
        ...prevState,
        currentPassword: action.payload,
        isCtaButtonEnabled:
          action.payload != '' &&
          prevState.newPassword1 != '' &&
          prevState.newPassword2 != '',
      };
    case StateActionType.NewPassword1Updated:
      return {
        ...prevState,
        newPassword1: action.payload,
        isCtaButtonEnabled:
          action.payload != '' &&
          prevState.currentPassword != '' &&
          prevState.newPassword2 != '',
      };
    case StateActionType.NewPassword2Updated:
      return {
        ...prevState,
        newPassword2: action.payload,
        isCtaButtonEnabled:
          action.payload != '' &&
          prevState.newPassword1 != '' &&
          prevState.currentPassword != '',
      };
  }
};

const ChangePasswordForm = () => {
  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();

  const [state, dispatch] = useReducer(reduceState, null, createInitialState);

  const logout = useLogout();
  const changePasswordRequest = useChangePassword();

  useEffect(() => {
    if (state.isLoading) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [state.isLoading]);

  useEffect(() => {
    if (changePasswordRequest.isError) {
      dispatch({ type: StateActionType.RequestFailure });
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [changePasswordRequest.isError]);

  useEffect(() => {
    if (!changePasswordRequest.isSuccess) return;
    dispatch({ type: StateActionType.RequestSuccess });
    snackbar.showSnackbar(
      t('profile.changePasswordSuccessMessage'),
      AlertSeverity.SUCCESS,
    );
    logout();
  }, [changePasswordRequest.isSuccess]);

  const onButtonClick = () => {
    if (state.newPassword1 != state.newPassword2) {
      snackbar.showSnackbar(
        t('profile.passwordsDoNotMatchMessage'),
        AlertSeverity.ERROR,
      );
      return;
    }
    changePasswordRequest.mutate({
      currentPassword: state.currentPassword,
      newPassword1: state.newPassword1,
      newPassword2: state.newPassword2,
    });
    dispatch({ type: StateActionType.RequestStarted });
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 space-y-2">
        <Label htmlFor="cp-current">{t('profile.currentPassword')}</Label>
        <Input
          id="cp-current"
          type="password"
          required
          value={state.currentPassword}
          onChange={(e) =>
            dispatch({
              type: StateActionType.CurrentPasswordUpdated,
              payload: e.target.value,
            })
          }
        />
      </div>
      <div className="col-span-12 space-y-2 md:col-span-6">
        <Label htmlFor="cp-new1">{t('profile.newPassword')}</Label>
        <Input
          id="cp-new1"
          type="password"
          required
          value={state.newPassword1}
          onChange={(e) =>
            dispatch({
              type: StateActionType.NewPassword1Updated,
              payload: e.target.value,
            })
          }
        />
      </div>
      <div className="col-span-12 space-y-2 md:col-span-6">
        <Label htmlFor="cp-new2">{t('profile.newPasswordConfirmation')}</Label>
        <Input
          id="cp-new2"
          type="password"
          required
          value={state.newPassword2}
          onChange={(e) =>
            dispatch({
              type: StateActionType.NewPassword2Updated,
              payload: e.target.value,
            })
          }
        />
      </div>
      <div className="col-span-12 flex justify-end">
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
  );
};

export default ChangePasswordForm;
