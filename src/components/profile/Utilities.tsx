import { useLoading } from '../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../providers/SnackbarProvider.tsx';
import { useTranslation } from 'react-i18next';
import { useEffect, useReducer, type ComponentType } from 'react';
import {
  Calculator,
  CloudDownload,
  RotateCcw,
  Rocket,
} from 'lucide-react';
import {
  useAutoPopulateWithDemoData,
  useRecalculateAllBalances,
} from '@/hooks/account';
import GenericConfirmationDialog from '../../components/GenericConfirmationDialog.tsx';
import { useLogout } from '@/hooks/auth';
import { useGetBackupData } from '@/hooks/user';
import { downloadJsonFile } from '../../utils/fileUtils.ts';
import dayjs from 'dayjs';
import RestoreUserDialog from './RestoreUserDialog.tsx';
import { useUserData } from '../../providers/UserProvider.tsx';
import { Separator } from '@/common/shadcn/ui/separator.tsx';
import { cn } from '@/common/shadcn/lib/utils';

type UiState = {
  isLoading: boolean;
  isDemoDataConfirmationDialogOpen: boolean;
  isBackupUserConfirmationDialogOpen: boolean;
  isRestoreUserDialogOpen: boolean;
};

const enum StateActionType {
  RequestStarted,
  RequestSuccess,
  RequestFailure,
  ConfirmationDialogClosed,
  PopulateDemoDataClicked,
  BackupUserClicked,
  RestoreUserClicked,
}

type StateAction =
  | { type: StateActionType.RequestStarted }
  | { type: StateActionType.ConfirmationDialogClosed }
  | { type: StateActionType.PopulateDemoDataClicked }
  | { type: StateActionType.RequestSuccess }
  | { type: StateActionType.RequestFailure }
  | { type: StateActionType.BackupUserClicked }
  | { type: StateActionType.RestoreUserClicked };

const createInitialState = (): UiState => {
  return {
    isLoading: false,
    isDemoDataConfirmationDialogOpen: false,
    isBackupUserConfirmationDialogOpen: false,
    isRestoreUserDialogOpen: false,
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
      return {
        ...prevState,
        isLoading: false,
      };
    case StateActionType.RequestFailure:
      return {
        ...prevState,
        isLoading: false,
      };
    case StateActionType.ConfirmationDialogClosed:
      return {
        ...prevState,
        isDemoDataConfirmationDialogOpen: false,
        isBackupUserConfirmationDialogOpen: false,
        isRestoreUserDialogOpen: false,
      };
    case StateActionType.PopulateDemoDataClicked:
      return {
        ...prevState,
        isDemoDataConfirmationDialogOpen: true,
      };
    case StateActionType.BackupUserClicked:
      return {
        ...prevState,
        isBackupUserConfirmationDialogOpen: true,
      };
    case StateActionType.RestoreUserClicked:
      return {
        ...prevState,
        isRestoreUserDialogOpen: true,
      };
  }
};

const generateBackupFileName = (username: string) => {
  return `myfin_${username}_${dayjs().format('YYYY_MM_DD_HH_mm_ss')}.json`;
};

function UtilityRow({
  icon: Icon,
  primary,
  secondary,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  primary: string;
  secondary: string;
  onClick: () => void;
}) {
  return (
    <li className="border-b border-border last:border-0">
      <button
        type="button"
        className={cn(
          'flex w-full items-start gap-3 rounded-md px-2 py-3 text-left',
          'hover:bg-accent hover:text-accent-foreground',
        )}
        onClick={onClick}
      >
        <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <span>
          <span className="block font-medium">{primary}</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {secondary}
          </span>
        </span>
      </button>
    </li>
  );
}

