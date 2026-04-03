import { useTranslation } from 'react-i18next';
import React, { memo, useEffect, useMemo, useState } from 'react';
import PageHeader from '../../../components/PageHeader.tsx';
import { useGetBudgets, useRemoveBudget } from '@/hooks/budget';
import { useLoading } from '../../../providers/LoadingProvider.tsx';
import type { MyFinColumnDef } from '@/components/dashboard/Table/Types';
import {
  AlertSeverity,
  useSnackbar,
} from '../../../providers/SnackbarProvider.tsx';
import { Budget } from '@/common/api/budget';
import { CirclePlus, Eye, Lock, Search, Trash2, Unlock } from 'lucide-react';
import {
  getCurrentMonth,
  getCurrentYear,
  getMonthsFullName,
} from '../../../utils/dateUtils.ts';
import { formatNumberAsPercentage } from '../../../utils/textUtils.ts';
import DataTable from '../../../components/DataTable.tsx';
import GenericConfirmationDialog from '../../../components/GenericConfirmationDialog.tsx';
import { useNavigate } from 'react-router-dom';
import {
  ROUTE_BUDGET_DETAILS,
  ROUTE_BUDGET_NEW,
} from '../../../providers/RoutesProvider.tsx';
import { debounce } from 'lodash';
import { useFormatNumberAsCurrency } from '../../../utils/textHooks.ts';
import { Card } from '@/common/shadcn/ui/card.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
import { Checkbox } from '@/common/shadcn/ui/checkbox.tsx';
import { Badge } from '@/common/shadcn/ui/badge.tsx';
import { cn } from '@/common/shadcn/lib/utils';
import PercentageChip from '../../../components/PercentageChip.tsx';

