import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  Flag,
  Pencil,
  Search,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import type { MyFinColumnDef } from '@/components/dashboard/Table/Types';
import { useEffect, useMemo, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GenericConfirmationDialog from '../../components/GenericConfirmationDialog.tsx';
import MyFinStaticTable from '../../components/MyFinStaticTable.tsx';
import PageHeader from '../../components/PageHeader.tsx';
import { useLoading } from '../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../providers/SnackbarProvider.tsx';
import { useDeleteGoal, useGetGoals } from '@/hooks/goal';
import { Goal } from '@/common/api/goal';
import { useFormatNumberAsCurrency } from '../../utils/textHooks.ts';
import AddEditGoalDialog from './AddEditGoalDialog.tsx';
import { Alert, AlertDescription, AlertTitle } from '@/common/shadcn/ui/alert.tsx';
import { Badge } from '@/common/shadcn/ui/badge.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Card, CardContent } from '@/common/shadcn/ui/card.tsx';
import { Checkbox } from '@/common/shadcn/ui/checkbox.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/common/shadcn/ui/tooltip.tsx';
import { cn } from '@/common/shadcn/lib/utils';

type UiState = {
  goals?: Goal[];
  filteredGoals?: Goal[];
  searchQuery: string;
  actionableGoal?: Goal;
  isEditDialogOpen: boolean;
  isRemoveDialogOpen: boolean;
};

const enum StateActionType {
  DataLoaded,
  SearchQueryUpdated,
  AddClick,
  EditClick,
  RemoveClick,
  DialogDismissed,
}

type StateAction =
  | {
      type: StateActionType.DataLoaded;
      payload: Goal[];
    }
  | { type: StateActionType.SearchQueryUpdated; payload: string }
  | { type: StateActionType.DialogDismissed }
  | { type: StateActionType.AddClick }
  | { type: StateActionType.EditClick; payload: Goal }
  | { type: StateActionType.RemoveClick; payload: Goal };

const createInitialState = (): UiState => {
  return {
    searchQuery: '',
    isEditDialogOpen: false,
    isRemoveDialogOpen: false,
  };
};

const filterItems = (list: Goal[], searchQuery: string) => {
  return list.filter((goal) =>
    JSON.stringify(goal).toLowerCase().includes(searchQuery.toLowerCase()),
  );
};

const getGoalSortPriority = (goal: Goal): number => {
  const percentage =
    goal.amount > 0
      ? Math.min(100, (goal.currently_funded_amount / goal.amount) * 100)
      : 0;
  const isComplete = percentage >= 100;

  if (isComplete) return Number.MAX_SAFE_INTEGER;

  if (!goal.due_date) return Number.MAX_SAFE_INTEGER - 1;

  const now = Date.now() / 1000;
  const dueDate = goal.due_date;

  return dueDate - now;
};

const sortGoalsByDueDate = (goals: Goal[]): Goal[] => {
  return [...goals].sort(
    (a, b) => getGoalSortPriority(a) - getGoalSortPriority(b),
  );
};

const sortGoalsForTable = (goals: Goal[]): Goal[] => {
  const activeGoals = goals.filter((g) => !g.is_archived);
  const archivedGoals = goals.filter((g) => g.is_archived);

  return [...sortGoalsByDueDate(activeGoals), ...archivedGoals];
};

const reduceState = (prevState: UiState, action: StateAction): UiState => {
  switch (action.type) {
    case StateActionType.DataLoaded:
      return {
        ...prevState,
        goals: action.payload,
        filteredGoals: filterItems(action.payload, prevState?.searchQuery),
      };
    case StateActionType.SearchQueryUpdated:
      return {
        ...prevState,
        searchQuery: action.payload,
        filteredGoals: filterItems(prevState.goals || [], action.payload),
      };
    case StateActionType.DialogDismissed:
      return {
        ...prevState,
        isRemoveDialogOpen: false,
        isEditDialogOpen: false,
        actionableGoal: undefined,
      };
    case StateActionType.RemoveClick:
      return {
        ...prevState,
        isEditDialogOpen: false,
        isRemoveDialogOpen: true,
        actionableGoal: action.payload,
      };
    case StateActionType.AddClick:
      return {
        ...prevState,
        isEditDialogOpen: true,
        isRemoveDialogOpen: false,
        actionableGoal: undefined,
      };
    case StateActionType.EditClick:
      return {
        ...prevState,
        isEditDialogOpen: true,
        isRemoveDialogOpen: false,
        actionableGoal: action.payload,
      };
  }
};

function GoalProgressRing({
  percentage,
  trackClassName,
  progressClassName,
}: {
  percentage: number;
  trackClassName: string;
  progressClassName: string;
}) {
  const size = 100;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, percentage) / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        stroke="currentColor"
        className={trackClassName}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        stroke="currentColor"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={progressClassName}
      />
    </svg>
  );
}

