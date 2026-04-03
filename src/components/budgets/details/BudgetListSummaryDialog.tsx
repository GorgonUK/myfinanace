import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/common/shadcn/ui/dialog.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Send, Undo } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useGetBudgetListSummary } from '@/hooks/budget';
import { useLoading } from '../../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../../providers/SnackbarProvider.tsx';
import { getMonthsFullName } from '../../../utils/dateUtils.ts';
import { IdLabelPair } from '../../transactions/AddEditTransactionDialog.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
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
  onBudgetSelected: (budgetId: bigint) => void;
};

const BudgetListSummaryDialog = (props: Props) => {
  const { t } = useTranslation();
  const loader = useLoading();
  const snackbar = useSnackbar();

  const getBudgetListSummaryRequest = useGetBudgetListSummary();
  const [selectedBudget, setSelectedBudget] = useState<IdLabelPair | null>(
    null,
  );
  const [budgetList, setBudgetList] = useState<IdLabelPair[]>([]);
  const [isCtaEnabled, setCtaEnabled] = useState(false);

  useEffect(() => {
    if (getBudgetListSummaryRequest.isFetching) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [getBudgetListSummaryRequest.isFetching]);

  useEffect(() => {
    if (getBudgetListSummaryRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [getBudgetListSummaryRequest.isError]);

  useEffect(() => {
    if (getBudgetListSummaryRequest.data) {
      setBudgetList(
        getBudgetListSummaryRequest.data.map((budget) => ({
          id: budget.budget_id,
          label: `${getMonthsFullName(budget.month)} ${budget.year}`,
        })),
      );
    }
  }, [getBudgetListSummaryRequest.data]);

  useEffect(() => {
    setCtaEnabled(selectedBudget != null);
  }, [selectedBudget]);

  const value =
    selectedBudget != null ? String(selectedBudget.id) : undefined;

  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={(open) => !open && props.onClose()}
    >
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('budgetDetails.cloneAPreviousMonth')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="budget-clone">{t('budgetDetails.budget')}</Label>
            <Select
              value={value}
              onValueChange={(v) => {
                const id = BigInt(v);
                const found = budgetList.find((b) => b.id === id) ?? null;
                setSelectedBudget(found);
              }}
              required
            >
              <SelectTrigger id="budget-clone" className="w-full">
                <SelectValue placeholder={t('budgetDetails.budget')} />
              </SelectTrigger>
              <SelectContent>
                {budgetList.map((b) => (
                  <SelectItem key={String(b.id)} value={String(b.id)}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={props.onClose}>
            <Undo className="mr-2 size-4" />
            {t('common.goBack')}
          </Button>
          <Button
            type="button"
            disabled={!isCtaEnabled}
            onClick={() => props.onBudgetSelected(selectedBudget?.id || -1n)}
          >
            <Send className="mr-2 size-4" />
            {t('budgetDetails.cloneBudgetCTA')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetListSummaryDialog;
