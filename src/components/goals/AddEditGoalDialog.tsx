import { DatePickerField } from '@/common/shadcn/DatePickerField.tsx';
import dayjs, { Dayjs } from 'dayjs';
import React, { useEffect, useMemo, useReducer } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { NumericFormat } from 'react-number-format';
import {
  ChevronDown,
  FileText,
  Flag,
  Landmark,
  Play,
  Plus,
  Send,
  Snowflake,
  Trash2,
  Undo,
} from 'lucide-react';
import CurrencyIcon from '../../components/CurrencyIcon.tsx';
import { useLoading } from '../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../providers/SnackbarProvider.tsx';
import { useGetAccounts } from '@/hooks/account';
import { Account } from '@/common/api/auth';
import { useCreateGoal, useUpdateGoal } from '@/hooks/goal';
import { Goal } from '@/common/api/goal';
import { useFormatNumberAsCurrency } from '../../utils/textHooks.ts';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Checkbox } from '@/common/shadcn/ui/checkbox.tsx';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/common/shadcn/ui/dialog.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/common/shadcn/ui/select.tsx';
import { ToggleGroup, ToggleGroupItem } from '@/common/shadcn/ui/toggle-group.tsx';
import { cn } from '@/common/shadcn/lib/utils';

type AccountOption = {
  id: number;
  label: string;
  balance: number;
};

type FundingAccountInput = {
  account: AccountOption | null;
  funding_type: 'absolute' | 'relative';
  funding_amount: number | '';
};

type UiState = {
  isLoading: boolean;
  nameInput: string;
  descriptionInput: string;
  priorityInput: number | '';
  amountInput: number | '';
  isArchivedInput: boolean;
  hasDueDate: boolean;
  dueDateInput: Dayjs | null;
  fundingAccounts: FundingAccountInput[];
  accounts?: Account[];
};

const enum StateActionType {
  RequestStarted,
  RequestSuccess,
  RequestError,
  NameUpdated,
  DescriptionUpdated,
  PriorityUpdated,
  AmountUpdated,
  IsArchivedUpdated,
  HasDueDateToggled,
  DueDateUpdated,
  AccountsLoaded,
  AddFundingAccount,
  RemoveFundingAccount,
  UpdateFundingAccount,
}

type StateAction =
  | { type: StateActionType.RequestStarted }
  | { type: StateActionType.RequestSuccess }
  | { type: StateActionType.RequestError }
  | { type: StateActionType.NameUpdated; payload: string }
  | { type: StateActionType.DescriptionUpdated; payload: string }
  | { type: StateActionType.PriorityUpdated; payload: number | '' }
  | { type: StateActionType.AmountUpdated; payload: number | '' }
  | { type: StateActionType.IsArchivedUpdated; payload: boolean }
  | { type: StateActionType.HasDueDateToggled; payload: boolean }
  | { type: StateActionType.DueDateUpdated; payload: Dayjs | null }
  | { type: StateActionType.AccountsLoaded; payload: Account[] }
  | { type: StateActionType.AddFundingAccount }
  | { type: StateActionType.RemoveFundingAccount; payload: number }
  | {
      type: StateActionType.UpdateFundingAccount;
      payload: {
        index: number;
        field: keyof FundingAccountInput;
        value: unknown;
      };
    };

const createInitialState = (args: { goal: Goal | undefined }): UiState => {
  const hasDueDate = args.goal?.due_date != null;

  return {
    isLoading: false,
    nameInput: args.goal?.name ?? '',
    descriptionInput: args.goal?.description ?? '',
    priorityInput: args.goal?.priority ?? 1,
    amountInput: args.goal?.amount ?? '',
    isArchivedInput: args.goal?.is_archived ?? false,
    hasDueDate: hasDueDate,
    dueDateInput: hasDueDate ? dayjs.unix(args.goal!.due_date!) : null,
    fundingAccounts:
      args.goal?.funding_accounts.map(
        (fa) =>
          ({
            account: null,
            funding_type: fa.funding_type,
            funding_amount: fa.funding_amount,
            _account_id: fa.account_id,
          }) as FundingAccountInput & { _account_id?: number },
      ) ?? [],
  };
};

