import {
  Rule,
  RuleMatchingOperatorType,
} from '@/common/api/rule';
import { Trans, useTranslation } from 'react-i18next';
import { useLoading } from '../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../providers/SnackbarProvider.tsx';
import { useAddRule, useEditRule } from '@/hooks/rule';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Send, Undo } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/common/shadcn/ui/dialog.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/common/shadcn/ui/select.tsx';
import { cn } from '@/common/shadcn/lib/utils';
import { Entity, TransactionType } from '@/common/api/trx';
import { Account } from '@/common/api/auth';
import { Category } from '@/common/api/category';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onPositiveClick: () => void;
  onNegativeClick: () => void;
  rule: Rule | null;
  accounts: Account[];
  categories: Category[];
  entities: Entity[];
};

export type MatchingOperatorOption = {
  id: string;
  label: string;
};

function RuleCollapsible({
  title,
  subtitle,
  defaultOpen,
  children,
}: {
  title: string;
  subtitle: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      className={cn('group mb-4 rounded-md border', defaultOpen && 'open')}
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-start gap-2 p-4 [&::-webkit-details-marker]:hidden">
        <ChevronDown className="mt-0.5 size-4 shrink-0 transition-transform group-open:rotate-180" />
        <div className="grid flex-1 gap-1 sm:grid-cols-2">
          <span className="font-medium">{title}</span>
          <span className="text-muted-foreground text-sm">{subtitle}</span>
        </div>
      </summary>
      <div className="border-t px-4 pb-4 pt-2">{children}</div>
    </details>
  );
}

