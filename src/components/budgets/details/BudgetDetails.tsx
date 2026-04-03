import { useTranslation } from 'react-i18next';
import PageHeader from '../../../components/PageHeader.tsx';
import { MonthYearPicker } from '@/common/shadcn/MonthYearPicker.tsx';
import dayjs, { Dayjs } from 'dayjs';
import { addLeadingZero } from '../../../utils/textUtils.ts';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Copy,
  Lock,
  LockOpen,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useCreateBudgetStep0,
  useCreateBudgetStep1,
  useGetBudget,
  useGetBudgetListSummary,
  useGetBudgetToClone,
  useUpdateBudget,
  useUpdateBudgetStatus,
} from '@/hooks/budget';
import { useLoading } from '../../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../../providers/SnackbarProvider.tsx';
import { BudgetCategory } from '@/common/api/budget';
import { Badge } from '@/common/shadcn/ui/badge.tsx';
import { ROUTE_BUDGET_DETAILS } from '../../../providers/RoutesProvider.tsx';
import { TransactionType } from '@/common/api/trx';
import TransactionsTableDialog from '../../../components/TransactionsTableDialog.tsx';
import BudgetListSummaryDialog from './BudgetListSummaryDialog.tsx';
import BudgetCategoryRow from './BudgetCategoryRow.tsx';
import BudgetSummaryBoard from './BudgetSummaryBoard.tsx';
import { debounce } from 'lodash';
import BudgetDescription from './BudgetDescription.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Card } from '@/common/shadcn/ui/card.tsx';
import { getMonthsFullName } from '../../../utils/dateUtils.ts';
import { useFormatNumberAsCurrency } from '../../../utils/textHooks.ts';

type RelatedBudget = {
  id: bigint;
  month: string;
  year: string;
};

