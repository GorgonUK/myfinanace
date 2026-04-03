import { ChevronsRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  AlertSeverity,
  useSnackbar,
} from '../../../providers/SnackbarProvider.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';

export type Props = {
  onNext: (clipboardText: string) => void;
};

const ImportTrxStep0 = (props: Props) => {
  const { t } = useTranslation();
  const snackbar = useSnackbar();

  const copyFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const permissionStatus = await navigator.permissions.query({
              name: 'clipboard-read' as PermissionName,
            });

            if (
              permissionStatus.state === 'granted' ||
              permissionStatus.state === 'prompt'
            ) {
              const text = await navigator.clipboard.readText();
              props.onNext(text);
              return;
            } else {
              snackbar.showSnackbar(
                t('transactions.clipboardPermissionMessage'),
                AlertSeverity.WARNING,
              );
            }
          } catch (permissionError) {
            console.warn(
              'Clipboard permission query not supported',
              permissionError,
            );
          }
        }

        try {
          const text = await navigator.clipboard.readText();
          props.onNext(text);
          return;
        } catch (clipboardError) {
          console.warn('Clipboard reading failed', clipboardError);
        }
      }

      const textArea = document.createElement('textarea');
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      document.execCommand('paste');
      const text = textArea.value;
      document.body.removeChild(textArea);
      props.onNext(text);
    } catch (error) {
      console.error('Failed to copy:', error);
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  };

  return (
    <div className="mt-16 flex flex-col items-center justify-center">
      <h2 className="mb-4 text-lg font-bold">
        {t('importTransactions.step0Title')}
      </h2>
      <p className="px-4 text-center text-base">
        {t('importTransactions.step0Text')}
      </p>
      <Button className="mt-4 w-fit gap-2" onClick={() => copyFromClipboard()}>
        {t('transactions.continueImport')}
        <ChevronsRight className="size-5" />
      </Button>
    </div>
  );
};

export default ImportTrxStep0;
