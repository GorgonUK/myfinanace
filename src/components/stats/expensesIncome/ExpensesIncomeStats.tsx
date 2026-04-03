import { useTranslation } from 'react-i18next';
import { useEffect, useReducer } from 'react';
import {
  CategoryExpensesIncomeEvolutionItem,
  GetCategoriesEntitiesTagsResponse,
} from '@/common/api/stats';
import {
  useGetCategoriesEntitiesTags,
  useGetCategoryExpensesEvolution,
  useGetCategoryIncomeEvolution,
  useGetEntityExpensesEvolution,
  useGetEntityIncomeEvolution,
  useGetTagExpensesEvolution,
  useGetTagIncomeEvolution,
} from '@/hooks/stats';
import { useLoading } from '../../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../../providers/SnackbarProvider.tsx';
import ExpensesIncomeChart from './ExpensesIncomeChart.tsx';
import ExpensesIncomeList from './ExpensesIncomeList.tsx';
import { ToggleGroup, ToggleGroupItem } from '@/common/shadcn/ui/toggle-group.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/common/shadcn/ui/select.tsx';

export enum ExpensesIncomeStatPeriod {
  Month = 'month',
  Year = 'year',
}

export enum TrxType {
  Income = 'income',
  Expenses = 'expenses',
}

enum Identifier {
  Category = 'category',
  Entity = 'entity',
  Tag = 'tag',
}

type IdentifierOption = {
  id: bigint;
  name: string;
  identifier: Identifier;
};

type UiState = {
  isLoading: boolean;
  type: TrxType;
  selectedIdentifier: IdentifierOption | null;
  selectedPeriod: ExpensesIncomeStatPeriod;
  identifierList: IdentifierOption[];
  statData?: CategoryExpensesIncomeEvolutionItem[];
  rawStatData?: CategoryExpensesIncomeEvolutionItem[];
};

const enum StateActionType {
  IdentifierSelected,
  PeriodSelected,
  RequestStarted,
  InitialRequestSuccess,
  RequestSuccess,
}

type StateAction =
  | { type: StateActionType.RequestStarted }
  | {
      type: StateActionType.InitialRequestSuccess;
      payload: GetCategoriesEntitiesTagsResponse;
    }
  | {
      type: StateActionType.RequestSuccess;
      payload: CategoryExpensesIncomeEvolutionItem[];
    }
  | {
      type: StateActionType.IdentifierSelected;
      payload: IdentifierOption | null;
    }
  | { type: StateActionType.PeriodSelected; payload: ExpensesIncomeStatPeriod };

const createInitialState = (args: { type: TrxType }): UiState => {
  return {
    isLoading: true,
    type: args.type,
    selectedPeriod: ExpensesIncomeStatPeriod.Month,
    identifierList: [],
    selectedIdentifier: null,
  };
};

const aggregateDataByYear = (data: CategoryExpensesIncomeEvolutionItem[]) => {
  const yearTotals = new Map<number, number>();

  data.forEach(({ year, value }) => {
    const currentTotal = yearTotals.get(year) || 0;
    yearTotals.set(year, currentTotal + value);
  });

  return Array.from(yearTotals.entries()).map(([year, value]) => ({
    month: -1,
    year,
    value,
  }));
};

const processStatData = (
  rawData: CategoryExpensesIncomeEvolutionItem[],
  selectedPeriod: ExpensesIncomeStatPeriod,
) => {
  return selectedPeriod == ExpensesIncomeStatPeriod.Month
    ? rawData
    : aggregateDataByYear(rawData);
};

