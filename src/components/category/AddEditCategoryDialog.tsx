import { Category, CategoryStatus } from '@/common/api/category';
import { Trans, useTranslation } from 'react-i18next';
import { useLoading } from '@/providers/LoadingProvider.tsx';
import { AlertSeverity, useSnackbar } from '@/providers/SnackbarProvider.tsx';
import { useAddCategory, useEditCategory } from '@/hooks/category';
import React, { useEffect, useState } from 'react';
import { ColorGradient } from '@/config';
import { cssGradients } from '@/utils/gradientUtils.ts';
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
import { FileText, Folder, Play, Send, Snowflake, Undo } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onPositiveClick: () => void;
  onNegativeClick: () => void;
  category: Category | null;
};

const AddEditCategoryDialog = (props: Props) => {
  const isEditForm = props.category !== null;

  const { t } = useTranslation();
  const loader = useLoading();
  const snackbar = useSnackbar();

  const addCategoryRequest = useAddCategory();
  const editCategoryRequest = useEditCategory();

  const [excludeFromBudgetsValue, setExcludeFromBudgetsValue] = useState(
    props.category?.exclude_from_budgets == 1,
  );
  const colorOptions = Object.values(ColorGradient);
  const [colorValue, setColorValue] = useState<string>(
    props.category?.color_gradient || colorOptions[0]!,
  );
  const [statusValue, setStatusValue] = useState<CategoryStatus>(
    props.category?.status || CategoryStatus.Active,
  );
  const [nameValue, setNameValue] = useState<string>(
    props.category?.name || '',
  );
  const [descriptionValue, setDescriptionValue] = useState<string>(
    props.category?.description || '',
  );

  useEffect(() => {
    if (addCategoryRequest.isPending || editCategoryRequest.isPending) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [addCategoryRequest.isPending, editCategoryRequest.isPending]);

  useEffect(() => {
    if (addCategoryRequest.isError || editCategoryRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [addCategoryRequest.isError, editCategoryRequest.isError]);

  useEffect(() => {
    if (addCategoryRequest.isSuccess || editCategoryRequest.isSuccess) {
      props.onPositiveClick();
    }
  }, [addCategoryRequest.isSuccess, editCategoryRequest.isSuccess]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isEditForm && props.category) {
      editCategoryRequest.mutate({
        category_id: props.category.category_id,
        new_name: nameValue,
        new_status: statusValue,
        new_color_gradient: colorValue,
        new_description: descriptionValue,
        new_exclude_from_budgets: excludeFromBudgetsValue,
      });
    } else {
      addCategoryRequest.mutate({
        name: nameValue,
        status: statusValue,
        color_gradient: colorValue,
        description: descriptionValue,
        exclude_from_budgets: excludeFromBudgetsValue,
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
                        ? 'categories.editCategoryModalTitle'
                        : 'categories.addCategoryCTA'
                    }
                  />
                </DialogTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="cat-exclude-budgets"
                        checked={excludeFromBudgetsValue}
                        onCheckedChange={(c) =>
                          setExcludeFromBudgetsValue(c === true)
                        }
                      />
                      <Label
                        htmlFor="cat-exclude-budgets"
                        className="cursor-pointer font-normal"
                      >
                        {t('common.excludeFromBudgets')}
                      </Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {t('categories.excludeFromBudgetsTooltip')}
                  </TooltipContent>
                </Tooltip>
              </div>
              <ToggleGroup
                type="single"
                value={statusValue}
                onValueChange={(v) => {
                  if (
                    v &&
                    Object.values(CategoryStatus).includes(
                      v as CategoryStatus,
                    )
                  ) {
                    setStatusValue(v as CategoryStatus);
                  }
                }}
                variant="outline"
                size="sm"
                className="shrink-0 justify-end"
              >
                <ToggleGroupItem
                  value={CategoryStatus.Active}
                  className="gap-2 px-3"
                >
                  <Play className="size-4" />
                  {t('categories.active')}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value={CategoryStatus.Inactive}
                  className="gap-2 px-3"
                >
                  <Snowflake className="size-4" />
                  {t('categories.inactive')}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 md:grid-cols-12 md:items-end">
              <div className="flex flex-col gap-2 md:col-span-10">
                <Label htmlFor="cat-name">{t('categories.name')}</Label>
                <div className="relative">
                  <Folder className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                  <Input
                    id="cat-name"
                    name="name"
                    value={nameValue || ''}
                    onChange={(e) => setNameValue(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="cat-color">{t('categories.color')}</Label>
                <Select value={colorValue} onValueChange={setColorValue}>
                  <SelectTrigger id="cat-color" className="w-full">
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
                <Label htmlFor="cat-description">{t('common.description')}</Label>
                <div className="relative">
                  <FileText className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                  <Input
                    id="cat-description"
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

export default AddEditCategoryDialog;
