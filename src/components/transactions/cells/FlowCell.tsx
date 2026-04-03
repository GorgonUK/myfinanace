import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { MyFinRenderCellParams } from '@/components/dashboard/Table/Types';
import { useTranslation } from 'react-i18next';
import type { TransactionGridRow } from '../types';

export function TransactionFlowCell({
  params,
}: {
  params: MyFinRenderCellParams;
}) {
  const { t } = useTranslation();
  const v = params.value as TransactionGridRow['flow'];
  if (!v) return null;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-row items-center gap-2">
        <ArrowLeft
          className={`size-4 shrink-0 ${v.acc_from_name ? 'text-primary' : 'text-muted-foreground'}`}
        />
        {v.acc_from_name ?? t('common.externalAccount')}
      </div>
      <div className="flex flex-row items-center gap-2">
        <ArrowRight
          className={`size-4 shrink-0 ${v.acc_to_name ? 'text-muted-foreground' : 'text-primary'}`}
        />
        {v.acc_to_name ?? t('common.externalAccount')}
      </div>
    </div>
  );
}
