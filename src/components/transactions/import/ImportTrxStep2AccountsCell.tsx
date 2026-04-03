import { IdLabelPair } from '../AddEditTransactionDialog.tsx';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/common/shadcn/ui/label.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/common/shadcn/ui/select.tsx';

type Props = {
  id: number;
  accounts: IdLabelPair[];
  selectedAccountFrom: IdLabelPair | null;
  selectedAccountTo: IdLabelPair | null;
  onAccountFromChange: (id: number, input: IdLabelPair | null) => void;
  onAccountToChange: (id: number, input: IdLabelPair | null) => void;
};

function ImportTrxStep2AccountsCell(props: Props) {
  const { t } = useTranslation();

  return (
    <div className="mt-4 mb-4 flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`accountFrom-${props.id}`}>
          {t('transactions.originAccount')}
        </Label>
        <Select
          value={
            props.selectedAccountFrom
              ? String(props.selectedAccountFrom.id)
              : undefined
          }
          onValueChange={(v) => {
            const acc =
              props.accounts.find((a) => String(a.id) === v) ?? null;
            props.onAccountFromChange(props.id, acc);
          }}
        >
          <SelectTrigger id={`accountFrom-${props.id}`}>
            <SelectValue placeholder={t('common.chooseAnOption')} />
          </SelectTrigger>
          <SelectContent>
            {props.accounts.map((a) => (
              <SelectItem key={String(a.id)} value={String(a.id)}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`accountTo-${props.id}`}>
          {t('transactions.destinationAccount')}
        </Label>
        <Select
          value={
            props.selectedAccountTo
              ? String(props.selectedAccountTo.id)
              : undefined
          }
          onValueChange={(v) => {
            const acc =
              props.accounts.find((a) => String(a.id) === v) ?? null;
            props.onAccountToChange(props.id, acc);
          }}
        >
          <SelectTrigger id={`accountTo-${props.id}`}>
            <SelectValue placeholder={t('common.chooseAnOption')} />
          </SelectTrigger>
          <SelectContent>
            {props.accounts.map((a) => (
              <SelectItem key={String(a.id)} value={String(a.id)}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default memo(ImportTrxStep2AccountsCell);
