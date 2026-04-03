import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/common/shadcn/ui/dialog.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPositiveClick: () => void;
  onNegativeClick: () => void;
  title: string;
  description: string;
  positiveText?: string;
  negativeText?: string;
  alert?: string;
}

function ConfirmationDialog(props: Props) {
  const { t } = useTranslation();

  const defaultProps = {
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    alert: t('transactions.deleteTransactionModalAlert'),
  };

  const merged = { ...defaultProps, ...props };
  const {
    isOpen,
    onClose,
    title,
    description,
    positiveText,
    negativeText,
    alert,
    onNegativeClick,
    onPositiveClick,
  } = merged;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription asChild>
            <div>
              <span>{description}</span>
              <br />
              <strong>{alert}</strong>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onNegativeClick}>
            {negativeText}
          </Button>
          <Button type="button" onClick={onPositiveClick} autoFocus>
            {positiveText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmationDialog;