const reduceState = (prevState: UiState, action: StateAction): UiState => {
  switch (action.type) {
    case StateActionType.RequestStarted:
      return {
        ...prevState,
        isLoading: true,
      };
    case StateActionType.InitialRequestSuccess: {
      const categoryIdentifiers = action.payload.categories.map((c) => ({
        id: c.category_id,
        name: c.name,
        identifier: Identifier.Category,
      }));
      const entityIdentifiers = action.payload.entities.map((c) => ({
        id: c.entity_id,
        name: c.name,
        identifier: Identifier.Entity,
      }));
      const tagIdentifiers = action.payload.tags.map((c) => ({
        id: c.tag_id,
        name: c.name,
        identifier: Identifier.Tag,
      }));
      return {
        ...prevState,
        isLoading: false,
        identifierList: [
          ...categoryIdentifiers,
          ...entityIdentifiers,
          ...tagIdentifiers,
        ],
      };
    }

    case StateActionType.RequestSuccess:
      return {
        ...prevState,
        isLoading: false,
        rawStatData: action.payload,
        statData: processStatData(action.payload, prevState.selectedPeriod),
      };
    case StateActionType.IdentifierSelected:
      return {
        ...prevState,
        selectedIdentifier: action.payload,
      };
    case StateActionType.PeriodSelected: {
      return {
        ...prevState,
        selectedPeriod: action.payload,
        statData: processStatData(prevState.rawStatData ?? [], action.payload),
      };
    }
  }
};

const optionKey = (o: IdentifierOption) =>
  `${o.identifier}:${o.id.toString()}`;

const parseOptionKey = (
  key: string,
  list: IdentifierOption[],
): IdentifierOption | null => {
  const found = list.find((o) => optionKey(o) === key);
  return found ?? null;
};

type Props = {
  trxType: TrxType;
};

