import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/common/shadcn/ui/button.tsx';
import type { MyFinRenderCellParams } from '@/components/dashboard/Table/Types';
import { useTranslation } from 'react-i18next';
import { Transaction } from '@/common/api/trx';
type Props = {
  params: MyFinRenderCellParams;
  onEdit: (trx: Transaction) => void;
  onRemove: (trx: Transaction) => void;
};

export function TransactionActionsCell({ params, onEdit, onRemove }: Props) {
  const { t } = useTranslation();
  const trx = params.value as Transaction;
  if (!trx?.transaction_id) return null;

  return (
    <div className="flex flex-row gap-0">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t('common.edit')}
        onClick={() => {
          onEdit(trx);
        }}
      >
        <Pencil className="h-5 w-5 opacity-70" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t('common.delete')}
        onClick={(event) => {
          event.stopPropagation();
          onRemove(trx);
        }}
      >
        <Trash2 className="h-5 w-5 opacity-70" />
      </Button>
    </div>
  );
}
