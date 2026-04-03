import { useTranslation } from 'react-i18next';
import { useEffect, useReducer } from 'react';
import {
  CategoryYearByYearDataItem,
  YearByYearStatsResponse,
} from '@/common/api/stats';
import { getCurrentYear } from '../../../utils/dateUtils.ts';
import {
  AlertSeverity,
  useSnackbar,
} from '../../../providers/SnackbarProvider.tsx';
import { useGetYearByYearData } from '@/hooks/stats';
import YearByYearSearchableList, {
  YearByYearSearchableListItem,
} from './YearByYearSearchableList.tsx';
import MyFinSankeyDiagram, {
  SankeyDiagramData,
  SankeyLink,
  SankeyNode,
} from '../../../components/MyFinSankeyDiagram.tsx';
import i18n from 'i18next';
import { useLoading } from '../../../providers/LoadingProvider.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/common/shadcn/ui/select.tsx';
import { Separator } from '@/common/shadcn/ui/separator.tsx';

type UiState = {
  isLoading: boolean;
  selectedYear: number;
  moneyFlowData?: SankeyDiagramData;
  categoryIncomeData?: YearByYearSearchableListItem[];
  categoryExpensesData?: YearByYearSearchableListItem[];
  entityIncomeData?: YearByYearSearchableListItem[];
  entityExpensesData?: YearByYearSearchableListItem[];
  tagIncomeData?: YearByYearSearchableListItem[];
  tagExpensesData?: YearByYearSearchableListItem[];
  minYear?: number;
  yearList?: number[];
};

const enum StateActionType {
  YearSelected,
  RequestStarted,
  RequestSuccess,
}

type StateAction =
  | { type: StateActionType.RequestStarted }
  | { type: StateActionType.RequestSuccess; payload: YearByYearStatsResponse }
  | { type: StateActionType.YearSelected; payload: number };

const createInitialState = (): UiState => {
  const y = getCurrentYear();
  return {
    isLoading: true,
    selectedYear: y,
    yearList: [y],
  };
};

const reduceState = (prevState: UiState, action: StateAction): UiState => {
  switch (action.type) {
    case StateActionType.RequestStarted:
      return {
        ...prevState,
        isLoading: true,
      };
    case StateActionType.RequestSuccess: {
      return {
        ...prevState,
        isLoading: false,
        categoryIncomeData: action.payload.categories.map((item) => ({
          name: item.name,
          amount: item.category_yearly_income,
        })),
        moneyFlowData: generateMoneyFlowData(action.payload.categories),
        categoryExpensesData: action.payload.categories.map((item) => ({
          name: item.name,
          amount: item.category_yearly_expense,
        })),
        entityIncomeData: action.payload.entities.map((item) => ({
          name: item.name,
          amount: item.entity_yearly_income,
        })),
        entityExpensesData: action.payload.entities.map((item) => ({
          name: item.name,
          amount: item.entity_yearly_expense,
        })),
        tagIncomeData: action.payload.tags.map((item) => ({
          name: item.name,
          amount: item.tag_yearly_income,
        })),
        tagExpensesData: action.payload.tags.map((item) => ({
          name: item.name,
          amount: item.tag_yearly_expense,
        })),
        minYear: action.payload.year_of_first_trx,
        yearList: generateYearList(action.payload.year_of_first_trx),
      };
    }
    case StateActionType.YearSelected:
      return {
        ...prevState,
        selectedYear: action.payload,
      };
  }
};