const ExpensesIncomeStats = (props: Props) => {
  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();

  const [state, dispatch] = useReducer(
    reduceState,
    { type: props.trxType },
    createInitialState,
  );

  const getCategoriesEntitiesTagsRequest = useGetCategoriesEntitiesTags();
  const getCategoryExpensesEvolutionRequest = useGetCategoryExpensesEvolution(
    state.selectedIdentifier?.identifier == Identifier.Category &&
      props.trxType == TrxType.Expenses
      ? state.selectedIdentifier.id
      : null,
  );
  const getEntityExpensesEvolutionRequest = useGetEntityExpensesEvolution(
    state.selectedIdentifier?.identifier == Identifier.Entity &&
      props.trxType == TrxType.Expenses
      ? state.selectedIdentifier.id
      : null,
  );
  const getTagExpensesEvolutionRequest = useGetTagExpensesEvolution(
    state.selectedIdentifier?.identifier == Identifier.Tag &&
      props.trxType == TrxType.Expenses
      ? state.selectedIdentifier.id
      : null,
  );
  const getCategoryIncomeEvolutionRequest = useGetCategoryIncomeEvolution(
    state.selectedIdentifier?.identifier == Identifier.Category &&
      props.trxType == TrxType.Income
      ? state.selectedIdentifier.id
      : null,
  );
  const getEntityIncomeEvolutionRequest = useGetEntityIncomeEvolution(
    state.selectedIdentifier?.identifier == Identifier.Entity &&
      props.trxType == TrxType.Income
      ? state.selectedIdentifier.id
      : null,
  );
  const getTagIncomeEvolutionRequest = useGetTagIncomeEvolution(
    state.selectedIdentifier?.identifier == Identifier.Tag &&
      props.trxType == TrxType.Income
      ? state.selectedIdentifier.id
      : null,
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
      getCategoryExpensesEvolutionRequest.isError ||
      getEntityExpensesEvolutionRequest.isError ||
      getTagExpensesEvolutionRequest.isError ||
      getCategoriesEntitiesTagsRequest.isError ||
      getCategoryIncomeEvolutionRequest.isError ||
      getEntityIncomeEvolutionRequest.isError ||
      getTagIncomeEvolutionRequest.isError
    ) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [
    getCategoryExpensesEvolutionRequest.isError,
    getEntityExpensesEvolutionRequest.isError,
    getTagExpensesEvolutionRequest.isError,
    getCategoriesEntitiesTagsRequest.isError,
    getCategoryIncomeEvolutionRequest.isError,
    getEntityIncomeEvolutionRequest.isError,
    getTagIncomeEvolutionRequest.isError,
  ]);

  useEffect(() => {
    if (!getCategoriesEntitiesTagsRequest.data) return;
    dispatch({
      type: StateActionType.InitialRequestSuccess,
      payload: getCategoriesEntitiesTagsRequest.data,
    });
  }, [getCategoriesEntitiesTagsRequest.data]);

  useEffect(() => {
    if (!getCategoryExpensesEvolutionRequest.data) return;
    dispatch({
      type: StateActionType.RequestSuccess,
      payload: getCategoryExpensesEvolutionRequest.data,
    });
  }, [getCategoryExpensesEvolutionRequest.data]);

  useEffect(() => {
    if (!getEntityExpensesEvolutionRequest.data) return;
    dispatch({
      type: StateActionType.RequestSuccess,
      payload: getEntityExpensesEvolutionRequest.data,
    });
  }, [getEntityExpensesEvolutionRequest.data]);

  useEffect(() => {
    if (!getTagExpensesEvolutionRequest.data) return;
    dispatch({
      type: StateActionType.RequestSuccess,
      payload: getTagExpensesEvolutionRequest.data,
    });
  }, [getTagExpensesEvolutionRequest.data]);

  useEffect(() => {
    if (!getCategoryIncomeEvolutionRequest.data) return;
    dispatch({
      type: StateActionType.RequestSuccess,
      payload: getCategoryIncomeEvolutionRequest.data,
    });
  }, [getCategoryIncomeEvolutionRequest.data]);

  useEffect(() => {
    if (!getEntityIncomeEvolutionRequest.data) return;
    dispatch({
      type: StateActionType.RequestSuccess,
      payload: getEntityIncomeEvolutionRequest.data,
    });
  }, [getEntityIncomeEvolutionRequest.data]);

  useEffect(() => {
    if (!getTagIncomeEvolutionRequest.data) return;
    dispatch({
      type: StateActionType.RequestSuccess,
      payload: getTagIncomeEvolutionRequest.data,
    });
  }, [getTagIncomeEvolutionRequest.data]);

  useEffect(() => {
    if (!state.selectedIdentifier) return;
    dispatch({ type: StateActionType.RequestStarted });
  }, [state.selectedIdentifier]);

  const categories = state.identifierList.filter(
    (o) => o.identifier === Identifier.Category,
  );
  const entities = state.identifierList.filter(
    (o) => o.identifier === Identifier.Entity,
  );
  const tags = state.identifierList.filter((o) => o.identifier === Identifier.Tag);

  const selectVal = state.selectedIdentifier
    ? optionKey(state.selectedIdentifier)
    : '';

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-sm">
            {t('stats.month')} / {t('stats.year')}
          </span>
          <ToggleGroup
            type="single"
            value={state.selectedPeriod}
            onValueChange={(v) => {
              if (
                v &&
                Object.values(ExpensesIncomeStatPeriod).includes(
                  v as ExpensesIncomeStatPeriod,
                )
              ) {
                dispatch({
                  type: StateActionType.PeriodSelected,
                  payload: v as ExpensesIncomeStatPeriod,
                });
              }
            }}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem
              value={ExpensesIncomeStatPeriod.Month}
              aria-label={t('stats.month')}
            >
              {t('stats.month')}
            </ToggleGroupItem>
            <ToggleGroupItem
              value={ExpensesIncomeStatPeriod.Year}
              aria-label={t('stats.year')}
            >
              {t('stats.year')}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="min-w-0 flex-1 flex-col gap-2 md:max-w-xl">
          <Label htmlFor="identifier-select">{t('stats.chooseACategory')}</Label>
          <Select
            value={selectVal || undefined}
            onValueChange={(v) => {
              dispatch({
                type: StateActionType.IdentifierSelected,
                payload: parseOptionKey(v, state.identifierList),
              });
            }}
          >
            <SelectTrigger id="identifier-select" className="w-full">
              <SelectValue placeholder={t('stats.chooseACategory')} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{t('transactions.category')}</SelectLabel>
                {categories.map((o) => (
                  <SelectItem key={optionKey(o)} value={optionKey(o)}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>{t('transactions.entity')}</SelectLabel>
                {entities.map((o) => (
                  <SelectItem key={optionKey(o)} value={optionKey(o)}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>{t('tags.tag')}</SelectLabel>
                {tags.map((o) => (
                  <SelectItem key={optionKey(o)} value={optionKey(o)}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {state.statData && (
        <>
          <div>
            <ExpensesIncomeChart
              list={state.statData}
              period={state.selectedPeriod}
            />
          </div>
          <div>
            <ExpensesIncomeList
              list={state.statData}
              period={state.selectedPeriod}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ExpensesIncomeStats;
