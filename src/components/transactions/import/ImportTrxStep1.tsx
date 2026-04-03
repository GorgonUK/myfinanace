import { ChevronsRight, CircleUser } from 'lucide-react';
import { Button } from '@/common/shadcn/ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/common/shadcn/ui/dialog.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
import { RadioGroup, RadioGroupItem } from '@/common/shadcn/ui/radio-group.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/common/shadcn/ui/select.tsx';
import { Alert, AlertDescription } from '@/common/shadcn/ui/alert.tsx';
import type { MyFinColumnDef } from '@/components/dashboard/Table/Types';
import dayjs from 'dayjs';
import * as fuzzball from 'fuzzball';
import { countBy } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import MyFinStaticTable from '@/components/MyFinStaticTable.tsx';
import { useLoading } from '../../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../../providers/SnackbarProvider.tsx';
import { Account } from '@/common/api/auth';
import {
  useImportTransactionsStep0,
  useImportTransactionsStep1,
} from '@/hooks/trx';
import {
  ExportedTransactionItem,
  ImportTransactionsStep1Response,
  TransactionType,
} from '@/common/api/trx';
import {
  convertDateStringToUnixTimestamp,
  detectDateFormatFromList,
  getMonthsFullName,
  padDateComponents,
} from '../../../utils/dateUtils.ts';
import {
  checkIfFieldsAreFilled,
  convertStringToFloat,
} from '../../../utils/textUtils.ts';
import { IdLabelPair } from '../AddEditTransactionDialog.tsx';

const IMPORT_TRX_FIELD_HEADER_VARIATIONS = {
  DATE: [
    'date',
    'data',
    'data da operação',
    'data de operação',
    'data do movimento',
    'data de movimento',
    'data valor',
    'data operação',
  ],
  DESCRIPTION: [
    'description',
    'descrição',
    'descrição da operação',
    'descrição de operação',
    'descrição do movimento',
    'descrição de movimento',
    'movimento',
  ],
  AMOUNT: [
    'amount',
    'montante',
    'montante',
    'valor',
    'montante (eur)',
    'montante(eur)',
    'montante(€)',
    'montante (€)',
    'montante( eur )',
  ],
  CREDIT: ['credit', 'crédito', 'receita'],
  DEBIT: ['debit', 'débito', 'despesa'],
  TYPE: [
    'type',
    'tipo',
    'tipo de operação',
    'tipo de movimento',
    'tipo de transação',
  ],
};

enum FIELD_MAPPING {
  IGNORE = 'ignore',
  DATE = 'date',
  DESCRIPTION = 'description',
  AMOUNT = 'amount',
  CREDIT = 'credit',
  DEBIT = 'debit',
  TYPE = 'type',
}

// Track the fields that have been already matched
const usedFields = new Set<FIELD_MAPPING>();

const guessColumnMapping = (row: string): FIELD_MAPPING => {
  const normalizedRow = row.toLowerCase().trim();

  const fieldMappings: {
    [key in keyof typeof IMPORT_TRX_FIELD_HEADER_VARIATIONS]: FIELD_MAPPING;
  } = {
    DATE: FIELD_MAPPING.DATE,
    CREDIT: FIELD_MAPPING.CREDIT,
    DEBIT: FIELD_MAPPING.DEBIT,
    TYPE: FIELD_MAPPING.TYPE,
    AMOUNT: FIELD_MAPPING.AMOUNT,
    DESCRIPTION: FIELD_MAPPING.DESCRIPTION,
  };

  let bestMatch: { field?: FIELD_MAPPING; score: number } = {
    field: undefined,
    score: 0,
  };

  // Iterate through all field headers
  Object.entries(IMPORT_TRX_FIELD_HEADER_VARIATIONS).forEach(
    ([key, variations]) => {
      const matches = fuzzball.extract(
        normalizedRow,
        variations.map((v) => v.toLowerCase()),
        { scorer: fuzzball.ratio },
      );

      if (matches.length > 0) {
        const [, score] = matches[0]; // Best match is the first one

        // Get the corresponding field mapping for the current key
        const currentField = fieldMappings[key as keyof typeof fieldMappings];

        // Ensure we don't choose the same field more than once
        if (
          score > bestMatch.score &&
          score >= 75 &&
          !usedFields.has(currentField)
        ) {
          bestMatch = { field: currentField, score };
        }
      }
    },
  );

  // If we have found a valid match, mark it as used and return the result
  if (bestMatch.field) {
    usedFields.add(bestMatch.field);
    return bestMatch.field;
  }

  // If no valid match is found or the score is below threshold, return the ignore field
  return FIELD_MAPPING.IGNORE;
};

