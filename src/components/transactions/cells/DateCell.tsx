import { Sparkles } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/common/shadcn/ui/tooltip.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { cn } from '@/common/shadcn/lib/utils';
import type { MyFinRenderCellParams } from '@/components/dashboard/Table/Types';
import { useTranslation } from 'react-i18next';
import {
  getDayNumberFromUnixTimestamp,
  getMonthShortStringFromUnixTimestamp,
  getShortYearFromUnixTimestamp,
} from '@/utils/dateUtils';
import type { TransactionGridRow } from '../types';

export function TransactionDateCell({
  params,
}: {
  params: MyFinRenderCellParams;
}) {
  const { t } = useTranslation();
  const v = params.value as TransactionGridRow['date'];
  if (!v) return null;
  const textClass =
    v.first === true ? 'text-foreground' : 'text-muted-foreground';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-full flex-col items-center justify-center">
        <span className={cn('text-center', textClass)}>
          <b>{getDayNumberFromUnixTimestamp(v.date_timestamp ?? 0)}</b>{' '}
          <span>
            {getMonthShortStringFromUnixTimestamp(v.date_timestamp ?? 0)}
            {" '"}
            {getShortYearFromUnixTimestamp(v.date_timestamp ?? 0)}
          </span>
        </span>
      </div>
      {v.essential === 1 ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
              <Sparkles className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('transactions.essential')}</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}
