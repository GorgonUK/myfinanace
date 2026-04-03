import { useLoading } from '../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../providers/SnackbarProvider.tsx';
import { useTranslation } from 'react-i18next';
import { useEffect, useReducer } from 'react';
import { UserStatsResponse } from '@/common/api/stats';
import { useGetUserStats } from '@/hooks/stats';

type UiState = {
  isLoading: boolean;
  data?: UserStatsResponse;
};

const enum StateActionType {
  DataLoaded,
}

type StateAction = {
  type: StateActionType.DataLoaded;
  payload: UserStatsResponse;
};

const createInitialState = (): UiState => {
  return {
    isLoading: true,
  };
};

const reduceState = (prevState: UiState, action: StateAction): UiState => {
  switch (action.type) {
    case StateActionType.DataLoaded:
      return {
        ...prevState,
        isLoading: false,
        data: action.payload,
      };
  }
};

const UserStatList = () => {
  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();

  const [state, dispatch] = useReducer(reduceState, null, createInitialState);

  const getUserStatsRequest = useGetUserStats();

  useEffect(() => {
    if (state.isLoading) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [state.isLoading]);

  useEffect(() => {
    if (getUserStatsRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [getUserStatsRequest.isError]);

  useEffect(() => {
    if (!getUserStatsRequest.data) return;
    dispatch({
      type: StateActionType.DataLoaded,
      payload: getUserStatsRequest.data,
    });
  }, [getUserStatsRequest.data]);

  const rows: [string, string][] = [
    [t('profile.nrTrxCreated'), String(state.data?.nr_of_trx ?? '-')],
    [t('profile.nrEntitiesCreated'), String(state.data?.nr_of_entities ?? '-')],
    [
      t('profile.nrCategoriesCreated'),
      String(state.data?.nr_of_categories ?? '-'),
    ],
    [t('profile.nrAccountsCreated'), String(state.data?.nr_of_accounts ?? '-')],
    [t('profile.nrBudgetsCreated'), String(state.data?.nr_of_budgets ?? '-')],
    [t('profile.nrRulesCreated'), String(state.data?.nr_of_rules ?? '-')],
    [t('profile.nrTagsCreated'), String(state.data?.nr_of_tags ?? '-')],
  ];

  return (
    <table className="w-full border-collapse text-sm">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-b border-border">
            <td className="py-2 pr-4 text-muted-foreground">{label}</td>
            <td className="py-2 text-right font-medium">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UserStatList;
