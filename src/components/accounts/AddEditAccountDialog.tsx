import {
  Account,
  AccountStatus,
  AccountType,
} from '@/common/api/auth';
import { Trans, useTranslation } from 'react-i18next';
import { useLoading } from '../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../providers/SnackbarProvider.tsx';
import React, { useEffect, useState } from 'react';
import { FileText, Play, Send, Snowflake, Undo, UserCircle } from 'lucide-react';
import { cssGradients } from '../../utils/gradientUtils.ts';
import { ColorGradient } from '@/config';
import {
  useAddAccount,
  useEditAccount,
} from '@/hooks/account';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/common/shadcn/ui/dialog.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Checkbox } from '@/common/shadcn/ui/checkbox.tsx';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/common/shadcn/ui/tooltip.tsx';
import { ToggleGroup, ToggleGroupItem } from '@/common/shadcn/ui/toggle-group.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/common/shadcn/ui/select.tsx';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onPositiveClick: () => void;
  onNegativeClick: () => void;
  account: Account | null;
};

const AddEditAccountDialog = (props: Props) => {
  const isEditForm = props.account !== null;

  const { t } = useTranslation();
  const loader = useLoading();
  const snackbar = useSnackbar();

  const addAccountRequest = useAddAccount();
  const editAccountRequest = useEditAccount();

  const [excludeFromBudgetsValue, setExcludeFromBudgetsValue] = useState(
    props.account?.exclude_from_budgets == true,
  );
  const colorOptions = Object.values(ColorGradient) as ColorGradient[];
  const [colorValue, setColorValue] = useState<string>(
    props.account?.color_gradient || colorOptions[0]!,
  );
  const [statusValue, setStatusValue] = useState<AccountStatus>(
    props.account?.status || AccountStatus.Active,
  );
  const [nameValue, setNameValue] = useState<string>(props.account?.name || '');
  const [descriptionValue, setDescriptionValue] = useState<string>(
    props.account?.description || '',
  );
  const [typeValue, setTypeValue] = useState<AccountType | ''>(
    props.account?.type || '',
  );
  const typeOptions = Object.values(AccountType);

  useEffect(() => {
    if (addAccountRequest.isPending || editAccountRequest.isPending) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [addAccountRequest.isPending, editAccountRequest.isPending]);

  useEffect(() => {
    if (addAccountRequest.isError || editAccountRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [addAccountRequest.isError, editAccountRequest.isError]);

  useEffect(() => {
    if (addAccountRequest.isSuccess || editAccountRequest.isSuccess) {
      props.onPositiveClick();
    }
  }, [addAccountRequest.isSuccess, editAccountRequest.isSuccess]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isEditForm && props.account) {
      editAccountRequest.mutate({
        account_id: props.account.account_id,
        new_name: nameValue,
        new_type: typeValue as AccountType,
        new_status: statusValue,
        new_description: descriptionValue,
        exclude_from_budgets: excludeFromBudgetsValue,
        color_gradient: colorValue as ColorGradient,
      });
    } else {
      addAccountRequest.mutate({
        name: nameValue,
        type: typeValue as AccountType,
        status: statusValue,
        description: descriptionValue,
        exclude_from_budgets: excludeFromBudgetsValue,
        color_gradient: colorValue as ColorGradient,
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
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-3">
                <DialogTitle className="text-left">
                  <Trans
                    i18nKey={
                      isEditForm
                        ? 'accounts.editAccountModalTitle'
                        : 'accounts.addNewAccountModalTitle'
                    }
                    values={{
                      name: props.account?.name,
                    }}
                  />
                </DialogTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="exclude-budgets"
                        checked={excludeFromBudgetsValue}
                        onCheckedChange={(c) =>
                          setExcludeFromBudgetsValue(c === true)
                        }
                      />
                      <Label
                        htmlFor="exclude-budgets"
                        className="cursor-pointer font-normal"
                      >
                        {t('accounts.excludeFromBudgets')}
                      </Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {t('accounts.excludeFromBudgetsTooltip')}
                  </TooltipContent>
                </Tooltip>
              </div>
              <ToggleGroup
                type="single"
                value={statusValue}
                onValueChange={(v) => {
                  if (
                    v &&
                    Object.values(AccountStatus).includes(v as AccountStatus)
                  ) {
                    setStatusValue(v as AccountStatus);
                  }
                }}
                variant="outline"
                size="sm"
                className="shrink-0 justify-end"
              >
                <ToggleGroupItem
                  value={AccountStatus.Active}
                  aria-label={t('accounts.active')}
                  className="gap-2 px-3"
                >
                  <Play className="size-4" />
                  {t('accounts.active')}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value={AccountStatus.Inactive}
                  aria-label={t('accounts.inactive')}
                  className="gap-2 px-3"
                >
                  <Snowflake className="size-4" />
                  {t('accounts.inactive')}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 md:grid-cols-12 md:items-end">
              <div className="flex flex-col gap-2 md:col-span-6">
                <Label htmlFor="account-name">{t('accounts.name')}</Label>
                <div className="relative">
                  <UserCircle className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                  <Input
                    id="account-name"
                    name="name"
                    required
                    value={nameValue || ''}
                    onChange={(e) => setNameValue(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 md:col-span-4">
                <Label htmlFor="account-type">{t('accounts.type')}</Label>
                <Select
                  value={typeValue || undefined}
                  onValueChange={(v) => setTypeValue(v as AccountType)}
                  required
                >
                  <SelectTrigger id="account-type" className="w-full">
                    <SelectValue placeholder={t('accounts.type')} />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`accounts.${type.toLowerCase()}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="color-select">{t('accounts.color')}</Label>
                <Select value={colorValue} onValueChange={setColorValue}>
                  <SelectTrigger id="color-select" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color} value={color}>
                        <div
                          className="mx-auto rounded-full"
                          style={{
                            background: cssGradients[color] ?? '',
                            width: 60,
                            height: 20,
                          }}
                        />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2 md:col-span-12">
                <Label htmlFor="account-description">
                  {t('common.description')}
                </Label>
                <div className="relative">
                  <FileText className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                  <Input
                    id="account-description"
                    name="description"
                    value={descriptionValue || ''}
                    onChange={(e) => setDescriptionValue(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={props.onNegativeClick}
            >
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

export default AddEditAccountDialog;
