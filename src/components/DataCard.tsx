import { type ReactNode } from 'react';
import { cn } from '@/common/shadcn/lib/utils';

const DataCard = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'bg-card rounded-md border border-border p-4 shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  );
};

export default DataCard;