const reduceState = (prevState: UiState, action: StateAction): UiState => {
  switch (action.type) {
    case StateActionType.RequestStarted:
      return { ...prevState, isLoading: true };
    case StateActionType.RequestSuccess:
    case StateActionType.RequestError:
      return { ...prevState, isLoading: false };
    case StateActionType.NameUpdated:
      return { ...prevState, nameInput: action.payload };
    case StateActionType.DescriptionUpdated:
      return { ...prevState, descriptionInput: action.payload };
    case StateActionType.PriorityUpdated:
      return { ...prevState, priorityInput: action.payload };
    case StateActionType.AmountUpdated:
      return { ...prevState, amountInput: action.payload };
    case StateActionType.IsArchivedUpdated:
      return { ...prevState, isArchivedInput: action.payload };
    case StateActionType.HasDueDateToggled:
      return {
        ...prevState,
        hasDueDate: action.payload,
        dueDateInput: action.payload ? dayjs() : null,
      };
    case StateActionType.DueDateUpdated:
      return { ...prevState, dueDateInput: action.payload };
    case StateActionType.AccountsLoaded: {
      const accountOptions = action.payload.map((acc) => ({
        id: Number(acc.account_id),
        label: acc.name,
        balance: acc.balance,
      }));
      const updatedFundingAccounts = prevState.fundingAccounts.map((fa) => {
        const faWithId = fa as FundingAccountInput & { _account_id?: number };
        if (faWithId._account_id != null) {
          const account = accountOptions.find(
            (a) => a.id === faWithId._account_id,
          );
          return {
            account: account || null,
            funding_type: fa.funding_type,
            funding_amount: fa.funding_amount,
          };
        }
        return fa;
      });
      return {
        ...prevState,
        accounts: action.payload,
        fundingAccounts: updatedFundingAccounts,
      };
    }
    case StateActionType.AddFundingAccount:
      return {
        ...prevState,
        fundingAccounts: [
          ...prevState.fundingAccounts,
          { account: null, funding_type: 'absolute', funding_amount: '' },
        ],
      };
    case StateActionType.RemoveFundingAccount:
      return {
        ...prevState,
        fundingAccounts: prevState.fundingAccounts.filter(
          (_, i) => i !== action.payload,
        ),
      };
    case StateActionType.UpdateFundingAccount: {
      const { index, field, value } = action.payload;
      const updated = [...prevState.fundingAccounts];
      updated[index] = { ...updated[index], [field]: value };

      if (field === 'funding_type' && value === 'relative') {
        updated[index].funding_amount = 100;
      }

      return { ...prevState, fundingAccounts: updated };
    }
  }
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onNegativeClick: () => void;
  onDeleteClick?: () => void;
  goal: Goal | undefined;
};

