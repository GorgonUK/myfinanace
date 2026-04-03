import {
  Building2,
  FileText,
  FolderOpen,
  Merge,
  Send,
  Sparkles,
  Split,
  Star,
  Undo,
  UserCircle,
} from 'lucide-react';
import { DatePickerField } from '@/common/shadcn/DatePickerField.tsx';
import dayjs, { Dayjs } from 'dayjs';
import React, { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NumericFormat } from 'react-number-format';
import CurrencyIcon from '@/components/CurrencyIcon.tsx';
import { useLoading } from '@/providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '@/providers/SnackbarProvider.tsx';
import { useUserData } from '@/providers/UserProvider.tsx';
import { Account } from '@/common/api/auth';
import {
  useAddTransactionStep0,
  useAddTransactionStep1,
  useAutoCategorizeTransaction,
  useEditTransaction,
} from '@/hooks/trx';
import {
  Transaction,
  TransactionType,
} from '@/common/api/trx';
import { convertDateStringToUnixTimestamp } from '@/utils/dateUtils.ts';
import {
  inferTrxType,
  inferTrxTypeByAttributes,
} from '@/utils/transactionUtils.ts';
import { Badge } from '@/common/shadcn/ui/badge.tsx';
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
import { Separator } from '@/common/shadcn/ui/separator.tsx';
import { ToggleGroup, ToggleGroupItem } from '@/common/shadcn/ui/toggle-group.tsx';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/common/shadcn/ui/tooltip.tsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPositiveClick: () => void;
  onNegativeClick: () => void;
  transaction: Transaction | null;
}

export type IdLabelPair = {
  id: bigint;
  label: string;
};

