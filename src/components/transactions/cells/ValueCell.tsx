import { Badge } from '@/common/shadcn/ui/badge.tsx';
import { cn } from '@/common/shadcn/lib/utils';
import type { MyFinRenderCellParams } from '@/components/dashboard/Table/Types';
import type { TransactionGridRow } from '../types';

export function TransactionValueCell({
  params,
}: {
  params: MyFinRenderCellParams;
}) {
  const v = params.value as TransactionGridRow['value'];
  if (!v) return null;

  const tone = v.chipColor as string;
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-sm font-semibold',
        tone === 'primary' && 'border-primary text-primary',
        tone === 'secondary' && 'border-secondary text-secondary-foreground',
      )}
    >
      {v.amount}
    </Badge>
  );
}
