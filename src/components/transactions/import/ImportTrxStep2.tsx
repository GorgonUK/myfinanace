import { ChevronsRight } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { memo, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useLoading } from '../../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../../providers/SnackbarProvider.tsx';
import type { MyFinColumnDef } from '@/components/dashboard/Table/Types';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
import { Checkbox } from '@/common/shadcn/ui/checkbox.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/common/shadcn/ui/select.tsx';
import { IdLabelPair } from '../AddEditTransactionDialog.tsx';
import MyFinStaticTable from '@/components/MyFinStaticTable.tsx';
import { DatePickerField } from '@/common/shadcn/DatePickerField.tsx';
import {
  convertDayJsToUnixTimestamp,
  convertUnixTimestampToDayJs,
} from '../../../utils/dateUtils';
import dayjs from 'dayjs';
import { ImportTrxStep1Result } from './ImportTrxStep1.tsx';
import GenericConfirmationDialog from '@/components/GenericConfirmationDialog.tsx';
import { useImportTransactionsStep2 } from '@/hooks/trx';
import { inferTrxTypeByAttributes } from '../../../utils/transactionUtils.ts';
import { TransactionType } from '@/common/api/trx';
import ImportTrxStep2AccountsCell from './ImportTrxStep2AccountsCell.tsx';
import { useFormatNumberAsCurrency } from '../../../utils/textHooks.ts';

export type Props = {
  data: ImportTrxStep1Result;
  onNext: (result: ImportTrxStep2Result) => void;
};

type ImportedTrx = {
  tempId: number;
  selected: boolean;
  date: number;
  description: string;
  value: number;
  entity?: IdLabelPair;
  category?: IdLabelPair;
  accountFrom?: IdLabelPair;
  accountTo?: IdLabelPair;
  essential: boolean;
};

export type ImportTrxStep2Result = {
  nrOfTrxImported: number;
  accountName: string;
};

const DescriptionCell = memo(
  ({
     id,
    description,
    onInputChange,
    onBlur,
  }: {
    id: number;
    description: string;
    onInputChange: (id: number, input: string) => void;
    onBlur: (id: number, value: string) => void;
  }) => {
    const [localValue, setLocalValue] = useState(description);

    useEffect(() => {
      setLocalValue(description);
    }, [description]);

    return (
      <Input
        id="description"
        name="description"
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value);
          onInputChange(id, e.target.value);
        }}
        onBlur={() => {
          onBlur(id, localValue);
        }}
        onKeyUp={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        type="text"
        className="w-full"
      />
    );
  },
);

DescriptionCell.displayName = 'DescriptionCell';

const DateCell = memo(
  ({
     id,
     value,
     onChange,
   }: {
    id: number;
    value: number;
    onChange: (id: number, timestamp: number) => void;
  }) => (
    <DatePickerField
      name="date"
      value={convertUnixTimestampToDayJs(value)}
      onChange={(newValue) => {
        const timestamp = convertDayJsToUnixTimestamp(newValue ?? dayjs());
        onChange(id, timestamp);
      }}
      format="DD/MM/YYYY"
      required
    />
  ),
);
DateCell.displayName = 'DateCell';

const ValueCell = memo(
  ({
     id,
     value,
     onDebouncedChange,
   }: {
    id: number;
    value: number;
    onDebouncedChange: (id: number, value: number) => void;
  }) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    return (
      <Input
        id="amount"
        name="amount"
        value={localValue}
        onChange={(e) => {
          const newValue = Number(e.target.value);
          setLocalValue(newValue);
          onDebouncedChange(id, newValue);
        }}
        type="number"
        step="any"
        className="w-full"
      />
    );
  },
);
ValueCell.displayName = 'ValueCell';