const AddEditGoalDialog = (props: Props) => {
  const isEditForm = props.goal !== undefined;

  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();
  const formatNumberAsCurrency = useFormatNumberAsCurrency();

  const createGoalRequest = useCreateGoal();
  const updateGoalRequest = useUpdateGoal();
  const getAccountsRequest = useGetAccounts();

  const [state, dispatch] = useReducer(
    reduceState,
    { goal: props.goal },
    createInitialState,
  );

  const accountOptions: AccountOption[] = useMemo(() => {
    return (
      state.accounts?.map((acc) => ({
        id: Number(acc.account_id),
        label: acc.name,
        balance: acc.balance,
      })) ?? []
    );
  }, [state.accounts]);

  const validateFundingAccount = (
    fa: FundingAccountInput,
    goalAmount: number,
  ): string | null => {
    if (fa.account == null || fa.funding_amount === '') return null;

    const amount = fa.funding_amount as number;

    if (fa.funding_type === 'relative') {
      if (amount < 0 || amount > 100) {
        return t('goals.percentageMustBeBetween0And100');
      }
    } else {
      if (amount < 0) {
        return t('goals.amountMustBePositive');
      }
      if (amount > goalAmount) {
        return t('goals.amountCannotExceedGoal');
      }
    }
    return null;
  };

  const isFormValid = useMemo(() => {
    if (!state.nameInput.trim()) return false;
    if (!state.amountInput || state.amountInput <= 0) return false;
    if (!state.priorityInput || state.priorityInput < 1) return false;

    if (state.hasDueDate && !state.dueDateInput?.isValid()) return false;

    const goalAmount = state.amountInput as number;
    for (const fa of state.fundingAccounts) {
      if (fa.account != null) {
        if (fa.funding_amount === '' || fa.funding_amount <= 0) return false;
        const error = validateFundingAccount(fa, goalAmount);
        if (error) return false;
      }
    }

    return true;
  }, [state]);

  useEffect(() => {
    if (state.isLoading) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [state.isLoading]);

  useEffect(() => {
    if (getAccountsRequest.data) {
      dispatch({
        type: StateActionType.AccountsLoaded,
        payload: getAccountsRequest.data,
      });
    }
  }, [getAccountsRequest.data]);

  useEffect(() => {
    if (createGoalRequest.isError || updateGoalRequest.isError) {
      dispatch({ type: StateActionType.RequestError });
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [createGoalRequest.isError, updateGoalRequest.isError]);

  useEffect(() => {
    if (!createGoalRequest.data && !updateGoalRequest.data) return;
    dispatch({ type: StateActionType.RequestSuccess });
    setTimeout(() => {
      props.onSuccess();
    }, 0);
  }, [createGoalRequest.data, updateGoalRequest.data]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      snackbar.showSnackbar(
        t('common.fillAllFieldsTryAgain'),
        AlertSeverity.ERROR,
      );
      return;
    }

    const dueDateTimestamp =
      state.hasDueDate && state.dueDateInput ? state.dueDateInput.unix() : null;

    const fundingAccounts = state.fundingAccounts
      .filter((fa) => fa.account != null && fa.funding_amount !== '')
      .map((fa) => ({
        account_id: fa.account!.id,
        funding_type: fa.funding_type,
        funding_amount: fa.funding_amount as number,
      }));

    dispatch({ type: StateActionType.RequestStarted });

    if (isEditForm && props.goal) {
      updateGoalRequest.mutate({
        goalId: props.goal.goal_id,
        request: {
          name: state.nameInput,
          description: state.descriptionInput,
          priority: state.priorityInput as number,
          amount: state.amountInput as number,
          due_date: dueDateTimestamp,
          is_archived: state.isArchivedInput,
          funding_accounts: fundingAccounts,
        },
      });
    } else {
      createGoalRequest.mutate({
        name: state.nameInput,
        description: state.descriptionInput,
        priority: state.priorityInput as number,
        amount: state.amountInput as number,
        due_date: dueDateTimestamp,
        funding_accounts: fundingAccounts,
      });
    }
  };

  const archiveToggleValue = state.isArchivedInput ? 'archived' : 'active';

  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <DialogTitle className="text-left">
                <Trans
                  i18nKey={
                    isEditForm
                      ? 'goals.editGoalModalTitle'
                      : 'goals.addGoalModalTitle'
                  }
                  values={{ name: props.goal?.name }}
                />
              </DialogTitle>
              {isEditForm && (
                <ToggleGroup
                  type="single"
                  value={archiveToggleValue}
                  onValueChange={(v) => {
                    if (v === 'active' || v === 'archived') {
                      dispatch({
                        type: StateActionType.IsArchivedUpdated,
                        payload: v === 'archived',
                      });
                    }
                  }}
                  className="justify-end"
                >
                  <ToggleGroupItem value="active" className="gap-1 px-3">
                    <Play className="size-4" />
                    <span className="text-sm">{t('goals.active')}</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="archived" className="gap-1 px-3">
                    <Snowflake className="size-4" />
                    <span className="text-sm">{t('goals.archived')}</span>
                  </ToggleGroupItem>
                </ToggleGroup>
              )}
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="flex flex-col gap-2 md:col-span-7">
              <Label htmlFor="goal-name">{t('goals.name')}</Label>
              <div className="relative">
                <Flag className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  required
                  id="goal-name"
                  value={state.nameInput}
                  onChange={(e) =>
                    dispatch({
                      type: StateActionType.NameUpdated,
                      payload: e.target.value,
                    })
                  }
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 md:col-span-3">
              <Label htmlFor="goal-amount">{t('goals.targetAmount')}</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <CurrencyIcon />
                </span>
                <NumericFormat
                  required
                  id="goal-amount"
                  name="amount"
                  customInput={Input}
                  className={cn('pl-10')}
                  decimalScale={2}
                  fixedDecimalScale
                  thousandSeparator
                  value={state.amountInput}
                  onValueChange={(values) => {
                    const { floatValue } = values;
                    dispatch({
                      type: StateActionType.AmountUpdated,
                      payload: floatValue ?? 0,
                    });
                  }}
                  onFocus={(event) => {
                    event.target.select();
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="goal-priority">{t('goals.priority')}</Label>
              <Input
                required
                id="goal-priority"
                type="number"
                min={1}
                value={state.priorityInput}
                onChange={(e) =>
                  dispatch({
                    type: StateActionType.PriorityUpdated,
                    payload:
                      e.target.value === '' ? '' : Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-6">
              <Label htmlFor="goal-description">{t('goals.description')}</Label>
              <div className="relative">
                <FileText className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  id="goal-description"
                  value={state.descriptionInput}
                  onChange={(e) =>
                    dispatch({
                      type: StateActionType.DescriptionUpdated,
                      payload: e.target.value,
                    })
                  }
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 md:col-span-3">
              <Checkbox
                id="has-due-date"
                checked={state.hasDueDate}
                onCheckedChange={(c) =>
                  dispatch({
                    type: StateActionType.HasDueDateToggled,
                    payload: c === true,
                  })
                }
              />
              <Label htmlFor="has-due-date" className="cursor-pointer">
                {t('goals.setDueDate')}
              </Label>
            </div>

            <div className="md:col-span-3">
              {state.hasDueDate && (
                <DatePickerField
                  label={t('goals.dueDate')}
                  value={state.dueDateInput}
                  onChange={(newValue) =>
                    dispatch({
                      type: StateActionType.DueDateUpdated,
                      payload: newValue,
                    })
                  }
                  format="DD/MM/YYYY"
                  required
                />
              )}
            </div>

            <div className="md:col-span-12">
              <details
                className="group rounded-md border"
                open={state.fundingAccounts.length > 0}
              >
                <summary className="flex cursor-pointer list-none items-start gap-2 p-4 [&::-webkit-details-marker]:hidden">
                  <ChevronDown className="mt-0.5 size-4 shrink-0 transition-transform group-open:rotate-180" />
                  <div className="grid flex-1 gap-1 sm:grid-cols-2">
                    <span className="font-medium">
                      {t('goals.fundingAccounts')}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {t('goals.fundingAccountsDescription')}
                    </span>
                  </div>
                </summary>
                <div className="border-t px-4 pb-4">
                  <div className="grid grid-cols-1 gap-4 pt-2">
                    {state.fundingAccounts.length === 0 && (
                      <p className="text-muted-foreground py-2 text-center text-sm">
                        {t('goals.noFundingAccounts')}
                      </p>
                    )}

                    {state.fundingAccounts.map((fa, index) => {
                      const goalAmount = (state.amountInput as number) || 0;
                      const error = validateFundingAccount(fa, goalAmount);
                      return (
                        <div
                          key={index}
                          className="grid grid-cols-1 items-start gap-4 md:grid-cols-12"
                        >
                          <div className="flex flex-col gap-2 md:col-span-4">
                            <Label>{t('common.account')}</Label>
                            <Select
                              value={
                                fa.account != null
                                  ? String(fa.account.id)
                                  : undefined
                              }
                              onValueChange={(v) => {
                                const opt = accountOptions.find(
                                  (a) => String(a.id) === v,
                                );
                                dispatch({
                                  type: StateActionType.UpdateFundingAccount,
                                  payload: {
                                    index,
                                    field: 'account',
                                    value: opt ?? null,
                                  },
                                });
                              }}
                            >
                              <SelectTrigger className="relative w-full pl-10">
                              <Landmark className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                              <SelectValue placeholder={t('common.account')} />
                            </SelectTrigger>
                              <SelectContent>
                                {accountOptions.map((c) => (
                                  <SelectItem
                                    key={c.id}
                                    value={String(c.id)}
                                  >
                                    {`${c.label} (${formatNumberAsCurrency.invoke(c.balance)})`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex flex-col gap-2 md:col-span-3">
                            <Label>{t('goals.fundingType')}</Label>
                            <Select
                              value={fa.funding_type}
                              onValueChange={(v) =>
                                dispatch({
                                  type: StateActionType.UpdateFundingAccount,
                                  payload: {
                                    index,
                                    field: 'funding_type',
                                    value: v as 'absolute' | 'relative',
                                  },
                                })
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="absolute">
                                  {t('goals.fundingTypeAbsolute')}
                                </SelectItem>
                                <SelectItem value="relative">
                                  {t('goals.fundingTypeRelative')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex flex-col gap-2 md:col-span-4">
                            <Label>
                              {fa.funding_type === 'absolute'
                                ? t('goals.fundingAmount')
                                : t('goals.fundingPercentage')}
                            </Label>
                            <NumericFormat
                              required
                              id={`funding_amount_${index}`}
                              customInput={Input}
                              className={cn(error && 'border-destructive')}
                              decimalScale={2}
                              fixedDecimalScale
                              thousandSeparator
                              value={fa.funding_amount}
                              onValueChange={(values) => {
                                const { floatValue } = values;
                                dispatch({
                                  type: StateActionType.UpdateFundingAccount,
                                  payload: {
                                    index,
                                    field: 'funding_amount',
                                    value: Number(floatValue ?? 0),
                                  },
                                });
                              }}
                              onFocus={(event) => {
                                event.target.select();
                              }}
                            />
                            {error ? (
                              <p className="text-destructive text-xs">{error}</p>
                            ) : null}
                          </div>

                          <div className="flex items-center justify-end pb-1 md:col-span-1 md:justify-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                dispatch({
                                  type: StateActionType.RemoveFundingAccount,
                                  payload: index,
                                })
                              }
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={() =>
                        dispatch({ type: StateActionType.AddFundingAccount })
                      }
                    >
                      <Plus className="mr-2 size-4" />
                      {t('goals.addFundingAccount')}
                    </Button>
                  </div>
                </div>
              </details>
            </div>
          </div>

          <DialogFooter
            className={cn(
              'flex-col gap-2 sm:flex-row',
              isEditForm && props.onDeleteClick && 'sm:justify-between',
            )}
          >
            {isEditForm && props.onDeleteClick && (
              <Button
                type="button"
                variant="outline"
                className="border-amber-600 text-amber-800 hover:bg-amber-50 dark:text-amber-400"
                onClick={props.onDeleteClick}
              >
                <Trash2 className="mr-2 size-4" />
                {t('goals.deleteGoal')}
              </Button>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={props.onNegativeClick}
              >
                <Undo className="mr-2 size-4" />
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={!isFormValid}>
                <Send className="mr-2 size-4" />
                {isEditForm ? t('common.update') : t('common.add')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditGoalDialog;
