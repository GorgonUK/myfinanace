import type { ReactNode } from 'react';
import { cn } from '@/common/shadcn/lib/utils';

type Props = {
  children?: ReactNode;
  isFocused?: boolean;
  isDragAccept?: boolean;
  isDragReject?: boolean;
  className?: string;
};

const UploadDropzoneBox = ({
  isFocused,
  isDragAccept,
  isDragReject,
  children,
  className,
  ...rest
}: Props & React.HTMLAttributes<HTMLDivElement>) => {
  const borderClass = isDragAccept
    ? 'border-primary'
    : isDragReject
      ? 'border-destructive'
      : isFocused
        ? 'border-primary'
        : 'border-border';

  return (
    <div
      className={cn(
        'flex flex-1 cursor-pointer flex-col items-center rounded-lg border-2 border-dashed bg-card p-6 text-muted-foreground outline-none transition-[border,background] duration-200 hover:bg-muted/50',
        borderClass,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export default UploadDropzoneBox;