const CategoryCell = memo(
  ({
     id,
     category,
     entity,
     categories,
     entities,
     onCategoryChange,
     onEntityChange,
   }: {
    id: number;
    category: IdLabelPair | undefined;
    entity: IdLabelPair | undefined;
    categories: IdLabelPair[];
    entities: IdLabelPair[];
    onCategoryChange: (id: number, value: IdLabelPair | null) => void;
    onEntityChange: (id: number, value: IdLabelPair | null) => void;
  }) => {
    const { t } = useTranslation();
    return (
      <div className="mt-2 mb-2 flex w-full flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label>{t('transactions.category')}</Label>
          <Select
            value={category != null ? String(category.id) : undefined}
            onValueChange={(v) => {
              const opt = categories.find((c) => String(c.id) === v);
              onCategoryChange(id, opt ?? null);
            }}
          >
            <SelectTrigger
              className="w-full"
              onKeyDown={(e) => e.stopPropagation()}
            >
              <SelectValue placeholder={t('transactions.category')} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={String(c.id)} value={String(c.id)}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t('transactions.entity')}</Label>
          <Select
            value={entity != null ? String(entity.id) : undefined}
            onValueChange={(v) => {
              const opt = entities.find((e) => String(e.id) === v);
              onEntityChange(id, opt ?? null);
            }}
          >
            <SelectTrigger
              className="w-full"
              onKeyDown={(e) => e.stopPropagation()}
            >
              <SelectValue placeholder={t('transactions.entity')} />
            </SelectTrigger>
            <SelectContent>
              {entities.map((e) => (
                <SelectItem key={String(e.id)} value={String(e.id)}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  },
);
CategoryCell.displayName = 'CategoryCell';

const CheckboxCell = memo(
  ({
     id,
     checked,
     onChange,
   }: {
    id: number;
    checked: boolean;
    onChange: (id: number, checked: boolean) => void;
  }) => (
    <Checkbox
      checked={checked}
      onCheckedChange={(c) => onChange(id, c === true)}
      aria-label="controlled"
    />
  ),
);
CheckboxCell.displayName = 'CheckboxCell';

const ImportTrxStep2 = (props: Props) => {
  const { t } = useTranslation();
  const loader = useLoading();
  const snackbar = useSnackbar();

  const importTrxStep2Request = useImportTransactionsStep2();
  const formatNumberAsCurrency = useFormatNumberAsCurrency();
  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [transactions, setTransactions] = useState<ImportedTrx[]>([]);

  const filteredTransactions = useMemo(
    () => transactions.filter((trx) => trx.selected),
    [transactions],
  );

  const entities: IdLabelPair[] | undefined = useMemo(
    () =>
      props.data.entities.map((entity) => ({
        id: entity.entity_id,
        label: entity.name,
      })),
    [props.data.entities],
  );
  const categories: IdLabelPair[] | undefined = useMemo(
    () =>
      props.data.categories.map((category) => ({
        id: category.category_id,
        label: category.name,
      })),
    [props.data.categories],
  );
  const accounts: IdLabelPair[] | undefined = useMemo(
    () =>
      props.data.accounts.map((account) => ({
        id: account.account_id,
        label: account.name,
      })),
    [props.data.categories],
  );

  const newAccountBalance: number = useMemo(() => {
    const initialBalance =
      props.data.accounts.find(
        (acc) => acc.account_id == props.data.selectedAccountId,
      )?.balance || 0;
    return filteredTransactions.reduce((acc, row) => {
      let amount = row.value;
      if (row.accountFrom?.id == props.data.selectedAccountId) {
        amount *= -1;
      }
      return acc + amount;
    }, initialBalance);
  }, [props.data.selectedAccountId, props.data.accounts, filteredTransactions]);

  useEffect(() => {
    if (importTrxStep2Request.isPending) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [importTrxStep2Request.isPending]);

  useEffect(() => {
    if (importTrxStep2Request.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [importTrxStep2Request.isError]);

  useEffect(() => {
    if (importTrxStep2Request.data) {
      props.onNext({
        nrOfTrxImported: filteredTransactions.length,
        accountName:
          accounts.find((acc) => acc.id == props.data.selectedAccountId)
            ?.label || '',
      });
    }
  }, [importTrxStep2Request.data]);

  useEffect(() => {
    if (!props.data.fillData) return;
    const trx = props.data.fillData.map((item, index) => ({
      tempId: index,
      selected: true,
      date: item.date || 0,
      description: item.description || '',
      value: item.amount || 0,
      entity: entities.find((entity) => entity.id == item.selectedEntityID),
      category: categories.find(
        (category) => category.id == item.selectedCategoryID,
      ),
      accountFrom: accounts.find(
        (account) => account.id == item.selectedAccountFromID,
      ),
      accountTo: accounts.find(
        (account) => account.id == item.selectedAccountToID,
      ),
      essential: item.isEssential == true,
    }));

    setTransactions(trx);
  }, [props.data.fillData]);

  type UpdateTransactionRef = {
    (id: number, updates: Partial<ImportedTrx>): void;
    timeout?: number;
  };

  const updateTransactionRef = useRef<UpdateTransactionRef>(
    (id: number, updates: Partial<ImportedTrx>) => {
      setTransactions((prevTransactions) =>
        prevTransactions.map((trx) =>
          trx.tempId === id ? { ...trx, ...updates } : trx,
        ),
      );
    },
  );

  const debouncedUpdateTransaction = useCallback(
    (id: number, updates: Partial<ImportedTrx>) => {
      if (updateTransactionRef.current.timeout) {
        clearTimeout(updateTransactionRef.current.timeout);
      }
      updateTransactionRef.current.timeout = window.setTimeout(() => {
        updateTransactionRef.current(id, updates);
      }, 700) as unknown as number;
    },
    [],
  );

  // Stable callbacks for memoized cell components
  const handleSelectedChange = useCallback((id: number, checked: boolean) => {
    updateTransactionRef.current(id, { selected: checked });
  }, []);

  const handleDateChange = useCallback((id: number, timestamp: number) => {
    updateTransactionRef.current(id, { date: timestamp });
  }, []);

  const handleValueChange = useCallback((id: number, value: number) => {
    debouncedUpdateTransaction(id, { value });
  }, [debouncedUpdateTransaction]);

  const handleDescriptionChange = useCallback((id: number, description: string) => {
    debouncedUpdateTransaction(id, { description });
  }, [debouncedUpdateTransaction]);

  const handleDescriptionBlur = useCallback((id: number, description: string) => {
    updateTransactionRef.current(id, { description });
  }, []);

  const handleCategoryChange = useCallback((id: number, category: IdLabelPair | null) => {
    updateTransactionRef.current(id, { category: category ?? undefined });
  }, []);

  const handleEntityChange = useCallback((id: number, entity: IdLabelPair | null) => {
    updateTransactionRef.current(id, { entity: entity ?? undefined });
  }, []);

  const handleAccountFromChange = useCallback((id: number, accountFrom: IdLabelPair | null) => {
    updateTransactionRef.current(id, { accountFrom: accountFrom ?? undefined });
  }, []);

  const handleAccountToChange = useCallback((id: number, accountTo: IdLabelPair | null) => {
    updateTransactionRef.current(id, { accountTo: accountTo ?? undefined });
  }, []);

  const handleEssentialChange = useCallback((id: number, essential: boolean) => {
    updateTransactionRef.current(id, { essential });
  }, []);

  const rows = useMemo(
    () =>
      transactions.map((item) => ({
        id: item.tempId,
        include: item.selected,
        date: item.date,
        value: item.value,
        description: item.description,
        category: {
          category: item.category,
          entity: item.entity,
        },
        accountFrom: item.accountFrom,
        flow: {
          from: item.accountFrom,
          to: item.accountTo,
        },
        essential: item.essential,
      })),
    [transactions],
  );

  const columns: MyFinColumnDef[] = useMemo(
    () => [
      {
        field: 'include',
        width: 100,
        headerName: t('transactions.import'),
        editable: false,
        sortable: false,
        renderCell: (params) => (
          <CheckboxCell
            id={params.id as number}
            checked={params.value}
            onChange={handleSelectedChange}
          />
        ),
      },
      {
        field: 'date',
        headerName: t('common.date'),
        width: 170,
        editable: false,
        sortable: false,
        renderCell: (params) => (
          <DateCell
            id={params.id as number}
            value={params.value}
            onChange={handleDateChange}
          />
        ),
      },
      {
        field: 'value',
        headerName: t('common.value'),
        width: 120,
        editable: false,
        sortable: false,
        renderCell: (params) => (
          <ValueCell
            id={params.id as number}
            value={params.value}
            onDebouncedChange={handleValueChange}
          />
        ),
      },
      {
        field: 'description',
        headerName: t('common.description'),
        editable: false,
        sortable: false,
        flex: 1,
        minWidth: 100,
        renderCell: (params) => (
          <DescriptionCell
            id={params.id as number}
            description={params.value}
            onInputChange={handleDescriptionChange}
            onBlur={handleDescriptionBlur}
          />
        ),
      },
      {
        field: 'category',
        headerName: t('transactions.category'),
        editable: false,
        sortable: false,
        width: 180,
        renderCell: (params) => (
          <CategoryCell
            id={params.id as number}
            category={params.value.category}
            entity={params.value.entity}
            categories={categories}
            entities={entities}
            onCategoryChange={handleCategoryChange}
            onEntityChange={handleEntityChange}
          />
        ),
      },
      {
        field: 'flow',
        headerName: t('transactions.flow'),
        editable: false,
        sortable: false,
        width: 180,
        renderCell: (params) => (
          <ImportTrxStep2AccountsCell
            id={params.id as number}
            accounts={accounts}
            selectedAccountFrom={params.value.from}
            selectedAccountTo={params.value.to}
            onAccountFromChange={handleAccountFromChange}
            onAccountToChange={handleAccountToChange}
          />
        ),
      },
      {
        field: 'essential',
        headerName: t('transactions.essential'),
        editable: false,
        sortable: false,
        width: 100,
        renderCell: (params) => (
          <CheckboxCell
            id={params.id as number}
            checked={params.value}
            onChange={handleEssentialChange}
          />
        ),
      },
    ],
    [t, categories, entities, accounts, handleSelectedChange, handleDateChange, handleValueChange, handleDescriptionChange, handleDescriptionBlur, handleCategoryChange, handleEntityChange, handleAccountFromChange, handleAccountToChange, handleEssentialChange],
  );

  const handleContinueButtonClick = () => {
    setConfirmationDialogOpen(true);
  };

  const importTransactions = () => {
    setConfirmationDialogOpen(false);
    importTrxStep2Request.mutate(
      filteredTransactions.map((trx) => ({
        category_id: trx.category?.id,
        entity_id: trx.entity?.id,
        amount: trx.value,
        date_timestamp: trx.date,
        description: trx.description,
        is_essential: trx.essential,
        type:
          inferTrxTypeByAttributes(trx.accountFrom?.id, trx.accountTo?.id) ||
          TransactionType.Transfer,
        account_from_id: trx.accountFrom?.id,
        account_to_id: trx.accountTo?.id,
      })),
    );
  };

  return (
    <>
      {isConfirmationDialogOpen && (
        <GenericConfirmationDialog
          isOpen={isConfirmationDialogOpen}
          onClose={() => setConfirmationDialogOpen(false)}
          onPositiveClick={() => importTransactions()}
          onNegativeClick={() => setConfirmationDialogOpen(false)}
          titleText={t('transactions.completeImportQuestion')}
          descriptionText={t('transactions.importedTransactionsCnt', {
            count: filteredTransactions.length,
          })}
          alert={t('transactions.newBalanceForAccountValue', {
            account: accounts.find(
              (acc) => props.data.selectedAccountId == acc.id,
            )?.label,
            value: formatNumberAsCurrency.invoke(newAccountBalance),
          })}
          positiveText={t('transactions.import')}
        />
      )}
      <div className="flex flex-col gap-4">
        <div className="mt-2 mb-2 text-base">
          <Trans i18nKey="importTransactions.step2Text" />
        </div>
        <MyFinStaticTable
          isRefetching={false}
          rows={rows}
          columns={columns}
          paginationModel={{
            pageSize: 50,
          }}
        />
        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            className="w-fit"
            onClick={() => handleContinueButtonClick()}
          >
            {t('transactions.continueImport')}
            <ChevronsRight className="ml-2 size-5" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default memo(ImportTrxStep2);