const BudgetList = () => {
  const { t } = useTranslation();
  const loader = useLoading();
  const snackbar = useSnackbar();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 15,
    page: 0,
  });
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);
  const getBudgetsRequest = useGetBudgets(
    paginationModel.page,
    paginationModel.pageSize,
    searchQuery,
    showOnlyOpen ? 'O' : undefined,
  );
  const [actionableBudget, setActionableBudget] = useState<Budget | null>(null);
  const [isRemoveDialogOpen, setRemoveDialogOpen] = useState(false);
  const debouncedSearchQuery = useMemo(() => debounce(setSearchQuery, 300), []);

  const removeBudgetRequest = useRemoveBudget();
  const formatNumberAsCurrency = useFormatNumberAsCurrency();

  useEffect(() => {
    if (getBudgetsRequest.isLoading) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [getBudgetsRequest.isLoading]);

  useEffect(() => {
    if (getBudgetsRequest.isError || removeBudgetRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [getBudgetsRequest.isError, removeBudgetRequest.isError]);

  useEffect(() => {
    if (isRemoveDialogOpen == false) {
      setActionableBudget(null);
    }
  }, [isRemoveDialogOpen]);

  if (getBudgetsRequest.isLoading || !getBudgetsRequest.data) {
    return null;
  }

  const goToBudgetDetails = (budgetId: bigint) => {
    navigate(ROUTE_BUDGET_DETAILS.replace(':id', budgetId + ''));
  };

  const handleAddBudgetClick = () => {
    navigate(ROUTE_BUDGET_NEW);
  };

  const handleRemoveBudgetClick = (budget: Budget) => {
    setActionableBudget(budget);
    setRemoveDialogOpen(true);
  };

  const removeBudget = () => {
    if (!actionableBudget) return;
    removeBudgetRequest.mutate(actionableBudget?.budget_id);
    setRemoveDialogOpen(false);
  };

  const columns: MyFinColumnDef[] = [
    {
      field: 'status',
      headerName: '',
      width: 10,
      editable: false,
      sortable: false,
      filterable: false,
      renderCell: (params) =>
        params.value ? (
          <Unlock className="size-4 opacity-70" />
        ) : (
          <Lock className="size-4 opacity-70" />
        ),
    },
    {
      field: 'month',
      headerName: t('budgets.month'),
      width: 100,
      editable: false,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div className="flex flex-col gap-1 py-2">
          <p className="text-sm font-semibold">
            {getMonthsFullName(params.value.month)}
          </p>
          <p className="text-muted-foreground text-xs">
            {params.value.month}/{params.value.year}
          </p>
        </div>
      ),
    },
    {
      field: 'observations',
      headerName: t('budgets.observations'),
      flex: 5,
      minWidth: 300,
      editable: false,
      sortable: false,
      filterable: false,
      renderCell: (params) => <p>{params.value}</p>,
    },
    {
      field: 'expenses',
      headerName: t('transactions.expense'),
      flex: 1,
      minWidth: 100,
      editable: false,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>{formatNumberAsCurrency.invoke(params.value)}</>
      ),
    },
    {
      field: 'income',
      headerName: t('transactions.income'),
      flex: 1,
      minWidth: 100,
      editable: false,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>{formatNumberAsCurrency.invoke(params.value)}</>
      ),
    },
    {
      field: 'balance',
      headerName: t('budgets.balance'),
      flex: 1,
      minWidth: 100,
      editable: false,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div className="flex flex-col gap-1 py-2">
          <p className="font-semibold">
            {formatNumberAsCurrency.invoke(params.value.value)}
          </p>
          <div className="mt-0.5">
            <PercentageChip
              percentage={params.value.changePercentage}
              className={cn(
                'text-xs',
                params.value.highlighted && 'border-transparent bg-secondary',
              )}
            />
          </div>
        </div>
      ),
    },
    {
      field: 'savings',
      headerName: t('budgets.savings'),
      flex: 1,
      minWidth: 100,
      editable: false,
      sortable: false,
      filterable: false,
      renderCell: (params) =>
        params.value.highlighted ? (
          <Badge variant="secondary" className="text-xs font-normal">
            {params.value.value == 0
              ? '-%'
              : formatNumberAsPercentage(params.value.value, true)}
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className={cn(
              'text-xs font-normal',
              params.value.value > 0 &&
                'border-green-600 text-green-700 dark:text-green-400',
              params.value.value < 0 &&
                'border-amber-600 text-amber-800 dark:text-amber-400',
            )}
          >
            {params.value.value == 0
              ? '-%'
              : formatNumberAsPercentage(params.value.value, true)}
          </Badge>
        ),
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      minWidth: 100,
      editable: false,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div className="flex flex-row gap-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('common.seeMore')}
            onClick={() => {
              goToBudgetDetails(params.value.budget_id);
            }}
          >
            <Eye className="size-5 opacity-70" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('common.delete')}
            onClick={(event) => {
              event.stopPropagation();
              handleRemoveBudgetClick(params.value);
            }}
          >
            <Trash2 className="size-5 opacity-70" />
          </Button>
        </div>
      ),
    },
  ];

  const shouldRowBeHighlighted = (budget: Budget): boolean => {
    return budget.month == getCurrentMonth() && budget.year == getCurrentYear();
  };

  const rows = getBudgetsRequest.data.results.map((result: Budget) => ({
    id: result.budget_id,
    highlight: shouldRowBeHighlighted(result),
    status: result.is_open,
    month: {
      month: result.month,
      year: result.year,
    },
    observations: result.observations,
    expenses: result.debit_amount,
    income: result.credit_amount,
    balance: {
      value: result.balance_value,
      changePercentage: result.balance_change_percentage,
      highlighted: shouldRowBeHighlighted(result),
    },
    savings: {
      value: result.savings_rate_percentage,
      highlighted: shouldRowBeHighlighted(result),
    },
    actions: result,
  }));

  return (
    <Card className="m-4 p-4 shadow-none">
      {isRemoveDialogOpen && (
        <GenericConfirmationDialog
          isOpen={isRemoveDialogOpen}
          onClose={() => setRemoveDialogOpen(false)}
          onPositiveClick={() => removeBudget()}
          onNegativeClick={() => setRemoveDialogOpen(false)}
          titleText={t('budgets.deleteBudgetModalTitle', {
            month: actionableBudget?.month,
            year: actionableBudget?.year,
          })}
          descriptionText={t('budgets.deleteBudgetModalSubtitle')}
          positiveText={t('common.delete')}
        />
      )}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <PageHeader
          title={t('budgets.budgets')}
          subtitle={t('budgets.strapLine')}
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:col-span-8">
          <Button type="button" onClick={() => handleAddBudgetClick()}>
            <CirclePlus className="mr-2 size-5" />
            {t('budgets.addBudget')}
          </Button>
          <div className="flex items-center gap-2">
            <Checkbox
              id="only-open"
              checked={showOnlyOpen}
              onCheckedChange={(c) => setShowOnlyOpen(c === true)}
            />
            <Label htmlFor="only-open" className="cursor-pointer font-normal">
              {t('budgets.onlyOpened')}
            </Label>
          </div>
        </div>
        <div className="flex justify-end lg:col-span-4">
          <div className="flex w-full max-w-xs flex-col gap-2">
            <Label htmlFor="budget-search">{t('common.search')}</Label>
            <div className="relative">
              <Search className="text-muted-foreground absolute right-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                id="budget-search"
                className="pr-10"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  debouncedSearchQuery(event.target.value);
                }}
              />
            </div>
          </div>
        </div>
        <div className="lg:col-span-12">
          <DataTable
            isRefetching={getBudgetsRequest.isRefetching}
            rows={rows}
            columns={columns}
            itemCount={getBudgetsRequest.data.filtered_count}
            paginationModel={paginationModel}
            setPaginationModel={setPaginationModel}
            onRowClicked={(id) => goToBudgetDetails(id)}
          />
        </div>
      </div>
    </Card>
  );
};

export default memo(BudgetList);
