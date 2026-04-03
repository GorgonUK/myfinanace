import { formatNumberAsPercentage } from '../utils/textUtils.ts';
import { ArrowUpRight } from 'lucide-react';
import { Badge } from '@/common/shadcn/ui/badge.tsx';
import { cn } from '@/common/shadcn/lib/utils';

const PercentageChip = ({
  percentage,
  hideIcon,
  className,
}: {
  percentage: number;
  hideIcon?: boolean;
  className?: string;
}) => {
  const neutral =
    percentage === 0 || !Number.isFinite(percentage);
  const negative = !neutral && percentage < 0;

  return (
    <Badge
      variant="outline"
      className={cn(
        'mt-0.5 gap-1 text-xs font-normal',
        neutral && 'border-border',
        negative && 'border-amber-500 text-amber-700 dark:text-amber-400',
        !neutral && !negative && 'border-green-600 text-green-700 dark:text-green-400',
        className,
      )}
    >
      {!hideIcon && !neutral ? (
        negative ? (
          <ArrowUpRight
            className="size-3.5 shrink-0"
            style={{ transform: 'rotate(90deg)' }}
            aria-hidden
          />
        ) : (
          <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
        )
      ) : null}
      {neutral ? '-%' : formatNumberAsPercentage(percentage, true)}
    </Badge>
  );
};

export default PercentageChip;