export type Props = {
  clipboardText: string;
  onNext: (result: ImportTrxStep1Result) => void;
};

export type ImportTrxStep1Result = ImportTransactionsStep1Response & {
  selectedAccountId: bigint;
};

const ImportTrxStep1 = (props: Props) => {
  const { t } = useTranslation();
  const loader = useLoading();
  const snackbar = useSnackbar();
  const importTrxStep0Request = useImportTransactionsStep0();
  const importTrxStep1Request = useImportTransactionsStep1();
  const [accounts, setUserAccounts] = useState<Account[]>([]);
  const [accountOptionsValue, setAccountOptionsValue] = useState<IdLabelPair[]>(
    [],
  );
  const [selectedAccount, setSelectedAccount] = useState<IdLabelPair | null>(
    null,
  );
  const [rows, setRows] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<
    Record<string, FIELD_MAPPING>
  >({});
  const [detectedDateFormat, setDetectedDateFormat] = useState<string | null>(
    null,
  );
  const [viableFormats, setViableFormats] = useState<string[]>([]);
  const [isDateFormatDialogOpen, setIsDateFormatDialogOpen] = useState(false);
  const [selectedFormatInDialog, setSelectedFormatInDialog] = useState<
    string | null
  >(null);
  const [pendingContinue, setPendingContinue] = useState(false);

  const handleMappingChange = (columnIndex: number, value: FIELD_MAPPING) => {
    setColumnMappings((prev) => ({
      ...prev,
      [`column-${columnIndex}`]: value,
    }));
  };

  // Loading
  useEffect(() => {
    if (importTrxStep0Request.isPending || importTrxStep1Request.isPending) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [importTrxStep0Request.isPending, importTrxStep1Request.isPending]);

  // Error
  useEffect(() => {
    if (importTrxStep0Request.isError || importTrxStep1Request.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [importTrxStep0Request.isError, importTrxStep1Request.isError]);

  // Success
  useEffect(() => {
    if (importTrxStep0Request.data) {
      //(importTrxStep0Request.data.accounts);
      setUserAccounts(importTrxStep0Request.data || []);
      parseClipboardData(props.clipboardText);
    }
  }, [importTrxStep0Request.data]);

  useEffect(() => {
    if (importTrxStep1Request.isSuccess && importTrxStep1Request.data) {
      props.onNext({
        ...importTrxStep1Request.data,
        selectedAccountId: selectedAccount?.id || -1n,
      });
    }
  }, [importTrxStep1Request.data]);

  useEffect(() => {
    if (accounts) {
      const userAccounts = transformUserAccountsIntoIdLabelPair(accounts);
      setAccountOptionsValue(userAccounts);
    }
  }, [accounts]);

  // Detect date format whenever column mappings or rows change
  useEffect(() => {
    const dateColumnKey = Object.entries(columnMappings).find(
      ([_, value]) => value === FIELD_MAPPING.DATE,
    )?.[0];

    if (!dateColumnKey || rows.length === 0) {
      setDetectedDateFormat(null);
      setViableFormats([]);
      return;
    }

    const colIndex = parseInt(dateColumnKey.split('-')[1]);
    const dateStrings = rows
      .map((row) => row.split('\t')[colIndex]?.trim())
      .filter((s): s is string => !!s && s.length > 0);

    if (dateStrings.length === 0) {
      setDetectedDateFormat(null);
      setViableFormats([]);
      return;
    }

    const result = detectDateFormatFromList(dateStrings);
    setDetectedDateFormat(result.detectedFormat);
    setViableFormats(result.viableFormats);

    // Reset dialog selection when detection changes
    if (result.detectedFormat) {
      setSelectedFormatInDialog(null);
    }
  }, [columnMappings, rows]);

  // Get a sample date string from the data to show preview in dialog
  const sampleDateString = useMemo(() => {
    const dateColumnKey = Object.entries(columnMappings).find(
      ([_, value]) => value === FIELD_MAPPING.DATE,
    )?.[0];
    if (!dateColumnKey || rows.length === 0) return null;
    const colIndex = parseInt(dateColumnKey.split('-')[1]);
    return (
      rows
        .map((row) => row.split('\t')[colIndex]?.trim())
        .find((s) => !!s && s.length > 0) || null
    );
  }, [columnMappings, rows]);

  const handleDateFormatDialogConfirm = useCallback(() => {
    if (selectedFormatInDialog) {
      setDetectedDateFormat(selectedFormatInDialog);
      setIsDateFormatDialogOpen(false);
      // pendingContinue remains true so the useEffect below will proceed
    }
  }, [selectedFormatInDialog]);

  // When detectedDateFormat is set after user picks from dialog, and
  // pendingContinue is true, trigger the actual import
  const pendingContinueRef = useRef(false);
  pendingContinueRef.current = pendingContinue;

  useEffect(() => {
    if (!pendingContinueRef.current || !detectedDateFormat) return;
    setPendingContinue(false);

    // Inline the import logic here since proceedWithImport is defined after early return
    const getCol = (field: FIELD_MAPPING): number | null => {
      const column = Object.entries(columnMappings)
        .find(([_, value]) => value === field)?.[0]
        ?.split('-')[1];
      if (column) return parseInt(column);
      return null;
    };

    const trxs: ExportedTransactionItem[] = [];
    rows.forEach((row) => {
      const columns = row.split('\t');
      const date = columns[getCol(FIELD_MAPPING.DATE) ?? -1];
      const description = columns[getCol(FIELD_MAPPING.DESCRIPTION) ?? -1];

      // Infer amount/type
      const amountColumn = getCol(FIELD_MAPPING.AMOUNT);
      const creditColumn = getCol(FIELD_MAPPING.CREDIT);
      const debitColumn = getCol(FIELD_MAPPING.DEBIT);
      const typeColumn = getCol(FIELD_MAPPING.TYPE);
      let amount: number | undefined;
      let type: TransactionType | undefined;
      if (amountColumn && columns[amountColumn] && !typeColumn) {
        amount = convertStringToFloat(columns[amountColumn].replace(/ /g, ''));
        type = amount > 0 ? TransactionType.Income : TransactionType.Expense;
      } else if (creditColumn && !typeColumn) {
        amount = convertStringToFloat(columns[creditColumn] ?? '');
        type = amount > 0 ? TransactionType.Income : TransactionType.Expense;
      }
      if (!amount && debitColumn && !typeColumn) {
        amount = convertStringToFloat(columns[debitColumn] ?? '');
        type = amount > 0 ? TransactionType.Expense : TransactionType.Income;
      } else if (!amount && amountColumn && typeColumn) {
        amount = convertStringToFloat(columns[amountColumn] ?? '');
        switch (columns[typeColumn]) {
          case FIELD_MAPPING.DEBIT:
            type =
              amount > 0 ? TransactionType.Expense : TransactionType.Income;
            break;
          case FIELD_MAPPING.CREDIT:
            type =
              amount > 0 ? TransactionType.Income : TransactionType.Expense;
            break;
        }
      }

      const finalAmount = Math.abs(amount || 0);
      const finalType = type || TransactionType.Expense;

      if (
        checkIfFieldsAreFilled([date, description, finalAmount + '', finalType])
      ) {
        try {
          const unixDate = convertDateStringToUnixTimestamp(
            date,
            detectedDateFormat,
          );
          trxs.push({
            date: unixDate,
            description,
            amount: finalAmount,
            type: finalType,
          });
        } catch (_error) {
          console.log(_error);
        }
      }
    });

    importTrxStep1Request.mutate({
      account_id: selectedAccount?.id || -1n,
      trx_list: trxs,
    });
  }, [detectedDateFormat, pendingContinue]);

  const transformUserAccountsIntoIdLabelPair = (userAccounts: Account[]) => {
    return userAccounts.map((acc) => ({
      id: acc.account_id,
      label: acc.name,
    }));
  };

  if (importTrxStep0Request.isPending || !importTrxStep0Request.data) {
    return null;
  }

  const tryToPrefillHeaders = (firstRow: string[]): boolean => {
    const initialMappings: Record<string, FIELD_MAPPING> = {};
    usedFields.clear();
    firstRow.map((row, index) => {
      initialMappings[`column-${index}`] = guessColumnMapping(row);
    });
    setColumnMappings(initialMappings);

    // Return true if at least 2 columns were matched (i.e. first row is likely a header)
    const matchedCount = Object.values(initialMappings).filter(
      (mapping) => mapping !== FIELD_MAPPING.IGNORE,
    ).length;
    return matchedCount >= 2;
  };

  const parseClipboardData = (data: string) => {
    const allRows = data.split('\n');

    // Filter out empty/blank rows
    const nonEmptyRows = allRows.filter((row) => row.trim().length > 0);

    if (nonEmptyRows.length === 0) {
      setRows([]);
      return;
    }

    // Try to detect headers from first row
    const firstRowIsHeader = tryToPrefillHeaders(nonEmptyRows[0].split('\t'));

    // If first row matched as headers, exclude it from data rows
    const dataRows = firstRowIsHeader ? nonEmptyRows.slice(1) : nonEmptyRows;

    setRows(dataRows);
  };

  interface GridValidRowModel {
    id: string;
    [key: string]: string; // This allows for additional string properties
  }

  const buildRowsForTable = (rows: string[]): GridValidRowModel[] => {
    return rows.map(
      (row, j) =>
        row.split('\t').reduce((acc: GridValidRowModel, row, i) => {
          acc.id = j + '+' + i;
          acc[`${i}`] = row; // Cast i to string for indexing
          return acc;
        }, {} as GridValidRowModel), // Initialize with empty GridValidRowModel
    );
  };

  const buildColumnsForTable = (rows: string[]): MyFinColumnDef[] => {
    const nColumns = rows[0]?.split('\t').length || 0;
    if (nColumns < 1) return [];
    return rows[0].split('\t').map((_row, i) => ({
      field: `column-${i}`,
      headerName: ` `,
      renderHeader: (_params: unknown) => {
        return (
          <Select
            value={columnMappings[`column-${i}`] || FIELD_MAPPING.IGNORE}
            onValueChange={(v) => handleMappingChange(i, v as FIELD_MAPPING)}
          >
            <SelectTrigger id={`select-${i}`} className="h-9 w-[min(100%,160px)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FIELD_MAPPING.IGNORE}>
                {t('common.ignore')}
              </SelectItem>
              <SelectItem value={FIELD_MAPPING.DATE}>{t('common.date')}</SelectItem>
              <SelectItem value={FIELD_MAPPING.DESCRIPTION}>
                {t('common.description')}
              </SelectItem>
              <SelectItem value={FIELD_MAPPING.AMOUNT}>
                {t('common.amount')}
              </SelectItem>
              <SelectItem value={FIELD_MAPPING.CREDIT}>
                {t('common.credit')}
              </SelectItem>
              <SelectItem value={FIELD_MAPPING.DEBIT}>{t('common.debit')}</SelectItem>
              <SelectItem value={FIELD_MAPPING.TYPE}>{t('common.type')}</SelectItem>
            </SelectContent>
          </Select>
        );
      },
      editable: false,
      sortable: false,
      flex: 1,
      renderCell: (params) => {
        const cell = (params.row as Record<string, unknown>)[String(i)];
        return <p>{String(cell ?? '')}</p>;
      },
    }));
  };

  const getColumnNumberForMapping = (field: FIELD_MAPPING): number | null => {
    const column = Object.entries(columnMappings)
      .find(([_, value]) => value === field)?.[0]
      ?.split('-')[1];
    if (column) return parseInt(column);
    return null;
  };

  const parseTransactions = () => {
    const trxs: ExportedTransactionItem[] = [];
    const dateFormat = detectedDateFormat || undefined;
    rows.forEach((row) => {
      const columns = row.split('\t');
      const amountAndTypeInferred = inferTrxAmountAndType(columns);
      const date = columns[getColumnNumberForMapping(FIELD_MAPPING.DATE) ?? -1];
      const description =
        columns[getColumnNumberForMapping(FIELD_MAPPING.DESCRIPTION) ?? -1];
      const amount = amountAndTypeInferred.amount;
      const type = amountAndTypeInferred.type;
      if (checkIfFieldsAreFilled([date, description, amount + '', type])) {
        try {
          const unixDate = convertDateStringToUnixTimestamp(date, dateFormat);
          trxs.push({
            date: unixDate,
            description,
            amount,
            type,
          });
        } catch (_error) {
          /* no-op */
          console.log(_error);
        }
      }
    });

    return trxs;
  };

  const inferTrxAmountAndType = (
    row: string[],
  ): { amount: number; type: TransactionType } => {
    const amountColumn = getColumnNumberForMapping(FIELD_MAPPING.AMOUNT);
    const creditColumn = getColumnNumberForMapping(FIELD_MAPPING.CREDIT);
    const debitColumn = getColumnNumberForMapping(FIELD_MAPPING.DEBIT);
    const typeColumn = getColumnNumberForMapping(FIELD_MAPPING.TYPE);

    let amount;
    let type;

    if (amountColumn && row[amountColumn] && amountColumn && !typeColumn) {
      amount = convertStringToFloat(row[amountColumn].replace(/ /g, ''));
      type = amount > 0 ? TransactionType.Income : TransactionType.Expense;
    } else if (creditColumn && !typeColumn) {
      amount = convertStringToFloat(row[creditColumn] ?? '');
      type = amount > 0 ? TransactionType.Income : TransactionType.Expense;
    }

    if (!amount && debitColumn && !typeColumn) {
      amount = convertStringToFloat(row[debitColumn] ?? '');
      type = amount > 0 ? TransactionType.Expense : TransactionType.Income;
    } else if (!amount && amountColumn && typeColumn) {
      amount = convertStringToFloat(row[amountColumn] ?? '');
      switch (row[typeColumn]) {
        case FIELD_MAPPING.DEBIT:
          type = amount > 0 ? TransactionType.Expense : TransactionType.Income;
          break;
        case FIELD_MAPPING.CREDIT:
          type = amount > 0 ? TransactionType.Income : TransactionType.Expense;
          break;
      }
    }

    return {
      amount: Math.abs(amount || 0),
      type: type || TransactionType.Expense,
    };
  };

  const proceedWithImport = () => {
    const parsedTrxs = parseTransactions();
    importTrxStep1Request.mutate({
      account_id: selectedAccount?.id || -1n,
      trx_list: parsedTrxs,
    });
  };

  const handleContinueButtonClick = () => {
    switch (validateInput()) {
      case VALIDATE_INPUT_RESULT.VALID:
        {
          // If date format is ambiguous (multiple viable formats, none auto-detected),
          // prompt the user to select
          if (!detectedDateFormat && viableFormats.length > 1) {
            setPendingContinue(true);
            setIsDateFormatDialogOpen(true);
            return;
          }

          // If no viable formats at all, show warning but still proceed
          // (dates will default to today and can be adjusted in the next step)
          if (!detectedDateFormat && viableFormats.length === 0) {
            snackbar.showSnackbar(
              t('importTransactions.dateFormatNoValidFormat'),
              AlertSeverity.WARNING,
            );
          }

          proceedWithImport();
        }
        break;

      case VALIDATE_INPUT_RESULT.ERROR_MISSING_REQUIRED_FIELDS:
        snackbar.showSnackbar(
          t('common.fillAllFieldsTryAgain'),
          AlertSeverity.ERROR,
        );
        break;

      case VALIDATE_INPUT_RESULT.ERROR_DUPLICATED_FIELDS:
        snackbar.showSnackbar(
          t('transactions.pleaseDoNotSelectDuplicatedFields'),
          AlertSeverity.ERROR,
        );
        break;

      case VALIDATE_INPUT_RESULT.ERROR_MISSING_ACCOUNT:
        snackbar.showSnackbar(
          t('transactions.pleaseSelectAnAccountToAssociateWithTrx'),
          AlertSeverity.ERROR,
        );
        break;
    }
  };

  enum VALIDATE_INPUT_RESULT {
    VALID,
    ERROR_DUPLICATED_FIELDS,
    ERROR_MISSING_ACCOUNT,
    ERROR_MISSING_REQUIRED_FIELDS,
  }

  /**
   * There must be ONE column for each of the following
   * fields: DATE, DESCRIPTION & AMOUNT (or CREDIT/DEBIT or TYPE & AMOUNT)
   */
  const validateInput = (): VALIDATE_INPUT_RESULT => {
    if (selectedAccount == null) {
      return VALIDATE_INPUT_RESULT.ERROR_MISSING_ACCOUNT;
    }

    const assignCount = countBy(Object.values(columnMappings));
    assignCount[FIELD_MAPPING.IGNORE] = -1;
    if (Object.values(assignCount).some((elem) => elem > 1)) {
      return VALIDATE_INPUT_RESULT.ERROR_DUPLICATED_FIELDS;
    }

    if (
      !Object.hasOwn(assignCount, FIELD_MAPPING.DATE) ||
      !Object.hasOwn(assignCount, FIELD_MAPPING.DESCRIPTION) ||
      (!Object.hasOwn(assignCount, FIELD_MAPPING.AMOUNT) &&
        !Object.hasOwn(assignCount, FIELD_MAPPING.CREDIT) &&
        !Object.hasOwn(assignCount, FIELD_MAPPING.DEBIT) &&
        !Object.hasOwn(assignCount, FIELD_MAPPING.TYPE)) ||
      (Object.hasOwn(assignCount, FIELD_MAPPING.TYPE) &&
        !Object.hasOwn(assignCount, FIELD_MAPPING.AMOUNT))
    ) {
      return VALIDATE_INPUT_RESULT.ERROR_MISSING_REQUIRED_FIELDS;
    }

    return VALIDATE_INPUT_RESULT.VALID;
  };

  return (
    <>
      {/* Date format selection dialog */}
      <Dialog
        open={isDateFormatDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDateFormatDialogOpen(false);
            setPendingContinue(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('importTransactions.dateFormatAmbiguousTitle')}
            </DialogTitle>
          </DialogHeader>
          <p className="mb-2 text-sm text-muted-foreground">
            {t('importTransactions.dateFormatAmbiguousDescription')}
          </p>
          {sampleDateString ? (
            <Alert className="mb-2 border-blue-600/50">
              <AlertDescription>
                {t('importTransactions.dateFormatSampleDate', {
                  date: sampleDateString,
                })}
              </AlertDescription>
            </Alert>
          ) : null}
          <RadioGroup
            value={selectedFormatInDialog || ''}
            onValueChange={(v) => setSelectedFormatInDialog(v || null)}
            className="gap-3"
          >
            {viableFormats.map((fmt) => (
              <div key={fmt} className="flex items-start gap-2">
                <RadioGroupItem value={fmt} id={`fmt-${fmt}`} />
                <Label htmlFor={`fmt-${fmt}`} className="font-normal">
                  <strong>{fmt}</strong>
                  {sampleDateString ? (
                    <span className="ml-1 text-sm text-muted-foreground">
                      →{' '}
                      {(() => {
                        const parsed = dayjs(
                          padDateComponents(sampleDateString),
                          fmt,
                          true,
                        );
                        if (!parsed.isValid()) return '—';
                        return `${parsed.date()} ${getMonthsFullName(parsed.month() + 1)} ${parsed.year()}`;
                      })()}
                    </span>
                  ) : null}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDateFormatDialogOpen(false);
                setPendingContinue(false);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              disabled={!selectedFormatInDialog}
              onClick={handleDateFormatDialogConfirm}
            >
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-4">
        <div>
          <p className="my-2 text-base">
            <Trans i18nKey="importTransactions.step1Text" />
          </p>
        </div>
        <div className="max-w-md space-y-2">
          <Label htmlFor="import-account">{t('transactions.originAccount')}</Label>
          <div className="relative">
            <CircleUser className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Select
              value={
                selectedAccount ? String(selectedAccount.id) : undefined
              }
              onValueChange={(v) => {
                const acc = accountOptionsValue.find(
                  (a) => String(a.id) === v,
                );
                setSelectedAccount(acc ?? null);
              }}
              required
            >
              <SelectTrigger id="import-account" className="pl-10">
                <SelectValue placeholder={t('transactions.originAccount')} />
              </SelectTrigger>
              <SelectContent>
                {accountOptionsValue.map((opt) => (
                  <SelectItem key={String(opt.id)} value={String(opt.id)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {Object.values(columnMappings).includes(FIELD_MAPPING.DATE) && (
          <div>
            {detectedDateFormat ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="w-full cursor-pointer text-left"
                  onClick={() => setIsDateFormatDialogOpen(true)}
                >
                  <Alert className="border-green-600/50">
                    <AlertDescription>
                      {t('importTransactions.dateFormatDetected', {
                        format: detectedDateFormat,
                      })}
                    </AlertDescription>
                  </Alert>
                </button>
                {viableFormats.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFormatInDialog(detectedDateFormat);
                      setIsDateFormatDialogOpen(true);
                    }}
                  >
                    {t('common.change')}
                  </Button>
                ) : null}
              </div>
            ) : viableFormats.length > 1 ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="flex-1 cursor-pointer text-left"
                  onClick={() => setIsDateFormatDialogOpen(true)}
                >
                  <Alert className="border-amber-600/50">
                    <AlertDescription>
                      {t('importTransactions.dateFormatAmbiguousChip')}
                    </AlertDescription>
                  </Alert>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDateFormatDialogOpen(true)}
                >
                  {t('importTransactions.dateFormatSelectAction')}
                </Button>
              </div>
            ) : viableFormats.length === 0 && rows.length > 0 ? (
              <Alert variant="destructive">
                <AlertDescription>
                  {t('importTransactions.dateFormatNoValidFormat')}
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        )}
        <div className="w-full">
          <MyFinStaticTable
            isRefetching={false}
            rows={buildRowsForTable(rows)}
            columns={buildColumnsForTable(rows)}
            paginationModel={{
              pageSize: 100,
            }}
          />
        </div>
        <div className="flex justify-center">
          <Button
            className="mt-4 w-fit gap-2"
            onClick={() => handleContinueButtonClick()}
          >
            {t('transactions.continueImport')}
            <ChevronsRight className="size-5" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default ImportTrxStep1;