const AddEditTransactionDialog = (props: Props) => {
  const isEditForm = props.transaction !== null;

  const getInitialIdLabelPair = (id?: bigint, name?: string) => {
    if (id == null || name == null) return null;
    return { id: id, label: name };
  };

  const { t } = useTranslation();
  const loader = useLoading();
  const snackbar = useSnackbar();
  const addTransactionStep0Request = useAddTransactionStep0();
  const addTransactionStep1Request = useAddTransactionStep1();
  const autoCategorizeTransactionRequest = useAutoCategorizeTransaction();
  const editTransactionRequest = useEditTransaction();
  const [transactionType, setTransactionType] =
    useState<TransactionType | null>(null);
  const [essentialValue, setEssentialValue] = useState<boolean>(false);
  const [amountValue, setAmountValue] = useState<number | null>(null);
  const [dateValue, setDateValue] = useState<Dayjs | null>(dayjs());
  const [descriptionValue, setDescriptionValue] = useState<string>('');
  const [isAccountFromEnabled, setAccountFromEnabled] = useState<boolean>(true);
  const [isAccountToEnabled, setAccountToEnabled] = useState<boolean>(true);

  const [accountFromValue, setAccountFromValue] = useState<IdLabelPair | null>(
    null,
  );
  const [accountToValue, setAccountToValue] = useState<IdLabelPair | null>(
    null,
  );
  const [categoryValue, setCategoryValue] = useState<IdLabelPair | null>(null);
  const [entityValue, setEntityValue] = useState<IdLabelPair | null>(null);

  const { userAccounts } = useUserData();

  const [accountOptionsValue, setAccountOptionsValue] = useState<IdLabelPair[]>(
    [],
  );
  const [categoryOptionsValue, setCategoryOptionsValue] = useState<
    IdLabelPair[]
  >([]);
  const [entityOptionsValue, setEntityOptionsValue] = useState<IdLabelPair[]>(
    [],
  );
  const [tagOptionsValue, setTagOptionsValue] = useState<string[]>([]);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAccountFromRequired, setAccountFromRequired] =
    useState<boolean>(true);
  const [isAccountToRequired, setAccountToRequired] = useState<boolean>(false);
  const [isEssentialVisible, setEssentialVisible] = useState(false);
  const [isAutoCatVisible, setAutoCatVisible] = useState(false);
  const [isSplitTransactionFormOpen, setSplitTransactionFormOpen] =
    useState(false);
  const [splitTransactionFormState, setSplitTransactionFormState] = useState<
    SplitTransactionFormState | undefined
  >();

  const tagListId = useId();

  useEffect(() => {
    setTransactionType(
      inferTrxType(props.transaction) || TransactionType.Expense,
    );
    setEssentialValue(props.transaction?.is_essential == 1);
    setAmountValue(props.transaction?.amount || null);
    setDateValue(
      props.transaction?.date_timestamp != null
        ? dayjs.unix(props.transaction.date_timestamp)
        : dayjs(),
    );
    setDescriptionValue(props.transaction?.description || '');
    setAccountFromValue(
      getInitialIdLabelPair(
        props.transaction?.accounts_account_from_id,
        props.transaction?.account_from_name,
      ),
    );
    setAccountToValue(
      getInitialIdLabelPair(
        props.transaction?.accounts_account_to_id,
        props.transaction?.account_to_name,
      ),
    );
    setCategoryValue(
      getInitialIdLabelPair(
        props.transaction?.categories_category_id,
        props.transaction?.category_name,
      ),
    );
    setEntityValue(
      getInitialIdLabelPair(
        props.transaction?.entity_id,
        props.transaction?.entity_name,
      ),
    );
    setSelectedTags(props.transaction?.tags?.map((tag) => tag.name) || []);
  }, [props.transaction]);

  useEffect(() => {
    if (!props.isOpen) return;
    addTransactionStep0Request.refetch();
  }, [props.isOpen]);

  useEffect(() => {
    // Show loading indicator when isLoading is true
    if (
      addTransactionStep0Request.isLoading ||
      editTransactionRequest.isPending ||
      addTransactionStep1Request.isPending ||
      autoCategorizeTransactionRequest.isPending
    ) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [
    addTransactionStep0Request.isPending,
    editTransactionRequest.isPending,
    addTransactionStep1Request.isPending,
    autoCategorizeTransactionRequest.isPending,
  ]);

  useEffect(() => {
    // Show error when isError is true
    if (
      addTransactionStep0Request.isError ||
      editTransactionRequest.isError ||
      addTransactionStep1Request.isError ||
      autoCategorizeTransactionRequest.isError
    ) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [
    addTransactionStep0Request.isError,
    editTransactionRequest.isError,
    addTransactionStep1Request.isError,
    autoCategorizeTransactionRequest.isError,
  ]);

  useEffect(() => {
    if (
      editTransactionRequest.isSuccess ||
      addTransactionStep1Request.isSuccess
    ) {
      props.onPositiveClick();
    }
  }, [editTransactionRequest.isSuccess, addTransactionStep1Request.isSuccess]);

  useEffect(() => {
    if (!transactionType) return;
    const shouldAccountFromBeEnabled =
      transactionType !== TransactionType.Income;
    const shouldAccountToBeEnabled =
      transactionType !== TransactionType.Expense;

    setAccountFromEnabled(shouldAccountFromBeEnabled);
    setAccountToEnabled(shouldAccountToBeEnabled);
    if (!shouldAccountFromBeEnabled) {
      setAccountFromValue(null);
    }
    if (!shouldAccountToBeEnabled) {
      setAccountToValue(null);
    }

    setAccountFromRequired(shouldAccountFromBeEnabled);
    setAccountToRequired(shouldAccountToBeEnabled);
    setEssentialVisible(transactionType == TransactionType.Expense);
    if (transactionType != TransactionType.Expense) {
      setEssentialValue(false);
    }
  }, [transactionType]);

  useEffect(() => {
    setSplitTransactionFormState((prevState) => ({
      ...prevState,
      type: prevState?.type ?? transactionType,
      accountFrom: prevState?.accountFrom ?? accountFromValue,
      accountTo: prevState?.accountTo ?? accountToValue,
    }));
  }, [transactionType, accountFromValue, accountToValue]);

  const transformUserAccountsIntoIdLabelPair = (userAccounts: Account[]) => {
    return userAccounts.map((acc) => ({
      id: acc.account_id,
      label: acc.name,
    }));
  };

  useEffect(() => {
    if (userAccounts) {
      const accounts = transformUserAccountsIntoIdLabelPair(userAccounts);
      setAccountOptionsValue(accounts);
      setSplitTransactionFormState((prevState) => ({
        ...prevState,
        accountOptions: accounts,
      }));
    }
  }, [userAccounts]);

  useEffect(() => {
    if (!addTransactionStep0Request.isSuccess) return;
    const categories = addTransactionStep0Request.data.categories.map(
      (category) => ({
        id: category.category_id || 0n,
        label: category.name || '',
      }),
    );
    setCategoryOptionsValue(categories);
    setSplitTransactionFormState((prevState) => ({
      ...prevState,
      categoryOptions: categories,
    }));

    const entities = addTransactionStep0Request.data.entities.map((entity) => ({
      id: entity.entity_id || 0n,
      label: entity.name || '',
    }));
    setEntityOptionsValue(entities);
    setSplitTransactionFormState((prevState) => ({
      ...prevState,
      entityOptions: entities,
    }));

    const tags = addTransactionStep0Request.data.tags.map((tag) => tag.name);
    setTagOptionsValue(tags);
    setSplitTransactionFormState((prevState) => ({
      ...prevState,
      tagOptions: tags,
    }));

    const accounts = transformUserAccountsIntoIdLabelPair(userAccounts || []);

    const cachedTrx = addTransactionStep0Request.data.cachedTrx;
    if (cachedTrx != null && !isEditForm) {
      /*setAmountValue(cachedTrx.amount);*/
      setTransactionType(
        inferTrxTypeByAttributes(
          cachedTrx.account_from_id,
          cachedTrx.account_to_id,
        ),
      );
      setAccountFromValue(
        accounts?.find((acc) => acc.id === cachedTrx.account_from_id) || null,
      );
      setAccountToValue(
        accounts?.find((acc) => acc.id === cachedTrx.account_to_id) || null,
      );
      setCategoryValue(
        categories.find((category) => category.id === cachedTrx.category_id) ||
          null,
      );
      setEntityValue(
        entities.find((entity) => entity.id === cachedTrx.entity_id) || null,
      );
    }
  }, [addTransactionStep0Request.data]);

  useEffect(() => {
    if (
      !autoCategorizeTransactionRequest.isSuccess ||
      !autoCategorizeTransactionRequest.data.matching_rule
    )
      return;

    const newData = autoCategorizeTransactionRequest.data;
    // Type
    setTransactionType(newData.type || TransactionType.Expense);
    // Date
    // Description
    setDescriptionValue(newData.description || '');
    // Amount
    setAmountValue(newData.amount || null);
    // Category
    setCategoryValue(
      categoryOptionsValue.find(
        (cat) => cat.id == newData.selectedCategoryID,
      ) || null,
    );
    // Entity
    setEntityValue(
      entityOptionsValue.find((ent) => ent.id == newData.selectedEntityID) ||
        null,
    );
    // Account From
    setAccountFromValue(
      accountOptionsValue.find(
        (acc) => acc.id == newData.selectedAccountFromID,
      ) || null,
    );
    // Account To
    setAccountToValue(
      accountOptionsValue.find(
        (acc) => acc.id == newData.selectedAccountToID,
      ) || null,
    );
    // Essential
    setEssentialValue(newData.isEssential == true);
  }, [autoCategorizeTransactionRequest.isSuccess]);

  useEffect(() => {
    setAutoCatVisible(!!descriptionValue);
  }, [descriptionValue]);

  // When the split sub-form is toggled, add/subtract the split value from the original value
  useEffect(() => {
    let splitAmount = splitTransactionFormState?.amount ?? 0;
    if (isSplitTransactionFormOpen) splitAmount *= -1;
    setAmountValue((prevState) => Number(prevState ?? 0 + '') + splitAmount);
  }, [isSplitTransactionFormOpen]);

  const onTransactionTypeSelected = (newType: string) => {
    if (
      Object.values(TransactionType).includes(newType as TransactionType)
    ) {
      setTransactionType(newType as TransactionType);
    }
  };

  const handleAutoCategorizeClick = () => {
    autoCategorizeTransactionRequest.mutate({
      description: descriptionValue,
      amount: Number(amountValue),
      account_from_id: BigInt(accountFromValue?.id || -1n),
      account_to_id: BigInt(accountToValue?.id || -1n),
      type: transactionType ?? TransactionType.Expense,
    });
  };

  const handleSplitTransactionClick = () => {
    setSplitTransactionFormOpen(!isSplitTransactionFormOpen);
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isEssential = essentialValue;
    const accountFrom = accountFromValue;
    const accountTo = accountToValue;
    const category = categoryValue;
    const entity = entityValue;

    const dateStr = dateValue?.isValid()
      ? dateValue.format('DD/MM/YYYY')
      : dayjs().format('DD/MM/YYYY');
    const dateTs = convertDateStringToUnixTimestamp(dateStr, 'DD/MM/YYYY');

    const splitAmount = isSplitTransactionFormOpen
      ? splitTransactionFormState?.amount
      : undefined;

    const splitCategory = isSplitTransactionFormOpen
      ? splitTransactionFormState?.category
      : undefined;

    const splitEntity = isSplitTransactionFormOpen
      ? splitTransactionFormState?.entity
      : undefined;

    const splitType = isSplitTransactionFormOpen
      ? splitTransactionFormState?.type
      : undefined;

    const splitAccountFrom = isSplitTransactionFormOpen
      ? splitTransactionFormState?.accountFrom?.id
      : undefined;

    const splitAccountTo = isSplitTransactionFormOpen
      ? splitTransactionFormState?.accountTo?.id
      : undefined;

    const splitDescription = isSplitTransactionFormOpen
      ? splitTransactionFormState?.description
      : undefined;

    const splitEssential = isSplitTransactionFormOpen
      ? splitTransactionFormState?.isEssential
      : undefined;

    const splitTags = isSplitTransactionFormOpen
      ? JSON.stringify(splitTransactionFormState?.tags)
      : undefined;

    if (isEditForm) {
      editTransactionRequest.mutate({
        transaction_id: props.transaction?.transaction_id ?? -1n,
        new_amount: amountValue as number,
        new_type: transactionType ?? TransactionType.Expense,
        new_description: descriptionValue,
        new_account_from_id:
          typeof accountFrom === 'string' ? undefined : accountFrom?.id,
        new_account_to_id:
          typeof accountTo === 'string' ? undefined : accountTo?.id,
        new_category_id:
          typeof category === 'string' ? undefined : category?.id,
        new_entity_id: typeof entity === 'string' ? undefined : entity?.id,
        tags: JSON.stringify(selectedTags),
        new_date_timestamp: dateTs,
        new_is_essential: isEssential,
        is_split: isSplitTransactionFormOpen,
        split_amount: splitAmount,
        split_category: splitCategory?.id,
        split_entity: splitEntity?.id,
        split_type: splitType ?? TransactionType.Expense,
        split_account_from: splitAccountFrom,
        split_account_to: splitAccountTo,
        split_description: splitDescription,
        split_is_essential: splitEssential,
        split_tags: splitTags,
      });
    } else {
      addTransactionStep1Request.mutate({
        amount: amountValue as number,
        type: transactionType ?? TransactionType.Expense,
        description: descriptionValue,
        account_from_id: accountFrom?.id,
        account_to_id: accountTo?.id,
        category_id: category?.id,
        entity_id: entity?.id,
        tags: JSON.stringify(selectedTags),
        date_timestamp: dateTs,
        is_essential: isEssential,
      });
    }
  };

  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-3xl">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <DialogHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <DialogTitle className="text-left lg:max-w-[55%]">
                {t(
                  isEditForm
                    ? 'transactions.editTransactionModalTitle'
                    : 'transactions.addNewTransaction',
                  {
                    id: props.transaction?.transaction_id,
                  },
                )}
              </DialogTitle>
              <ToggleGroup
                type="single"
                value={transactionType ?? TransactionType.Expense}
                onValueChange={(v) => v && onTransactionTypeSelected(v)}
                className="flex flex-wrap justify-start lg:justify-end"
                aria-label={t('transactions.typeOfTrx')}
              >
                <ToggleGroupItem
                  value={TransactionType.Expense}
                  aria-label={t('transactions.expense')}
                >
                  {t('transactions.expense')}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value={TransactionType.Transfer}
                  aria-label={t('transactions.transfer')}
                >
                  {t('transactions.transfer')}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value={TransactionType.Income}
                  aria-label={t('transactions.income')}
                >
                  {t('transactions.income')}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            {isEssentialVisible && (
              <div className="flex items-center gap-2 md:col-span-4">
                <Checkbox
                  id="essential"
                  checked={essentialValue}
                  onCheckedChange={(c) => setEssentialValue(c === true)}
                />
                <Label htmlFor="essential" className="flex cursor-pointer items-center gap-1">
                  <Star className="size-4 text-amber-500" />
                  {t('transactions.essential')}
                </Label>
              </div>
            )}

            <div className="flex flex-col gap-2 md:col-span-3">
              <Label htmlFor="trx-amount">{t('common.value')}</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <CurrencyIcon />
                </span>
                <NumericFormat
                  value={amountValue}
                  onValueChange={(values) => {
                    const { floatValue } = values;
                    setAmountValue(floatValue || 0);
                  }}
                  customInput={Input}
                  id="trx-amount"
                  required
                  autoFocus
                  className="pl-10"
                  decimalScale={2}
                  fixedDecimalScale
                  thousandSeparator
                  onFocus={(event) => {
                    event.target.select();
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 md:col-span-3">
              <DatePickerField
                id="trx-date"
                name="date"
                label={t('transactions.dateOfTransaction')}
                value={dateValue}
                onChange={(newValue) => setDateValue(newValue)}
                format="DD/MM/YYYY"
                required
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-6">
              <Label htmlFor="trx-description">{t('common.description')}</Label>
              <div className="relative flex items-center">
                <FileText className="text-muted-foreground pointer-events-none absolute left-3 size-4" />
                <Input
                  id="trx-description"
                  name="description"
                  value={descriptionValue}
                  onChange={(e) => setDescriptionValue(e.target.value)}
                  className="pr-12 pl-10"
                />
                {isAutoCatVisible && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 size-9 shrink-0"
                        aria-label={t('transactions.autoCategorize')}
                        onClick={handleAutoCategorizeClick}
                      >
                        <Sparkles className="text-primary size-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t('transactions.autoCategorize')}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 md:col-span-6">
              <Label htmlFor="account_from">{t('transactions.originAccount')}</Label>
              <Select
                disabled={!isAccountFromEnabled}
                value={
                  accountFromValue != null
                    ? String(accountFromValue.id)
                    : undefined
                }
                onValueChange={(v) => {
                  const opt = accountOptionsValue.find(
                    (o) => String(o.id) === v,
                  );
                  setAccountFromValue(opt ?? null);
                }}
                required={isAccountFromRequired}
              >
                <SelectTrigger id="account_from" className="relative w-full pl-10">
                  <UserCircle className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                  <SelectValue placeholder={t('transactions.originAccount')} />
                </SelectTrigger>
                <SelectContent>
                  {accountOptionsValue.map((o) => (
                    <SelectItem key={String(o.id)} value={String(o.id)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 md:col-span-6">
              <Label htmlFor="account_to">
                {t('transactions.destinationAccount')}
              </Label>
              <Select
                disabled={!isAccountToEnabled}
                value={
                  accountToValue != null ? String(accountToValue.id) : undefined
                }
                onValueChange={(v) => {
                  const opt = accountOptionsValue.find(
                    (o) => String(o.id) === v,
                  );
                  setAccountToValue(opt ?? null);
                }}
                required={isAccountToRequired}
              >
                <SelectTrigger id="account_to" className="relative w-full pl-10">
                  <UserCircle className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                  <SelectValue
                    placeholder={t('transactions.destinationAccount')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {accountOptionsValue.map((o) => (
                    <SelectItem key={String(o.id)} value={String(o.id)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 md:col-span-6">
              <Label htmlFor="category">{t('transactions.category')}</Label>
              <Select
                value={
                  categoryValue != null ? String(categoryValue.id) : undefined
                }
                onValueChange={(v) => {
                  const opt = categoryOptionsValue.find(
                    (o) => String(o.id) === v,
                  );
                  setCategoryValue(opt ?? null);
                }}
              >
                <SelectTrigger id="category" className="relative w-full pl-10">
                  <FolderOpen className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                  <SelectValue placeholder={t('transactions.category')} />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptionsValue.map((o) => (
                    <SelectItem key={String(o.id)} value={String(o.id)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 md:col-span-6">
              <Label htmlFor="entity">{t('transactions.entity')}</Label>
              <Select
                value={entityValue != null ? String(entityValue.id) : undefined}
                onValueChange={(v) => {
                  const opt = entityOptionsValue.find(
                    (o) => String(o.id) === v,
                  );
                  setEntityValue(opt ?? null);
                }}
              >
                <SelectTrigger id="entity" className="relative w-full pl-10">
                  <Building2 className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                  <SelectValue placeholder={t('transactions.entity')} />
                </SelectTrigger>
                <SelectContent>
                  {entityOptionsValue.map((o) => (
                    <SelectItem key={String(o.id)} value={String(o.id)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 md:col-span-12">
              <Label htmlFor={`tags-input-${tagListId}`}>{t('tags.tags')}</Label>
              <div className="flex flex-wrap gap-1">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 pr-0.5 font-normal"
                  >
                    {tag}
                    <button
                      type="button"
                      className="hover:bg-muted rounded px-1.5 py-0.5 text-sm leading-none"
                      aria-label={`Remove ${tag}`}
                      onClick={() =>
                        setSelectedTags((s) => s.filter((x) => x !== tag))
                      }
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                id={`tags-input-${tagListId}`}
                list={tagListId}
                placeholder={t('transactions.addAnotherTagPlaceholder')}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  e.preventDefault();
                  const v = e.currentTarget.value.trim();
                  if (v && !selectedTags.includes(v)) {
                    setSelectedTags([...selectedTags, v]);
                  }
                  e.currentTarget.value = '';
                }}
              />
              <datalist id={tagListId}>
                {tagOptionsValue
                  .filter((x) => !selectedTags.includes(x))
                  .map((opt) => (
                    <option key={opt} value={opt} />
                  ))}
              </datalist>
            </div>

            {isSplitTransactionFormOpen && (
              <div className="mt-4 md:col-span-12">
                <SplitTransactionForm
                  state={splitTransactionFormState}
                  tagListId={`${tagListId}-split`}
                  handleEssentialInputChange={(checked) =>
                    setSplitTransactionFormState((prevState) => ({
                      ...prevState,
                      isEssential: checked,
                    }))
                  }
                  handleTransactionTypeChange={(type) =>
                    setSplitTransactionFormState((prevState) => ({
                      ...prevState,
                      type,
                    }))
                  }
                  handleAccountFromChange={(accountFrom) =>
                    setSplitTransactionFormState((prevState) => ({
                      ...prevState,
                      accountFrom,
                    }))
                  }
                  handleAccountToChange={(accountTo) =>
                    setSplitTransactionFormState((prevState) => ({
                      ...prevState,
                      accountTo,
                    }))
                  }
                  handleAmountChange={(amount) =>
                    setSplitTransactionFormState((prevState) => ({
                      ...prevState,
                      amount,
                    }))
                  }
                  handleCategoryChange={(category) =>
                    setSplitTransactionFormState((prevState) => ({
                      ...prevState,
                      category,
                    }))
                  }
                  handleDescriptionChange={(description) =>
                    setSplitTransactionFormState((prevState) => ({
                      ...prevState,
                      description,
                    }))
                  }
                  handleEntityChange={(entity) =>
                    setSplitTransactionFormState((prevState) => ({
                      ...prevState,
                      entity,
                    }))
                  }
                  handleTagsChange={(tags) =>
                    setSplitTransactionFormState((prevState) => ({
                      ...prevState,
                      tags,
                    }))
                  }
                  isOpen={isSplitTransactionFormOpen}
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-wrap gap-2 sm:justify-end">
            {isEditForm && (
              <Button
                type="button"
                variant="ghost"
                className="mr-auto"
                onClick={handleSplitTransactionClick}
              >
                {isSplitTransactionFormOpen ? (
                  <Merge className="mr-2 size-4" />
                ) : (
                  <Split className="mr-2 size-4" />
                )}
                {isSplitTransactionFormOpen
                  ? t('transactions.mergeTransactions')
                  : t('transactions.splitTransaction')}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={props.onNegativeClick}>
              <Undo className="mr-2 size-4" />
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              <Send className="mr-2 size-4" />
              {t(isEditForm ? 'common.edit' : 'common.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

type SplitTransactionFormState = {
  amount?: number;
  description?: string;
  type?: TransactionType | null;
  accountFrom?: IdLabelPair | null;
  accountTo?: IdLabelPair | null;
  category?: IdLabelPair;
  entity?: IdLabelPair;
  isEssential?: boolean;
  tags?: string[];
  accountOptions?: IdLabelPair[];
  categoryOptions?: IdLabelPair[];
  entityOptions?: IdLabelPair[];
  tagOptions?: string[];
};

type SplitTransactionFormProps = {
  isOpen: boolean;
  tagListId: string;
  state?: SplitTransactionFormState;
  handleEssentialInputChange: (checked: boolean) => void;
  handleTransactionTypeChange: (type: TransactionType) => void;
  handleDescriptionChange: (input: string) => void;
  handleAccountFromChange: (input: IdLabelPair | undefined) => void;
  handleAccountToChange: (input: IdLabelPair | undefined) => void;
  handleCategoryChange: (input: IdLabelPair | undefined) => void;
  handleEntityChange: (input: IdLabelPair | undefined) => void;
  handleAmountChange: (input: number) => void;
  handleTagsChange: (tags: string[]) => void;
};

const SplitTransactionForm = ({
  isOpen,
  tagListId,
  state,
  handleEssentialInputChange,
  handleTransactionTypeChange,
  handleAmountChange,
  handleDescriptionChange,
  handleAccountFromChange,
  handleAccountToChange,
  handleCategoryChange,
  handleEntityChange,
  handleTagsChange,
}: SplitTransactionFormProps) => {
  const { t } = useTranslation();
  const [isEssentialVisible, setEssentialVisible] = useState(true);
  const [isAccountFromRequired, setAccountFromRequired] = useState(true);
  const [isAccountToRequired, setAccountToRequired] = useState(false);

  const splitTags = state?.tags ?? [];
  const splitTagOptions = state?.tagOptions ?? [];

  useEffect(() => {
    if (!state?.type) return;
    const shouldAccountFromBeEnabled = state.type !== TransactionType.Income;
    const shouldAccountToBeEnabled = state.type !== TransactionType.Expense;

    setAccountFromRequired(shouldAccountFromBeEnabled);
    setAccountToRequired(shouldAccountToBeEnabled);

    if (state.type !== TransactionType.Expense) {
      setEssentialVisible(false);
    } else {
      setEssentialVisible(true);
    }
  }, [state?.type]);

  const onSplitTypeSelected = (newType: string) => {
    if (
      Object.values(TransactionType).includes(newType as TransactionType)
    ) {
      handleTransactionTypeChange(newType as TransactionType);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative flex items-center gap-4 py-2">
        <Separator className="flex-1" />
        <Badge variant="secondary" className="shrink-0 font-normal">
          {t('transactions.splitTransaction')}
        </Badge>
        <Separator className="flex-1" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {isEssentialVisible && (
          <div className="flex items-center gap-2 md:col-span-4">
            <Checkbox
              id="split_essential"
              checked={state?.isEssential == true}
              onCheckedChange={(c) => handleEssentialInputChange(c === true)}
            />
            <Label
              htmlFor="split_essential"
              className="flex cursor-pointer items-center gap-1"
            >
              <Star className="size-4 text-amber-500" />
              {t('transactions.essential')}
            </Label>
          </div>
        )}

        <div className="flex flex-col items-stretch gap-2 md:col-span-8 md:items-end">
          <ToggleGroup
            type="single"
            value={state?.type ?? TransactionType.Expense}
            onValueChange={(v) => v && onSplitTypeSelected(v)}
            className="flex flex-wrap justify-start md:justify-end"
            aria-label={t('transactions.typeOfTrx')}
          >
            <ToggleGroupItem
              value={TransactionType.Expense}
              aria-label={t('transactions.expense')}
            >
              {t('transactions.expense')}
            </ToggleGroupItem>
            <ToggleGroupItem
              value={TransactionType.Transfer}
              aria-label={t('transactions.transfer')}
            >
              {t('transactions.transfer')}
            </ToggleGroupItem>
            <ToggleGroupItem
              value={TransactionType.Income}
              aria-label={t('transactions.income')}
            >
              {t('transactions.income')}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex flex-col gap-2 md:col-span-3">
          <Label htmlFor="split_amount">{t('common.value')}</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <CurrencyIcon />
            </span>
            <NumericFormat
              autoFocus
              required={isOpen}
              id="split_amount"
              name="split_amount"
              value={state?.amount || ''}
              onValueChange={(values) => {
                const { floatValue } = values;
                handleAmountChange(floatValue || 0);
              }}
              customInput={Input}
              className="pl-10"
              decimalScale={2}
              fixedDecimalScale
              thousandSeparator
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 md:col-span-9">
          <Label htmlFor="split_description">{t('common.description')}</Label>
          <div className="relative">
            <FileText className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              required={isOpen}
              id="split_description"
              name="split_description"
              value={state?.description ?? ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 md:col-span-6">
          <Label htmlFor="split_account_from">
            {t('transactions.originAccount')}
          </Label>
          <Select
            disabled={!isAccountFromRequired}
            value={
              isAccountFromRequired && state?.accountFrom != null
                ? String(state.accountFrom.id)
                : undefined
            }
            onValueChange={(v) => {
              const opt = (state?.accountOptions ?? []).find(
                (o) => String(o.id) === v,
              );
              handleAccountFromChange(opt);
            }}
            required={isOpen && isAccountFromRequired}
          >
            <SelectTrigger
              id="split_account_from"
              className="relative w-full pl-10"
            >
              <UserCircle className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <SelectValue placeholder={t('transactions.originAccount')} />
            </SelectTrigger>
            <SelectContent>
              {(state?.accountOptions ?? []).map((o) => (
                <SelectItem key={String(o.id)} value={String(o.id)}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 md:col-span-6">
          <Label htmlFor="split_account_to">
            {t('transactions.destinationAccount')}
          </Label>
          <Select
            disabled={!isAccountToRequired}
            value={
              isAccountToRequired && state?.accountTo != null
                ? String(state.accountTo.id)
                : undefined
            }
            onValueChange={(v) => {
              const opt = (state?.accountOptions ?? []).find(
                (o) => String(o.id) === v,
              );
              handleAccountToChange(opt);
            }}
            required={isOpen && isAccountToRequired}
          >
            <SelectTrigger
              id="split_account_to"
              className="relative w-full pl-10"
            >
              <UserCircle className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <SelectValue
                placeholder={t('transactions.destinationAccount')}
              />
            </SelectTrigger>
            <SelectContent>
              {(state?.accountOptions ?? []).map((o) => (
                <SelectItem key={String(o.id)} value={String(o.id)}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 md:col-span-6">
          <Label htmlFor="split_category">{t('transactions.category')}</Label>
          <Select
            value={
              state?.category != null ? String(state.category.id) : undefined
            }
            onValueChange={(v) => {
              const opt = (state?.categoryOptions ?? []).find(
                (o) => String(o.id) === v,
              );
              handleCategoryChange(opt);
            }}
          >
            <SelectTrigger id="split_category" className="relative w-full pl-10">
              <FolderOpen className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <SelectValue placeholder={t('transactions.category')} />
            </SelectTrigger>
            <SelectContent>
              {(state?.categoryOptions ?? []).map((o) => (
                <SelectItem key={String(o.id)} value={String(o.id)}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 md:col-span-6">
          <Label htmlFor="split_entity">{t('transactions.entity')}</Label>
          <Select
            value={state?.entity != null ? String(state.entity.id) : undefined}
            onValueChange={(v) => {
              const opt = (state?.entityOptions ?? []).find(
                (o) => String(o.id) === v,
              );
              handleEntityChange(opt);
            }}
          >
            <SelectTrigger id="split_entity" className="relative w-full pl-10">
              <Building2 className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <SelectValue placeholder={t('transactions.entity')} />
            </SelectTrigger>
            <SelectContent>
              {(state?.entityOptions ?? []).map((o) => (
                <SelectItem key={String(o.id)} value={String(o.id)}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 md:col-span-12">
          <Label htmlFor={`split-tags-${tagListId}`}>{t('tags.tags')}</Label>
          <div className="flex flex-wrap gap-1">
            {splitTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="gap-1 pr-0.5 font-normal"
              >
                {tag}
                <button
                  type="button"
                  className="hover:bg-muted rounded px-1.5 py-0.5 text-sm leading-none"
                  aria-label={`Remove ${tag}`}
                  onClick={() =>
                    handleTagsChange(splitTags.filter((x) => x !== tag))
                  }
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <Input
            id={`split-tags-${tagListId}`}
            list={tagListId}
            placeholder={t('transactions.addAnotherTagPlaceholder')}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              const v = e.currentTarget.value.trim();
              if (v && !splitTags.includes(v)) {
                handleTagsChange([...splitTags, v]);
              }
              e.currentTarget.value = '';
            }}
          />
          <datalist id={tagListId}>
            {splitTagOptions
              .filter((x) => !splitTags.includes(x))
              .map((opt) => (
                <option key={opt} value={opt} />
              ))}
          </datalist>
        </div>
      </div>
    </div>
  );
};

export default AddEditTransactionDialog;