const Utilities = () => {
  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();

  const [state, dispatch] = useReducer(reduceState, null, createInitialState);

  const recalculateAllBalancesRequest = useRecalculateAllBalances();
  const autoPopulateWithDemoData = useAutoPopulateWithDemoData();
  const backupUserData = useGetBackupData();
  const logout = useLogout();
  const { userSessionData } = useUserData();

  useEffect(() => {
    if (state.isLoading) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [state.isLoading]);

  useEffect(() => {
    if (
      recalculateAllBalancesRequest.isError ||
      autoPopulateWithDemoData.isError
    ) {
      dispatch({ type: StateActionType.RequestFailure });
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [recalculateAllBalancesRequest.isError, autoPopulateWithDemoData.isError]);

  useEffect(() => {
    if (recalculateAllBalancesRequest.isSuccess) {
      dispatch({ type: StateActionType.RequestSuccess });
      snackbar.showSnackbar(
        t('common.taskSuccessfullyCompleted'),
        AlertSeverity.SUCCESS,
      );
    }
  }, [recalculateAllBalancesRequest.data]);

  useEffect(() => {
    if (autoPopulateWithDemoData.isSuccess) {
      dispatch({ type: StateActionType.RequestSuccess });
      snackbar.showSnackbar(
        t('common.taskSuccessfullyCompleted'),
        AlertSeverity.SUCCESS,
      );
      logout();
    }
  }, [autoPopulateWithDemoData.data]);

  useEffect(() => {
    if (backupUserData.isSuccess && backupUserData.data) {
      dispatch({ type: StateActionType.RequestSuccess });
      snackbar.showSnackbar(
        t('common.taskSuccessfullyCompleted'),
        AlertSeverity.SUCCESS,
      );
      downloadJsonFile(
        backupUserData.data,
        generateBackupFileName(userSessionData?.username ?? ''),
      );
    }
  }, [backupUserData.isSuccess]);

  return (
    <>
      {state.isRestoreUserDialogOpen && (
        <RestoreUserDialog
          isOpen={state.isRestoreUserDialogOpen}
          onClose={() =>
            dispatch({ type: StateActionType.ConfirmationDialogClosed })
          }
        />
      )}
      {state.isBackupUserConfirmationDialogOpen && (
        <GenericConfirmationDialog
          isOpen={state.isBackupUserConfirmationDialogOpen}
          onClose={() =>
            dispatch({ type: StateActionType.ConfirmationDialogClosed })
          }
          onPositiveClick={() => {
            dispatch({ type: StateActionType.ConfirmationDialogClosed });
            dispatch({ type: StateActionType.RequestStarted });
            backupUserData.mutate();
          }}
          onNegativeClick={() =>
            dispatch({ type: StateActionType.ConfirmationDialogClosed })
          }
          titleText={t('profile.exportDataConfirmationTitle')}
          descriptionText={t('profile.exportDataConfirmationSubtitle')}
          positiveText={t('common.confirm')}
          alert={''}
        />
      )}
      {state.isDemoDataConfirmationDialogOpen && (
        <GenericConfirmationDialog
          isOpen={state.isDemoDataConfirmationDialogOpen}
          onClose={() =>
            dispatch({ type: StateActionType.ConfirmationDialogClosed })
          }
          onPositiveClick={() => {
            dispatch({ type: StateActionType.ConfirmationDialogClosed });
            dispatch({ type: StateActionType.RequestStarted });
            autoPopulateWithDemoData.mutate();
          }}
          onNegativeClick={() =>
            dispatch({ type: StateActionType.ConfirmationDialogClosed })
          }
          titleText={t('profile.demoDataConfirmationTitle')}
          descriptionText={t('profile.demoDataConfirmationSubtitle')}
          positiveText={t('common.confirm')}
        />
      )}
      <ul className="divide-y divide-border rounded-md border border-border">
        <UtilityRow
          icon={Calculator}
          primary={t('profile.recalculateBalancesOfAllAccounts')}
          secondary={t(
            'profile.recalculateBalancesOfAllAccountsDescription',
          )}
          onClick={() => {
            dispatch({ type: StateActionType.RequestStarted });
            recalculateAllBalancesRequest.mutate();
          }}
        />
        <UtilityRow
          icon={Rocket}
          primary={t('profile.autoPopulateDemoData')}
          secondary={t('profile.autoPopulateDemoDataDescription')}
          onClick={() => {
            dispatch({ type: StateActionType.PopulateDemoDataClicked });
          }}
        />
      </ul>
      <Separator className="my-4" />
      <ul className="divide-y divide-border rounded-md border border-border">
        <UtilityRow
          icon={CloudDownload}
          primary={t('profile.exportDataTitle')}
          secondary={t('profile.exportDataDescription')}
          onClick={() => {
            dispatch({ type: StateActionType.BackupUserClicked });
          }}
        />
        <UtilityRow
          icon={RotateCcw}
          primary={t('profile.importDataTitle')}
          secondary={t('profile.importDataDescription')}
          onClick={() => {
            dispatch({ type: StateActionType.RestoreUserClicked });
          }}
        />
      </ul>
    </>
  );
};

export default Utilities;
