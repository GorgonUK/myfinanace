import { useLoading } from '../../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../../providers/SnackbarProvider.tsx';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useReducer } from 'react';
import {
  NamedBalanceSnapshot,
  useGetBalanceSnapshots,
} from '@/hooks/stats';
import PatrimonyEvolutionList, {
  PatrimonyEvoChartDataItem,
} from './PatrimonyEvolutionList.tsx';
import { NamedAccountSnapshot } from '@/common/api/stats';
import PatrimonyEvolutionChart from './PatrimonyEvolutionChart.tsx';
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
  filteredAccountId?: bigint;
  snapshotData?: NamedBalanceSnapshot;
};

const enum StateActionType {
  DataLoaded,
  AccountSelected,
}

type StateAction =
  | {
      type: StateActionType.DataLoaded;
      payload: NamedBalanceSnapshot;
    }
  | { type: StateActionType.AccountSelected; payload?: bigint };

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
        snapshotData: action.payload,
      };
    case StateActionType.AccountSelected:
      return {
        ...prevState,
        filteredAccountId: action.payload,
      };
  }
};

const getAggregatedSnapshotBalance = (
  snapshot: NamedAccountSnapshot[],
  filteredAccountId?: bigint,
) => {
  return snapshot.reduce((acc, cur) => {
    if (!filteredAccountId) {
      return acc + Number(cur.balance);
    }
    return cur.account_id === filteredAccountId
      ? acc + Number(cur.balance)
      : acc;
  }, 0);
};

const ALL_ACCOUNTS = '__all__';

const PatrimonyEvolutionStats = () => {
  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();

  const getBalanceSnapshotsRequest = useGetBalanceSnapshots();

  const [state, dispatch] = useReducer(reduceState, null, createInitialState);

  useEffect(() => {
    if (state.isLoading) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [state.isLoading]);

  useEffect(() => {
    if (getBalanceSnapshotsRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [getBalanceSnapshotsRequest.isError]);

  useEffect(() => {
    if (!getBalanceSnapshotsRequest.data) return;
    dispatch({
      type: StateActionType.DataLoaded,
      payload: getBalanceSnapshotsRequest.data,
    });
  }, [getBalanceSnapshotsRequest.data]);

  const patrimonyEvoData: PatrimonyEvoChartDataItem[] = useMemo(() => {
    if (!state.snapshotData || state.snapshotData.snapshots.length < 1)
      return [];
    let prevBalance: number;

    return state.snapshotData.snapshots.map((snapshot) => {
      const finalBalance = getAggregatedSnapshotBalance(
        snapshot.account_snapshots,
        state.filteredAccountId,
      );
      const data = {
        month: snapshot.month,
        year: snapshot.year,
        previousBalance: prevBalance,
        finalBalance: finalBalance,
        monthBalance: finalBalance - prevBalance,
        growthRate: ((finalBalance - prevBalance) / prevBalance) * -100,
      };
      prevBalance = finalBalance;
      return data;
    });
  }, [state.snapshotData, state.filteredAccountId]);

  const selectValue =
    state.filteredAccountId != null
      ? String(state.filteredAccountId)
      : ALL_ACCOUNTS;

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="account-filter">{t('stats.allAccounts')}</Label>
        <Select
          value={selectValue}
          onValueChange={(v) => {
            if (v === ALL_ACCOUNTS) {
              dispatch({
                type: StateActionType.AccountSelected,
                payload: undefined,
              });
            } else {
              dispatch({
                type: StateActionType.AccountSelected,
                payload: BigInt(v),
              });
            }
          }}
        >
          <SelectTrigger id="account-filter" className="w-full max-w-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ACCOUNTS}>{t('stats.allAccounts')}</SelectItem>
            {(state.snapshotData?.accounts ?? []).map((account) => (
              <SelectItem
                key={String(account.account_id)}
                value={String(account.account_id)}
              >
                {account.name || ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="h-[400px]">
        <PatrimonyEvolutionChart list={patrimonyEvoData} />
      </div>
      <div className="mt-4">
        <PatrimonyEvolutionList list={patrimonyEvoData} />
      </div>
    </div>
  );
};

export default PatrimonyEvolutionStats;