const generateMoneyFlowData = (
  categories: CategoryYearByYearDataItem[],
): SankeyDiagramData => {
  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];
  const incomeNodeId = i18n.t('stats.income');

  nodes.push({ id: incomeNodeId, color: '' });

  let otherExpensesAcc = 0;
  categories
    .sort((a, b) => b.category_yearly_expense - a.category_yearly_expense)
    .forEach((category, index) => {
      if (index < 5) {
        const expenseId = `💸 ${category.name}`;
        nodes.push({ id: expenseId, color: '' });
        links.push({
          source: incomeNodeId,
          target: expenseId,
          value: category.category_yearly_expense,
        });
      } else {
        otherExpensesAcc += category.category_yearly_expense;
      }
    });
  nodes.push({ id: i18n.t('stats.otherExpenses'), color: '' });
  links.push({
    source: incomeNodeId,
    target: i18n.t('stats.otherExpenses'),
    value: otherExpensesAcc,
  });

  let otherIncomeAcc = 0;
  categories
    .sort((a, b) => b.category_yearly_income - a.category_yearly_income)
    .forEach((category, index) => {
      if (index < 5) {
        const incomeId = `💰 ${category.name}`;
        nodes.push({ id: incomeId, color: '' });
        links.push({
          source: incomeId,
          target: incomeNodeId,
          value: category.category_yearly_income,
        });
      } else {
        otherIncomeAcc += category.category_yearly_income;
      }
    });
  nodes.push({ id: i18n.t('stats.otherIncome'), color: '' });
  links.push({
    source: i18n.t('stats.otherIncome'),
    target: incomeNodeId,
    value: otherIncomeAcc,
  });

  return { nodes, links };
};

const generateYearList = (minYear: number) => {
  const yearList = [];
  for (let year = minYear; year <= getCurrentYear(); year++) {
    yearList.push(year);
  }
  return yearList;
};

const YearByYearStats = () => {
  const snackbar = useSnackbar();
  const { t } = useTranslation();
  const loader = useLoading();

  const [state, dispatch] = useReducer(reduceState, null, createInitialState);
  const getYearByYearStatsRequest = useGetYearByYearData(state.selectedYear);

  useEffect(() => {
    if (state.isLoading) loader.showLoading();
    else loader.hideLoading();
  }, [state.isLoading]);

  useEffect(() => {
    if (getYearByYearStatsRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [getYearByYearStatsRequest.isError]);

  useEffect(() => {
    if (!getYearByYearStatsRequest.data) return;
    dispatch({
      type: StateActionType.RequestSuccess,
      payload: getYearByYearStatsRequest.data,
    });
  }, [getYearByYearStatsRequest.data]);

  useEffect(() => {
    dispatch({
      type: StateActionType.RequestStarted,
    });
  }, [state.selectedYear]);

  const years = state.yearList ?? [];

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="select-year">{t('stats.year')}</Label>
        <Select
          value={String(state.selectedYear)}
          onValueChange={(v) => {
            const y = Number(v);
            if (!Number.isNaN(y)) {
              dispatch({ type: StateActionType.YearSelected, payload: y });
            }
          }}
        >
          <SelectTrigger id="select-year" className="w-full max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {String(y)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {state.moneyFlowData && (
        <div className="h-[500px]">
          <MyFinSankeyDiagram chartData={state.moneyFlowData} />
        </div>
      )}

      <div className="mt-2 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">{t('stats.incomeByCategory')}</h2>
          <Separator className="mb-2 mt-1" />
          <YearByYearSearchableList
            list={state.categoryIncomeData ?? []}
            isLoading={state.isLoading}
          />
        </div>
        <div>
          <h2 className="text-xl font-semibold">
            {t('stats.expensesByCategory')}
          </h2>
          <Separator className="mb-2 mt-1" />
          <YearByYearSearchableList
            list={state.categoryExpensesData ?? []}
            isLoading={state.isLoading}
          />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{t('stats.incomeByEntity')}</h2>
          <Separator className="mb-2 mt-1" />
          <YearByYearSearchableList
            list={state.entityIncomeData ?? []}
            isLoading={state.isLoading}
          />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{t('stats.expensesByEntity')}</h2>
          <Separator className="mb-2 mt-1" />
          <YearByYearSearchableList
            list={state.entityExpensesData ?? []}
            isLoading={state.isLoading}
          />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{t('stats.incomeByTag')}</h2>
          <Separator className="mb-2 mt-1" />
          <YearByYearSearchableList
            list={state.tagIncomeData ?? []}
            isLoading={state.isLoading}
          />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{t('stats.expensesByTag')}</h2>
          <Separator className="mb-2 mt-1" />
          <YearByYearSearchableList
            list={state.tagExpensesData ?? []}
            isLoading={state.isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default YearByYearStats;
