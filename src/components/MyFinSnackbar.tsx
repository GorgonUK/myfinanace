import { useEffect } from 'react';
import { Alert, AlertDescription } from '@/common/shadcn/ui/alert.tsx';
import { cn } from '@/common/shadcn/lib/utils';

export type SnackbarSeverity = 'error' | 'success' | 'info' | 'warning';

type Props = {
  open: boolean;
  message: string;
  duration?: number;
  handleClose: () => void;
  severity?: SnackbarSeverity;
};

const MyFinSnackbar = (props: Props) => {
  const duration = props.duration ?? 5_000;

  useEffect(() => {
    if (!props.open) return;
    const id = window.setTimeout(() => props.handleClose(), duration);
    return () => window.clearTimeout(id);
  }, [props.open, duration, props.handleClose]);

  if (!props.open) return null;

  const destructive = props.severity === 'error';

  return (
    <div
      className="pointer-events-none fixed left-1/2 top-4 z-[100] w-[min(100%-2rem,28rem)] -translate-x-1/2 px-2"
      role="status"
    >
      <Alert
        variant={destructive ? 'destructive' : 'default'}
        className={cn(
          'pointer-events-auto shadow-md',
          !destructive &&
            props.severity === 'success' &&
            'border-green-600/50 text-green-800 dark:text-green-200',
          !destructive &&
            props.severity === 'warning' &&
            'border-amber-600/50 text-amber-900 dark:text-amber-100',
          !destructive &&
            props.severity === 'info' &&
            'border-blue-600/50 text-blue-900 dark:text-blue-100',
        )}
      >
        <AlertDescription>{props.message}</AlertDescription>
      </Alert>
    </div>
  );
};

export default MyFinSnackbar;
