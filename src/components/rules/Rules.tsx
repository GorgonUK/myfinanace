import { useLoading } from '../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../providers/SnackbarProvider.tsx';
import { useTranslation } from 'react-i18next';
import { useGetRules, useRemoveRule } from '@/hooks/rule';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react';
import {
  Rule,
  RuleMatchingOperatorType,
} from '@/common/api/rule';
import { debounce } from 'lodash';
import { Account } from '@/common/api/auth';
import { Entity, TransactionType } from '@/common/api/trx';
import { Category } from '@/common/api/category';
import { CirclePlus, Pencil, Search, Trash2 } from 'lucide-react';
import type { MyFinColumnDef } from '@/components/dashboard/Table/Types';
import GenericConfirmationDialog from '../../components/GenericConfirmationDialog.tsx';
import PageHeader from '../../components/PageHeader.tsx';
import { Card } from '@/common/shadcn/ui/card.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
import MyFinStaticTable from '../../components/MyFinStaticTable.tsx';
import AddEditRuleDialog from './AddEditRuleDialog.tsx';

const Rules = () => {
  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();

  const getRulesRequest = useGetRules();
  const removeRuleRequest = useRemoveRule();

  const [rules, setRules] = useState<Rule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionableRule, setActionableRule] = useState<Rule | null>(null);
  const [isRemoveDialogOpen, setRemoveDialogOpen] = useState(false);
  const [isAddEditDialogOpen, setAddEditDialogOpen] = useState(false);
  const debouncedSearchQuery = useMemo(() => debounce(setSearchQuery, 300), []);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);

  const getTransactionTypeLocalizedText = (transactionType: string): string => {
    switch (transactionType) {
      case TransactionType.Expense:
        return t('transactions.expense');
      case TransactionType.Income:
        return t('transactions.income');
      default:
        return t('transactions.transfer');
    }
  };

  const filteredRules = useMemo(() => {
    let filteredList = rules;

    if (searchQuery != null) {
      const lowerCaseQuery = searchQuery?.toLowerCase() || '';
      filteredList = rules.filter(
        (rule) =>
          !searchQuery ||
          JSON.stringify(rule).toLowerCase().includes(lowerCaseQuery) ||
          accounts
            .find((acc) => acc.account_id == rule.matcher_account_from_id_value)
            ?.name.toLowerCase()
            .includes(lowerCaseQuery) ||
          accounts
            .find((acc) => acc.account_id == rule.matcher_account_to_id_value)
            ?.name.toLowerCase()
            .includes(lowerCaseQuery) ||
          accounts
            .find((acc) => acc.account_id == rule.assign_account_from_id)
            ?.name.toLowerCase()
            .includes(lowerCaseQuery) ||
          accounts
            .find((acc) => acc.account_id == rule.assign_account_to_id)
            ?.name.toLowerCase()
            .includes(lowerCaseQuery) ||
          categories
            .find((cat) => cat.category_id == rule.assign_category_id)
            ?.name.toLowerCase()
            .includes(lowerCaseQuery) ||
          entities
            .find((ent) => ent.entity_id == rule.assign_entity_id)
            ?.name.toLowerCase()
            .includes(lowerCaseQuery) ||
          (rule.matcher_type_value &&
            getTransactionTypeLocalizedText(rule.matcher_type_value)
              .toLowerCase()
              .includes(lowerCaseQuery)) ||
          (rule.assign_type &&
            getTransactionTypeLocalizedText(rule.assign_type)
              .toLowerCase()
              .includes(lowerCaseQuery)),
      );
    }

    return filteredList;
  }, [searchQuery, rules]);

  // Loading
  useEffect(() => {
    if (getRulesRequest.isFetching || removeRuleRequest.isPending) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [getRulesRequest.isFetching || removeRuleRequest.isPending]);

  // Error
  useEffect(() => {
    if (getRulesRequest.isError || removeRuleRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [getRulesRequest.isError, removeRuleRequest.isError]);

  // Success
  useEffect(() => {
    if (!getRulesRequest.data) return;
    setRules(getRulesRequest.data.rules);
    setAccounts(getRulesRequest.data.accounts);
    setCategories(getRulesRequest.data.categories);
    setEntities(getRulesRequest.data.entities);
  }, [getRulesRequest.data]);

  // Reset actionableRule
  useEffect(() => {
    if (isRemoveDialogOpen == false && isAddEditDialogOpen == false) {
      setActionableRule(null);
    }
  }, [isRemoveDialogOpen, isAddEditDialogOpen]);

  const handleEditButtonClick = (rule: Rule) => {
    setActionableRule(rule);
    setAddEditDialogOpen(true);
  };

  const rows = useMemo(
    () =>
      filteredRules.map((rule: Rule) => ({
        id: rule.rule_id,
        conditions: {
          accountFromOperator: rule.matcher_account_from_id_operator,
          accountFromValue: accounts.find(
            (acc) => acc.account_id == rule.matcher_account_from_id_value,
          )?.name,
          accountToOperator: rule.matcher_account_to_id_operator,
          accountToValue: accounts.find(
            (acc) => acc.account_id == rule.matcher_account_to_id_value,
          )?.name,
          amountOperator: rule.matcher_amount_operator,
          amountValue: rule.matcher_amount_value,
          descriptionOperator: rule.matcher_description_operator,
          descriptionValue: rule.matcher_description_value,
          typeOperator: rule.matcher_type_operator,
          typeValue: rule.matcher_type_value,
        },
        result: {
          accountFrom: accounts.find(
            (acc) => acc.account_id == rule.assign_account_from_id,
          )?.name,
          accountTo: accounts.find(
            (acc) => acc.account_id == rule.assign_account_to_id,
          )?.name,
          category: categories.find(
            (cat) => cat.category_id == rule.assign_category_id,
          )?.name,
          entity: entities.find((ent) => ent.entity_id == rule.assign_entity_id)
            ?.name,
          type: rule.assign_type,
          isEssential: rule.assign_is_essential,
        },
        actions: rule,
      })),
    [filteredRules, accounts, categories, entities],
  );

  const getMatchingTypeLocalizedText = (matchingType: string): string => {
    switch (matchingType) {
      case RuleMatchingOperatorType.Equals:
        return t('rules.equals');
      case RuleMatchingOperatorType.NotEquals:
        return t('rules.notEquals');
      case RuleMatchingOperatorType.Contains:
        return t('rules.contains');
      case RuleMatchingOperatorType.NotContains:
        return t('rules.doesNotContain');
      default:
        return t('rules.ignore');
    }
  };

  const ConditionCell = (props: {
    conditionLabel: string;
    matchingTypeValue: string;
    conditionValue: string;
  }) => {
    return (
      <span>
        <span className="text-muted-foreground">{props.conditionLabel}:</span>{' '}
        ({props.matchingTypeValue}) {props.conditionValue}
      </span>
    );
  };

  const ResultCell = (props: { resultLabel: string; resultValue: string }) => {
    return (
      <span>
        <span className="text-muted-foreground">{props.resultLabel}:</span>{' '}
        {props.resultValue}
      </span>
    );
  };

  const columns: MyFinColumnDef[] = [
    {
      field: 'conditions',
      headerName: t('rules.conditions'),
      flex: 1,
      minWidth: 200,
      editable: false,
      sortable: false,
      renderCell: (params) => (
        <div className="my-1 flex flex-col gap-1">
          {params.value.accountFromOperator !=
            RuleMatchingOperatorType.Ignore && (
            <ConditionCell
              conditionLabel={t('rules.fromAccount')}
              matchingTypeValue={getMatchingTypeLocalizedText(
                params.value.accountFromOperator,
              )}
              conditionValue={params.value.accountFromValue}
            />
          )}
          {params.value.accountToOperator !=
            RuleMatchingOperatorType.Ignore && (
            <ConditionCell
              conditionLabel={t('rules.toAccount')}
              matchingTypeValue={getMatchingTypeLocalizedText(
                params.value.accountToOperator,
              )}
              conditionValue={params.value.accountToValue}
            />
          )}
          {params.value.amountOperator != RuleMatchingOperatorType.Ignore && (
            <ConditionCell
              conditionLabel={t('common.amount')}
              matchingTypeValue={getMatchingTypeLocalizedText(
                params.value.amountOperator,
              )}
              conditionValue={params.value.amountValue}
            />
          )}
          {params.value.descriptionOperator !=
            RuleMatchingOperatorType.Ignore && (
            <ConditionCell
              conditionLabel={t('common.description')}
              matchingTypeValue={getMatchingTypeLocalizedText(
                params.value.descriptionOperator,
              )}
              conditionValue={params.value.descriptionValue}
            />
          )}
          {params.value.typeOperator != RuleMatchingOperatorType.Ignore && (
            <ConditionCell
              conditionLabel={t('common.type')}
              matchingTypeValue={getMatchingTypeLocalizedText(
                params.value.typeOperator,
              )}
              conditionValue={getTransactionTypeLocalizedText(
                params.value.typeValue,
              )}
            />
          )}
        </div>
      ),
    },
    {
      field: 'result',
      headerName: t('rules.result'),
      flex: 1,
      minWidth: 200,
      editable: false,
      sortable: false,
      renderCell: (params) => (
        <div className="my-1 flex flex-col gap-1">
          {params.value.accountFrom && (
            <ResultCell
              resultLabel={t('rules.fromAccount')}
              resultValue={params.value.accountFrom}
            />
          )}
          {params.value.accountTo && (
            <ResultCell
              resultLabel={t('rules.toAccount')}
              resultValue={params.value.accountTo}
            />
          )}
          {params.value.category && (
            <ResultCell
              resultLabel={t('rules.assignCategory')}
              resultValue={params.value.category}
            />
          )}
          {params.value.entity && (
            <ResultCell
              resultLabel={t('rules.assignEntity')}
              resultValue={params.value.entity}
            />
          )}
          {params.value.type && (
            <ResultCell
              resultLabel={t('rules.assignType')}
              resultValue={params.value.type}
            />
          )}
          {params.value.isEssential != undefined && (
            <ResultCell
              resultLabel={t('rules.essential')}
              resultValue={
                params.value.isEssential ? t('rules.yes') : t('rules.no')
              }
            />
          )}
        </div>
      ),
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
            variant="ghost"
            size="icon"
            type="button"
            aria-label={t('common.edit')}
            onClick={() => {
              handleEditButtonClick(params.value);
            }}
          >
            <Pencil className="h-5 w-5 opacity-70" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label={t('common.delete')}
            onClick={(event) => {
              event.stopPropagation();
              setActionableRule(params.value);
              setRemoveDialogOpen(true);
            }}
          >
            <Trash2 className="h-5 w-5 opacity-70" />
          </Button>
        </div>
      ),
    },
  ];

  const removeRule = () => {
    if (!actionableRule) return;
    removeRuleRequest.mutate(actionableRule.rule_id);
    setRemoveDialogOpen(false);
  };

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      debouncedSearchQuery(event.target.value);
    },
    [debouncedSearchQuery],
  );

  return (
    <Card className="m-4 border bg-card p-4 shadow-sm">
      {isAddEditDialogOpen && (
        <AddEditRuleDialog
          isOpen={isAddEditDialogOpen}
          onClose={() => setAddEditDialogOpen(false)}
          onPositiveClick={() => setAddEditDialogOpen(false)}
          onNegativeClick={() => setAddEditDialogOpen(false)}
          rule={actionableRule}
          accounts={accounts}
          categories={categories}
          entities={entities}
        />
      )}
      {isRemoveDialogOpen && (
        <GenericConfirmationDialog
          isOpen={isRemoveDialogOpen}
          onClose={() => setRemoveDialogOpen(false)}
          onPositiveClick={() => removeRule()}
          onNegativeClick={() => setRemoveDialogOpen(false)}
          titleText={t('rules.deleteRuleModalTitle', {
            id: actionableRule?.rule_id,
          })}
          descriptionText={t('rules.deleteRuleModalSubtitle')}
          positiveText={t('common.delete')}
          alert={t('rules.deleteRuleModalAlert')}
        />
      )}
      <div className="flex flex-col justify-between">
        <PageHeader title={t('rules.rules')} subtitle={t('rules.strapLine')} />
      </div>
      <div className="mt-4 grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-8">
          <Button
            className="mb-2 gap-2"
            onClick={() => {
              setAddEditDialogOpen(true);
            }}
          >
            <CirclePlus className="size-5" />
            {t('rules.addRule')}
          </Button>
        </div>
        <div className="col-span-12 flex justify-end md:col-span-4">
          <div className="w-full space-y-2 md:max-w-xs">
            <Label htmlFor="search-rules">{t('common.search')}</Label>
            <div className="relative">
              <Input
                id="search-rules"
                className="pr-10"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  handleSearchChange(event);
                }}
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>
        <div className="col-span-12">
          <MyFinStaticTable
            isRefetching={getRulesRequest.isRefetching}
            rows={rows}
            columns={columns}
            paginationModel={{ pageSize: 20 }}
            onRowClicked={(id) => {
              const rule = rules.find((ent) => ent.rule_id == id);
              if (!rule) return;
              handleEditButtonClick(rule);
            }}
          />
        </div>
      </div>
    </Card>
  );
};

export default Rules;