const AddEditRuleDialog = (props: Props) => {
  const isEditForm = props.rule !== null;

  const { t } = useTranslation();
  const loader = useLoading();
  const snackbar = useSnackbar();

  const addRuleRequest = useAddRule();
  const editRuleRequest = useEditRule();

  const [rule, setRule] = useState<Partial<Rule>>(
    props?.rule || {
      matcher_description_operator: RuleMatchingOperatorType.Ignore,
      matcher_type_operator: RuleMatchingOperatorType.Ignore,
      matcher_account_from_id_operator: RuleMatchingOperatorType.Ignore,
      matcher_account_to_id_operator: RuleMatchingOperatorType.Ignore,
      matcher_amount_operator: RuleMatchingOperatorType.Ignore,
    },
  );

  const operatorOptions = useRef<MatchingOperatorOption[]>([
    { id: RuleMatchingOperatorType.Ignore, label: t('rules.ignore') },
    {
      id: RuleMatchingOperatorType.NotContains,
      label: t('rules.doesNotContain'),
    },
    { id: RuleMatchingOperatorType.Contains, label: t('rules.contains') },
    { id: RuleMatchingOperatorType.Equals, label: t('rules.equals') },
    { id: RuleMatchingOperatorType.NotEquals, label: t('rules.notEquals') },
  ]);
  const binaryOperatorOptions = useRef<MatchingOperatorOption[]>([
    { id: RuleMatchingOperatorType.Ignore, label: t('rules.ignore') },
    { id: RuleMatchingOperatorType.Equals, label: t('rules.equals') },
    { id: RuleMatchingOperatorType.NotEquals, label: t('rules.notEquals') },
  ]);
  const typeOptions = useRef<MatchingOperatorOption[]>([
    { id: TransactionType.Expense, label: t('transactions.expense') },
    { id: TransactionType.Income, label: t('transactions.income') },
    { id: TransactionType.Transfer, label: t('transactions.transfer') },
  ]);

  const ignoreOption = { id: -1n, label: t('common.ignore') };

  useEffect(() => {
    if (addRuleRequest.isPending || editRuleRequest.isPending) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [addRuleRequest.isPending, editRuleRequest.isPending]);

  useEffect(() => {
    if (addRuleRequest.isError || editRuleRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [addRuleRequest.isError, editRuleRequest.isError]);

  useEffect(() => {
    if (addRuleRequest.isSuccess || editRuleRequest.isSuccess) {
      props.onPositiveClick();
    }
  }, [addRuleRequest.isSuccess, editRuleRequest.isSuccess]);

  const updateRule = useCallback(
    (updates: Partial<Rule>) => {
      setRule((prevRule) => {
        if (prevRule === null) {
          return { ...updates } as Rule;
        }
        return { ...prevRule, ...updates };
      });
    },
    [setRule],
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rule) return;
    if (isEditForm) {
      if (rule.rule_id) {
        editRuleRequest.mutate(rule as Rule);
      } else {
        addRuleRequest.mutate(rule);
      }
    } else {
      addRuleRequest.mutate(rule);
    }
  };

  const catOptions = [
    { category_id: ignoreOption.id, name: ignoreOption.label },
    ...props.categories,
  ];
  const entOptions = [
    { entity_id: ignoreOption.id, name: ignoreOption.label },
    ...props.entities,
  ];
  const accOptions = [
    { account_id: ignoreOption.id, name: ignoreOption.label },
    ...props.accounts,
  ];

  const catVal = String(rule?.assign_category_id ?? ignoreOption.id);
  const entVal = String(rule?.assign_entity_id ?? ignoreOption.id);
  const accFromVal = String(rule?.assign_account_from_id ?? ignoreOption.id);
  const accToVal = String(rule?.assign_account_to_id ?? ignoreOption.id);

  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey={isEditForm ? 'rules.updateRule' : 'rules.addRule'} />
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <RuleCollapsible
              defaultOpen
              title={t('rules.conditions')}
              subtitle={t('rules.conditionsDescription')}
            >
              <div className="grid gap-4 md:grid-cols-12">
                <div className="flex flex-col gap-2 md:col-span-3">
                  <Label htmlFor="description-select">{t('rules.operator')}</Label>
                  <Select
                    value={
                      rule?.matcher_description_operator ||
                      RuleMatchingOperatorType.Ignore
                    }
                    onValueChange={(v) =>
                      updateRule({ matcher_description_operator: v })
                    }
                  >
                    <SelectTrigger id="description-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operatorOptions.current.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2 md:col-span-9">
                  <Label htmlFor="description-condition">
                    {t('common.description')}
                  </Label>
                  <Input
                    id="description-condition"
                    name="description-condition"
                    disabled={
                      rule?.matcher_description_operator ==
                      RuleMatchingOperatorType.Ignore
                    }
                    required={
                      rule?.matcher_description_operator !=
                      RuleMatchingOperatorType.Ignore
                    }
                    value={rule?.matcher_description_value || ''}
                    onChange={(e) =>
                      updateRule({ matcher_description_value: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-3">
                  <Label htmlFor="amount-select">{t('rules.operator')}</Label>
                  <Select
                    value={
                      rule?.matcher_amount_operator ||
                      RuleMatchingOperatorType.Ignore
                    }
                    onValueChange={(v) =>
                      updateRule({ matcher_amount_operator: v })
                    }
                  >
                    <SelectTrigger id="amount-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operatorOptions.current.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2 md:col-span-9">
                  <Label htmlFor="amount-condition">{t('common.amount')}</Label>
                  <Input
                    id="amount-condition"
                    name="amount-condition"
                    type="number"
                    step={0.01}
                    disabled={
                      rule?.matcher_amount_operator ==
                      RuleMatchingOperatorType.Ignore
                    }
                    required={
                      rule?.matcher_amount_operator !=
                      RuleMatchingOperatorType.Ignore
                    }
                    value={rule?.matcher_amount_value ?? ''}
                    onChange={(e) =>
                      updateRule({ matcher_amount_value: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-3">
                  <Label htmlFor="type-select">{t('rules.operator')}</Label>
                  <Select
                    value={
                      rule?.matcher_type_operator ||
                      RuleMatchingOperatorType.Ignore
                    }
                    onValueChange={(v) =>
                      updateRule({ matcher_type_operator: v })
                    }
                  >
                    <SelectTrigger id="type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {binaryOperatorOptions.current.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2 md:col-span-9">
                  <Label htmlFor="type-condition">{t('common.type')}</Label>
                  <Select
                    value={rule?.matcher_type_value || ''}
                    onValueChange={(v) => updateRule({ matcher_type_value: v })}
                    disabled={
                      rule?.matcher_type_operator ==
                      RuleMatchingOperatorType.Ignore
                    }
                    required={
                      rule?.matcher_type_operator !=
                      RuleMatchingOperatorType.Ignore
                    }
                  >
                    <SelectTrigger id="type-condition">
                      <SelectValue placeholder={t('common.type')} />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.current.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2 md:col-span-3">
                  <Label htmlFor="account-from-select">{t('rules.operator')}</Label>
                  <Select
                    value={
                      rule?.matcher_account_from_id_operator ||
                      RuleMatchingOperatorType.Ignore
                    }
                    onValueChange={(v) =>
                      updateRule({ matcher_account_from_id_operator: v })
                    }
                  >
                    <SelectTrigger id="account-from-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {binaryOperatorOptions.current.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2 md:col-span-9">
                  <Label htmlFor="account-from-condition">
                    {t('transactions.originAccount')}
                  </Label>
                  <Select
                    value={
                      rule?.matcher_account_from_id_value != null
                        ? String(rule.matcher_account_from_id_value)
                        : undefined
                    }
                    onValueChange={(v) =>
                      updateRule({ matcher_account_from_id_value: BigInt(v) })
                    }
                    disabled={
                      rule?.matcher_account_from_id_operator ==
                      RuleMatchingOperatorType.Ignore
                    }
                    required={
                      rule?.matcher_account_from_id_operator !=
                      RuleMatchingOperatorType.Ignore
                    }
                  >
                    <SelectTrigger id="account-from-condition">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {props.accounts.map((a) => (
                        <SelectItem key={String(a.account_id)} value={String(a.account_id)}>
                          {a.name || ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2 md:col-span-3">
                  <Label htmlFor="account-to-select">{t('rules.operator')}</Label>
                  <Select
                    value={
                      rule?.matcher_account_to_id_operator ||
                      RuleMatchingOperatorType.Ignore
                    }
                    onValueChange={(v) =>
                      updateRule({ matcher_account_to_id_operator: v })
                    }
                  >
                    <SelectTrigger id="account-to-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {binaryOperatorOptions.current.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2 md:col-span-9">
                  <Label htmlFor="account-to-condition">
                    {t('transactions.destinationAccount')}
                  </Label>
                  <Select
                    value={
                      rule?.matcher_account_to_id_value != null
                        ? String(rule.matcher_account_to_id_value)
                        : undefined
                    }
                    onValueChange={(v) =>
                      updateRule({ matcher_account_to_id_value: BigInt(v) })
                    }
                    disabled={
                      rule?.matcher_account_to_id_operator ==
                      RuleMatchingOperatorType.Ignore
                    }
                    required={
                      rule?.matcher_account_to_id_operator !=
                      RuleMatchingOperatorType.Ignore
                    }
                  >
                    <SelectTrigger id="account-to-condition">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {props.accounts.map((a) => (
                        <SelectItem key={String(a.account_id)} value={String(a.account_id)}>
                          {a.name || ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </RuleCollapsible>

            <RuleCollapsible
              title={t('rules.result')}
              subtitle={t('rules.resultDescription')}
            >
              <div className="grid gap-4">
                <div className="flex flex-col gap-2">
                  <Label>{t('rules.categoryToAssign')}</Label>
                  <Select
                    value={catVal}
                    onValueChange={(v) =>
                      updateRule({ assign_category_id: BigInt(v) })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {catOptions.map((c) => (
                        <SelectItem key={String(c.category_id)} value={String(c.category_id)}>
                          {c.name || ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>{t('rules.entityToAssign')}</Label>
                  <Select
                    value={entVal}
                    onValueChange={(v) =>
                      updateRule({ assign_entity_id: BigInt(v) })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {entOptions.map((e) => (
                        <SelectItem key={String(e.entity_id)} value={String(e.entity_id)}>
                          {e.name || ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>{t('rules.fromAccountToAssign')}</Label>
                  <Select
                    value={accFromVal}
                    onValueChange={(v) =>
                      updateRule({ assign_account_from_id: BigInt(v) })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {accOptions.map((a) => (
                        <SelectItem key={String(a.account_id)} value={String(a.account_id)}>
                          {a.name || ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>{t('rules.toAccountToAssign')}</Label>
                  <Select
                    value={accToVal}
                    onValueChange={(v) =>
                      updateRule({ assign_account_to_id: BigInt(v) })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {accOptions.map((a) => (
                        <SelectItem key={String(a.account_id)} value={String(a.account_id)}>
                          {a.name || ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="essential-result">{t('transactions.essential')}</Label>
                  <Select
                    value={String(rule?.assign_is_essential ?? 0)}
                    onValueChange={(v) =>
                      updateRule({ assign_is_essential: parseInt(v, 10) })
                    }
                  >
                    <SelectTrigger id="essential-result">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">{t('rules.no')}</SelectItem>
                      <SelectItem value="1">{t('rules.yes')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </RuleCollapsible>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
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

export default AddEditRuleDialog;