const GoalCard = ({
  goal,
  onClick,
  formatCurrency,
}: {
  goal: Goal;
  onClick: () => void;
  formatCurrency: (value: number) => string;
}) => {
  const { t } = useTranslation();

  const percentage =
    goal.amount > 0
      ? Math.min(100, (goal.currently_funded_amount / goal.amount) * 100)
      : 0;
  const isComplete = percentage >= 100;

  const formatDueDate = (timestamp: number | null) => {
    if (!timestamp) return null;
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  const getDaysUntilDue = (timestamp: number | null) => {
    if (!timestamp) return null;
    const now = new Date();
    const dueDate = new Date(timestamp * 1000);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue(goal.due_date);
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isDueSoon =
    daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 30;

  const accentBorder = isComplete
    ? 'border-t-green-600'
    : isOverdue
      ? 'border-t-destructive'
      : isDueSoon
        ? 'border-t-amber-500'
        : goal.is_underfunded
          ? 'border-t-amber-400'
          : 'border-t-primary';

  const accentProgress = isComplete
    ? 'text-green-600'
    : isOverdue
      ? 'text-destructive'
      : isDueSoon
        ? 'text-amber-500'
        : goal.is_underfunded
          ? 'text-amber-400'
          : 'text-primary';

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'relative flex h-full cursor-pointer flex-col overflow-visible border-t-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg',
        accentBorder,
      )}
    >
      <CardContent className="flex flex-1 flex-col pb-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 min-w-0 flex-1 font-semibold">
            {goal.name}
          </h3>
          <Badge variant="outline" className="min-w-[50px] shrink-0 gap-1">
            <Flag className="size-3" />
            {goal.priority}
          </Badge>
        </div>

        {goal.description && (
          <p className="text-muted-foreground line-clamp-2 mb-2 min-h-10 text-sm">
            {goal.description}
          </p>
        )}

        <div className="my-2 flex items-center justify-center">
          <div className="relative inline-flex">
            <GoalProgressRing
              percentage={percentage}
              trackClassName="text-muted/30"
              progressClassName={accentProgress}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isComplete ? (
                <CheckCircle2 className="size-8 text-green-600" />
              ) : (
                <span className="text-lg font-bold">
                  {percentage.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mb-2 text-center">
          <p className="text-muted-foreground text-lg font-bold">
            {formatCurrency(goal.currently_funded_amount)}
          </p>
          <p className="text-muted-foreground text-xs">
            {t('goals.of')} {formatCurrency(goal.amount)}
          </p>
        </div>

        <div className="border-border flex items-center justify-between border-t pt-2">
          {goal.due_date ? (
            <Badge
              variant={isOverdue || isDueSoon ? 'default' : 'outline'}
              className={cn(
                'gap-1 font-normal',
                isOverdue && 'bg-destructive text-destructive-foreground',
                isDueSoon &&
                  !isOverdue &&
                  'border-amber-500 bg-amber-500 text-amber-950',
              )}
            >
              <CalendarClock className="size-3.5" />
              {formatDueDate(goal.due_date)}
            </Badge>
          ) : (
            <span />
          )}
          {goal.is_underfunded && !isComplete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <TriangleAlert className="size-4 text-amber-600" />
                </span>
              </TooltipTrigger>
              <TooltipContent>{t('goals.underfundedTooltip')}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const Goals = () => {
  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();

  const [showArchived, setShowArchived] = useState(false);
  const getGoalsRequest = useGetGoals(!showArchived);
  const deleteGoalRequest = useDeleteGoal();
  const formatNumberAsCurrency = useFormatNumberAsCurrency();
  const [state, dispatch] = useReducer(reduceState, null, createInitialState);

  useEffect(() => {
    if (getGoalsRequest.isFetching || deleteGoalRequest.isPending) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [getGoalsRequest.isFetching, deleteGoalRequest.isPending]);

  useEffect(() => {
    if (getGoalsRequest.isError || deleteGoalRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [getGoalsRequest.isError, deleteGoalRequest.isError]);

  useEffect(() => {
    if (!getGoalsRequest.data) return;
    dispatch({
      type: StateActionType.DataLoaded,
      payload: getGoalsRequest.data,
    });
  }, [getGoalsRequest.data]);

  const formatDueDate = (timestamp: number | null) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  const sortedGoalsForCards = useMemo(() => {
    if (!state?.goals) return [];
    const activeGoals = state.goals.filter((g) => !g.is_archived);
    return sortGoalsByDueDate(activeGoals);
  }, [state?.goals]);

  const sortedGoalsForTable = useMemo(() => {
    if (!state?.filteredGoals) return [];
    return sortGoalsForTable(state.filteredGoals);
  }, [state?.filteredGoals]);

  const rows = useMemo(
    () =>
      sortedGoalsForTable.map((goal: Goal) => ({
        id: goal.goal_id,
        name: { name: goal.name, description: goal.description },
        priority: goal.priority,
        target: goal.amount,
        dueDate: goal.due_date,
        status: goal.is_archived,
        progress: {
          current: goal.currently_funded_amount,
          target: goal.amount,
          isUnderfunded: goal.is_underfunded,
        },
        actions: goal,
      })),
    [sortedGoalsForTable],
  );

  const columns: MyFinColumnDef[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: t('goals.name'),
        minWidth: 200,
        flex: 1,
        editable: false,
        sortable: false,
        renderCell: (params) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground">{params.value.name}</span>
            {params.value.description && (
              <span className="text-muted-foreground text-xs">
                {params.value.description}
              </span>
            )}
          </div>
        ),
      },
      {
        field: 'priority',
        headerName: t('goals.priority'),
        minWidth: 100,
        editable: false,
        sortable: false,
        renderCell: (params) => (
          <Badge variant="outline" className="font-normal">
            {params.value}
          </Badge>
        ),
      },
      {
        field: 'target',
        headerName: t('goals.targetAmount'),
        minWidth: 130,
        editable: false,
        sortable: false,
        renderCell: (params) => (
          <span>{formatNumberAsCurrency.invoke(params.value)}</span>
        ),
      },
      {
        field: 'dueDate',
        headerName: t('goals.dueDate'),
        minWidth: 120,
        editable: false,
        sortable: false,
        renderCell: (params) => (
          <span className="text-sm">{formatDueDate(params.value)}</span>
        ),
      },
      {
        field: 'status',
        headerName: t('goals.status'),
        minWidth: 100,
        editable: false,
        sortable: false,
        renderCell: (params) => {
          const isArchived = params.value;
          return (
            <Badge
              variant="outline"
              className={cn(
                'font-normal',
                isArchived
                  ? 'border-amber-600 text-amber-800 dark:text-amber-400'
                  : 'border-green-600 text-green-800 dark:text-green-400',
              )}
            >
              {t(isArchived ? 'goals.archived' : 'goals.active')}
            </Badge>
          );
        },
      },
      {
        field: 'progress',
        headerName: t('goals.progress'),
        minWidth: 200,
        flex: 1,
        editable: false,
        sortable: false,
        renderCell: (params) => {
          const percentage =
            params.value.target > 0
              ? Math.min(
                  100,
                  (params.value.current / params.value.target) * 100,
                )
              : 0;
          const isComplete = percentage >= 100;
          return (
            <div className="flex w-full items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <div
                    className={cn(
                      'h-2 rounded-full transition-all',
                      isComplete ? 'bg-green-600' : 'bg-primary',
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {formatNumberAsCurrency.invoke(params.value.current)} /{' '}
                  {formatNumberAsCurrency.invoke(params.value.target)} (
                  {percentage.toFixed(0)}%)
                </p>
              </div>
              {params.value.isUnderfunded && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex shrink-0">
                      <TriangleAlert className="size-4 text-amber-600" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('goals.underfundedTooltip')}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          );
        },
      },
      {
        field: 'actions',
        headerName: t('common.actions'),
        minWidth: 100,
        editable: false,
        sortable: false,
        renderCell: (params) => (
          <div className="flex flex-row gap-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t('common.edit')}
              onClick={() =>
                dispatch({
                  type: StateActionType.EditClick,
                  payload: params.value,
                })
              }
            >
              <Pencil className="size-5 opacity-70" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t('common.delete')}
              onClick={(event) => {
                event.stopPropagation();
                dispatch({
                  type: StateActionType.RemoveClick,
                  payload: params.value,
                });
              }}
            >
              <Trash2 className="size-5 opacity-70" />
            </Button>
          </div>
        ),
      },
    ],
    [t, formatNumberAsCurrency, formatDueDate],
  );

  if (!state) return null;
  return (
    <div className="m-4 p-4">
      {state.isEditDialogOpen && (
        <AddEditGoalDialog
          isOpen={true}
          onClose={() => dispatch({ type: StateActionType.DialogDismissed })}
          onSuccess={() => dispatch({ type: StateActionType.DialogDismissed })}
          onNegativeClick={() =>
            dispatch({ type: StateActionType.DialogDismissed })
          }
          onDeleteClick={
            state.actionableGoal
              ? () =>
                  dispatch({
                    type: StateActionType.RemoveClick,
                    payload: state.actionableGoal!,
                  })
              : undefined
          }
          goal={state.actionableGoal}
        />
      )}
      {state.isRemoveDialogOpen && (
        <GenericConfirmationDialog
          isOpen={true}
          onClose={() => dispatch({ type: StateActionType.DialogDismissed })}
          onPositiveClick={() => {
            deleteGoalRequest.mutate(state.actionableGoal?.goal_id || -1n);
            dispatch({ type: StateActionType.DialogDismissed });
          }}
          onNegativeClick={() =>
            dispatch({ type: StateActionType.DialogDismissed })
          }
          titleText={t('goals.deleteGoalModalTitle', {
            name: state.actionableGoal?.name,
          })}
          descriptionText={t('goals.deleteGoalModalSubtitle')}
          alert={t('goals.deleteGoalModalAlert')}
          positiveText={t('common.delete')}
        />
      )}
      <div className="flex flex-col justify-between gap-2">
        <PageHeader
          title={t('goals.goals')}
          subtitle={t('goals.strapLine')}
          titleChipText={'Beta'}
        />
        <Alert className="mb-2 border-primary/50">
          <AlertTitle>{t('goals.betaAlertTitle')}</AlertTitle>
          <AlertDescription>
            {t('goals.betaAlertIntro')}{' '}
            <a
              href="https://myfinbudget.com/goto/wiki-goals"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4"
            >
              {t('goals.betaAlertDocText')}
            </a>{' '}
            {t('goals.betaAlertPostDoc')}{' '}
            <a
              href="https://myfinbudget.com/goto/gh-discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4"
            >
              {t('goals.betaAlertContactText')}
            </a>
            .
          </AlertDescription>
        </Alert>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {sortedGoalsForCards.map((goal) => (
            <GoalCard
              key={String(goal.goal_id)}
              goal={goal}
              onClick={() =>
                dispatch({ type: StateActionType.EditClick, payload: goal })
              }
              formatCurrency={formatNumberAsCurrency.invoke}
            />
          ))}
          <Card
            role="button"
            tabIndex={0}
            onClick={() => dispatch({ type: StateActionType.AddClick })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                dispatch({ type: StateActionType.AddClick });
              }
            }}
            className="border-muted-foreground/40 flex min-h-[280px] cursor-pointer flex-col items-center justify-center border-2 border-dashed bg-transparent transition-colors hover:border-primary hover:bg-primary/5"
          >
            <CirclePlus className="text-muted-foreground mb-1 size-12" />
            <p className="text-muted-foreground text-sm">
              {t('goals.addGoalCTA')}
            </p>
          </Card>
        </div>
      </div>

      <details className="group rounded-lg border">
        <summary className="hover:bg-muted/50 flex cursor-pointer list-none items-center gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
          <span className="font-medium">{t('goals.fullList')}</span>
        </summary>
        <div className="border-t px-4 pb-4">
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-12 md:items-center">
            <div className="flex items-center gap-2 md:col-span-8">
              <Checkbox
                id="show-archived"
                checked={showArchived}
                onCheckedChange={(c) => setShowArchived(c === true)}
              />
              <Label htmlFor="show-archived" className="cursor-pointer">
                {t('goals.showArchived')}
              </Label>
            </div>
            <div className="flex justify-end md:col-span-4">
              <div className="flex w-full max-w-sm flex-col gap-2">
                <Label htmlFor="goals-search">{t('common.search')}</Label>
                <div className="relative">
                  <Search className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 opacity-70" />
                  <Input
                    id="goals-search"
                    className="pr-10"
                    onChange={(event) => {
                      dispatch({
                        type: StateActionType.SearchQueryUpdated,
                        payload: event.target.value,
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <MyFinStaticTable
            isRefetching={getGoalsRequest.isRefetching}
            rows={rows || []}
            columns={columns}
            paginationModel={{ pageSize: 20 }}
            onRowClicked={(id) => {
              const goal = state.goals?.find((goal) => goal.goal_id == id);
              if (!goal) return;
              dispatch({ type: StateActionType.EditClick, payload: goal });
            }}
          />
        </div>
      </details>
    </div>
  );
};

export default Goals;