const BudgetDetails = () => {
  const { t } = useTranslation();
  const loader = useLoading();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const { id } = useParams();
  const [budgetToClone, setBudgetToClone] = useState<bigint | null>(null);
  const getBudgetRequest = useGetBudget(BigInt(id ?? -1));
  const createBudgetStep0Request = useCreateBudgetStep0();
  const createBudgetStep1Request = useCreateBudgetStep1();
  const updateBudgetStatusRequest = useUpdateBudgetStatus();
  const updateBudgetRequest = useUpdateBudget();
  const getBudgetToCloneRequest = useGetBudgetToClone(budgetToClone);
  const getBudgetListSummaryRequest = useGetBudgetListSummary();
  const [monthYear, setMonthYear] = useState({
    month: dayjs().month() + 1,
    year: dayjs().year(),
  });
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const formatNumberAsCurrency = useFormatNumberAsCurrency();
  const [isOpen, setOpen] = useState(false);
  const [isNew, setNew] = useState(true);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const debouncedCategories = useMemo(() => debounce(setCategories, 300), []);
  const [initialBalance, setInitialBalance] = useState(0);
  const [actionableCategory, setActionableCategory] = useState<{
    category: BudgetCategory;
    isDebit: boolean;
  } | null>(null);
  const [isTrxTableDialogOpen, setTrxTableDialogOpen] = useState(false);
  const [isCloneBudgetDialogOpen, setCloneBudgetDialogOpen] = useState(false);
  const [previousBudget, setPreviousBudget] = useState<RelatedBudget | null>(
    null,
  );
  const [nextBudget, setNextBudget] = useState<RelatedBudget | null>(null);
  const orderCategoriesByDebitAmount = (
    categories: BudgetCategory[],
    isOpen: boolean,
  ) => {
    return [...categories]
      .filter((cat) =>
        isOpen
          ? true
          : cat.current_amount_debit != 0 || cat.planned_amount_debit != 0,
      )
      .sort((a, b) => {
        if (isOpen)
          return (
            Number(b.initial_planned_amount_debit + '') -
            Number(a.initial_planned_amount_debit + '')
          );
        return (
          Number(b.current_amount_debit + '') -
          Number(a.current_amount_debit + '')
        );
      });
  };

  const getDescriptionValue = () => {
    return descriptionRef.current?.value ?? '';
  };

  const setDescriptionValue = (text: string) => {
    if (descriptionRef.current != null) {
      descriptionRef.current.value = text;
    }
  };

  const orderCategoriesByCreditAmount = (
    categories: BudgetCategory[],
    isOpen: boolean,
  ) => {
    return [...categories]
      .filter((cat) =>
        isOpen
          ? true
          : cat.current_amount_credit != 0 || cat.planned_amount_credit != 0,
      )
      .sort((a, b) => {
        if (isOpen)
          return (
            Number(b.initial_planned_amount_credit + '') -
            Number(a.initial_planned_amount_credit + '')
          );
        return (
          Number(b.current_amount_credit + '') -
          Number(a.current_amount_credit + '')
        );
      });
  };

  const debitCategories = useMemo(() => {
    return orderCategoriesByDebitAmount(categories, isOpen);
  }, [categories, isOpen]);
  const creditCategories = useMemo(() => {
    return orderCategoriesByCreditAmount(categories, isOpen);
  }, [categories, isOpen]);

  const calculateBudgetBalances = (
    categories?: BudgetCategory[],
  ): {
    plannedBalance: number;
    currentBalance: number;
    plannedIncome: number;
    plannedExpenses: number;
    currentIncome: number;
    currentExpenses: number;
  } => {
    if (!categories)
      return {
        plannedBalance: 0,
        currentBalance: 0,
        plannedIncome: 0,
        plannedExpenses: 0,
        currentIncome: 0,
        currentExpenses: 0,
      };

    return categories.reduce(
      (acc, cur) => {
        const shouldIgnore = cur.exclude_from_budgets == 1;
        return {
          plannedBalance:
            acc.plannedBalance +
            (shouldIgnore
              ? 0
              : cur.planned_amount_credit - cur.planned_amount_debit),
          currentBalance:
            acc.currentBalance +
            (shouldIgnore
              ? 0
              : cur.current_amount_credit - cur.current_amount_debit),
          plannedIncome:
            acc.plannedIncome + (shouldIgnore ? 0 : cur.planned_amount_credit),
          plannedExpenses:
            acc.plannedExpenses + (shouldIgnore ? 0 : cur.planned_amount_debit),
          currentIncome:
            acc.currentIncome + (shouldIgnore ? 0 : cur.current_amount_credit),
          currentExpenses:
            acc.currentExpenses + (shouldIgnore ? 0 : cur.current_amount_debit),
        };
      },
      {
        plannedBalance: 0,
        currentBalance: 0,
        plannedIncome: 0,
        plannedExpenses: 0,
        currentIncome: 0,
        currentExpenses: 0,
      },
    );
  };

  const calculatedBalances = useMemo(
    () => calculateBudgetBalances(categories),
    [categories],
  );

  // Fetch
  useEffect(() => {
    setNew(!id);
    if (!id) {
      createBudgetStep0Request.refetch();
    } else {
      getBudgetRequest.refetch();
    }
  }, [id]);

  useEffect(() => {
    if (!getBudgetListSummaryRequest.data) return;
    const list = getBudgetListSummaryRequest.data;
    const budgetIndex = list.findIndex(
      (elem) => elem.budget_id == BigInt(id ?? -1),
    );

    const previous = list[budgetIndex + 1];
    const next = list[budgetIndex - 1];

    setPreviousBudget(
      previous
        ? {
            id: previous.budget_id,
            month: getMonthsFullName(previous.month),
            year: `${previous.year}`,
          }
        : null,
    );

    setNextBudget(
      next
        ? {
            id: next.budget_id,
            month: getMonthsFullName(next.month),
            year: `${next.year}`,
          }
        : null,
    );
  }, [getBudgetListSummaryRequest.data, id]);

  // Loading
  useEffect(() => {
    if (
      getBudgetRequest.isFetching ||
      createBudgetStep0Request.isFetching ||
      updateBudgetStatusRequest.isPending ||
      updateBudgetRequest.isPending ||
      createBudgetStep1Request.isPending ||
      getBudgetToCloneRequest.isFetching
    ) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [
    getBudgetRequest.isFetching,
    createBudgetStep0Request.isFetching,
    updateBudgetStatusRequest.isPending,
    updateBudgetRequest.isPending,
    createBudgetStep1Request.isPending,
    getBudgetToCloneRequest.isFetching,
  ]);

  // Error
  useEffect(() => {
    if (
      getBudgetRequest.isError ||
      createBudgetStep0Request.isError ||
      updateBudgetStatusRequest.isError ||
      updateBudgetRequest.isError ||
      createBudgetStep1Request.isError ||
      getBudgetToCloneRequest.isError
    ) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [
    getBudgetRequest.isError,
    createBudgetStep0Request.isError,
    updateBudgetStatusRequest.isError,
    updateBudgetRequest.isError,
    createBudgetStep1Request.isError,
    getBudgetToCloneRequest.isError,
  ]);

  // Data successfully loaded
  useEffect(() => {
    if (getBudgetRequest.data) {
      // datepicker
      setMonthYear({
        month: getBudgetRequest.data.month,
        year: getBudgetRequest.data.year,
      });
      // observations
      setDescriptionValue(getBudgetRequest.data.observations);

      // open
      setOpen(getBudgetRequest.data.is_open == 1);

      // initial balance
      setInitialBalance(getBudgetRequest.data.initial_balance);

      // categories
      setCategories(getBudgetRequest.data.categories);
    } else if (createBudgetStep0Request.data) {
      // open
      setOpen(true);

      // initial balance
      setInitialBalance(
        parseFloat(createBudgetStep0Request.data.initial_balance) || 0,
      );

      // categories
      setCategories(
        createBudgetStep0Request.data.categories.map((category) => ({
          ...category,
          current_amount_credit: 0,
          current_amount_debit: 0,
          planned_amount_credit: 0,
          planned_amount_debit: 0,
        })),
      );
    }
  }, [getBudgetRequest.data, createBudgetStep0Request.data]);

  // Create budget step 1 request success
  useEffect(() => {
    if (createBudgetStep1Request.data) {
      navigate(
        ROUTE_BUDGET_DETAILS.replace(
          ':id',
          createBudgetStep1Request.data.budget_id + '',
        ),
      );
    }
  }, [createBudgetStep1Request.data]);

  // Get budget to clone request success
  useEffect(() => {
    if (!getBudgetToCloneRequest.data) return;
    setDescriptionValue(getBudgetToCloneRequest.data.observations);
    setCategories(getBudgetToCloneRequest.data.categories);
  }, [getBudgetToCloneRequest.data]);

  const goToRelatedBudget = (budgetId: bigint) => {
    navigate(ROUTE_BUDGET_DETAILS.replace(':id', budgetId + ''));
  };

  const handleCategoryClick = (category: BudgetCategory, isDebit: boolean) => {
    setActionableCategory({ category, isDebit });
    setTrxTableDialogOpen(true);
  };

  const createBudget = () => {
    const catValuesArr = categories.map((category) => {
      const plannedDebit = category.planned_amount_debit;
      const plannedCredit = category.planned_amount_credit;
      return {
        category_id: category.category_id + '',
        planned_value_debit: plannedDebit + '',
        planned_value_credit: plannedCredit + '',
      };
    });
    createBudgetStep1Request.mutate({
      month: monthYear.month,
      year: monthYear.year,
      observations: getDescriptionValue(),
      cat_values_arr: catValuesArr,
    });
  };

  const updateBudget = () => {
    const catValuesArr = categories.map((category) => {
      const plannedDebit = category.planned_amount_debit;
      const plannedCredit = category.planned_amount_credit;
      return {
        category_id: category.category_id + '',
        planned_value_debit: plannedDebit + '',
        planned_value_credit: plannedCredit + '',
      };
    });
    updateBudgetRequest.mutate({
      budget_id: parseFloat(id || '-1'),
      month: monthYear.month,
      year: monthYear.year,
      observations: getDescriptionValue(),
      cat_values_arr: catValuesArr,
    });
  };

  const handleMonthChange = (newDate: Dayjs) => {
    setMonthYear({ month: newDate.month() + 1, year: newDate.year() });
  };

  const handleCloneBudgetClick = () => {
    setCloneBudgetDialogOpen(true);
  };

  const handleCloneBudgetSelected = (budgetId: bigint) => {
    if (budgetId == -1n) return;
    setCloneBudgetDialogOpen(false);
    setBudgetToClone(budgetId);
  };

  if (
    (getBudgetRequest.isLoading || !getBudgetRequest.data) &&
    (createBudgetStep0Request.isFetching || !createBudgetStep0Request.data)
  ) {
    return null;
  }

  function onCategoryPlannedAmountChange(
    category: BudgetCategory,
    isDebit: boolean,
    value: number,
  ) {
    debouncedCategories(
      categories.map((c) =>
        c.category_id == category.category_id
          ? {
              ...c,
              planned_amount_debit: isDebit ? value : c.planned_amount_debit,
              planned_amount_credit: isDebit ? c.planned_amount_credit : value,
            }
          : c,
      ),
    );
  }

  return (
    <Card className="m-4 p-4 shadow-none">
      {isCloneBudgetDialogOpen && (
        <BudgetListSummaryDialog
          isOpen
          onClose={() => setCloneBudgetDialogOpen(false)}
          onBudgetSelected={handleCloneBudgetSelected}
        />
      )}
      {isTrxTableDialogOpen && (
        <TransactionsTableDialog
          title={t('budgetDetails.transactionsList')}
          categoryId={actionableCategory?.category.category_id || -1n}
          month={monthYear.month}
          year={monthYear.year}
          type={
            actionableCategory?.isDebit
              ? TransactionType.Expense
              : TransactionType.Income
          }
          onClose={() => {
            setTrxTableDialogOpen(false);
            setActionableCategory(null);
          }}
          isOpen
        />
      )}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <PageHeader
          title={t('budgetDetails.budget')}
          subtitle={t('budgetDetails.strapLine')}
        />
        <Button
          type="button"
          size="sm"
          disabled={!isOpen}
          onClick={handleCloneBudgetClick}
        >
          <Copy className="mr-2 size-4" />
          {t('budgetDetails.cloneAnotherBudget')}
        </Button>
      </div>
      <div className="mt-4 grid gap-4">
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <MonthYearPicker
              label={t('stats.month')}
              onChange={handleMonthChange}
              value={dayjs(
                `${monthYear.year}-${addLeadingZero(monthYear.month)}`,
              )}
            />
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <BudgetDescription ref={descriptionRef} />
          </div>
        </div>
        <div>
          <BudgetSummaryBoard
            calculatedBalances={calculatedBalances}
            isOpen={isOpen}
            initialBalance={initialBalance}
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="mb-3 grid gap-2 sm:grid-cols-2 sm:items-center">
              <h2 className="text-2xl font-semibold">{t('common.debit')}</h2>
              <div className="flex justify-start sm:justify-end">
                <Badge variant="secondary" className="text-sm font-normal">
                  {`${t('budgetDetails.essentialExpenses')}: ${formatNumberAsCurrency.invoke(getBudgetRequest?.data?.debit_essential_trx_total || 0)}`}
                </Badge>
              </div>
            </div>
            <ul className="list-none space-y-0 p-0">
              {debitCategories.map((category) => (
                <li key={category.category_id} className="px-0 py-0">
                  <BudgetCategoryRow
                    category={category}
                    isOpen={isOpen}
                    isDebit={true}
                    month={monthYear.month}
                    year={monthYear.year}
                    onCategoryClick={handleCategoryClick}
                    onInputChange={(amount) =>
                      onCategoryPlannedAmountChange(category, true, amount)
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-3 text-2xl font-semibold">{t('common.credit')}</h2>
            <ul className="list-none space-y-0 p-0">
              {creditCategories.map((category) => (
                <li key={category.category_id}>
                  <BudgetCategoryRow
                    category={category}
                    isOpen={isOpen}
                    isDebit={false}
                    month={monthYear.month}
                    year={monthYear.year}
                    onCategoryClick={handleCategoryClick}
                    onInputChange={(amount) =>
                      onCategoryPlannedAmountChange(category, false, amount)
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="text-muted-foreground sticky bottom-0 z-[9] flex flex-wrap justify-center gap-4 overflow-hidden border-t bg-card py-5 pt-5">
          <div className="flex w-full flex-wrap items-center justify-center gap-4 md:w-auto md:flex-nowrap">
            <div className="flex w-full justify-start md:w-auto md:max-w-[25%] md:flex-1">
              {previousBudget && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto flex-col items-start gap-0 px-2"
                  onClick={() => goToRelatedBudget(previousBudget?.id ?? -1n)}
                >
                  <ChevronLeft className="mb-1 size-4" />
                  <span className="text-muted-foreground text-xs uppercase tracking-wide">
                    {t('common.previous')}
                  </span>
                  <span className="text-foreground text-sm">
                    {previousBudget.month} {previousBudget.year}
                  </span>
                </Button>
              )}
            </div>
            <div className="flex w-full flex-wrap items-center justify-center gap-2 md:flex-1">
              <Button
                type="button"
                size="lg"
                className="m-1"
                onClick={() => (isNew ? createBudget() : updateBudget())}
              >
                <CloudUpload className="mr-2 size-5" />
                {t(
                  isNew
                    ? 'budgetDetails.addBudgetCTA'
                    : 'budgetDetails.updateBudget',
                )}
              </Button>
              {!isNew && (
                <Button
                  type="button"
                  size="lg"
                  variant="secondary"
                  className="m-1"
                  onClick={() =>
                    updateBudgetStatusRequest.mutate({
                      budgetId: BigInt(id ?? -1),
                      isOpen: isOpen,
                    })
                  }
                >
                  {isOpen ? (
                    <Lock className="mr-2 size-5" />
                  ) : (
                    <LockOpen className="mr-2 size-5" />
                  )}
                  {t(
                    isOpen
                      ? 'budgetDetails.closeBudgetCTA'
                      : 'budgetDetails.reopenBudget',
                  )}
                </Button>
              )}
            </div>
            <div className="flex w-full justify-end md:w-auto md:max-w-[25%] md:flex-1">
              {nextBudget && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto flex-col items-end gap-0 px-2"
                  onClick={() => goToRelatedBudget(nextBudget?.id ?? -1n)}
                >
                  <ChevronRight className="mb-1 size-4" />
                  <span className="text-muted-foreground text-xs uppercase tracking-wide">
                    {t('common.next')}
                  </span>
                  <span className="text-foreground text-sm">
                    {nextBudget.month} {nextBudget.year}
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BudgetDetails;
