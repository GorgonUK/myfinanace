import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import PageHeader from '@/components/PageHeader.tsx';
import ImportTrxStep0 from './ImportTrxStep0.tsx';
import ImportTrxStep1, { ImportTrxStep1Result } from './ImportTrxStep1.tsx';
import ImportTrxStep2, { ImportTrxStep2Result } from './ImportTrxStep2.tsx';
import ImportTrxStep3 from './ImportTrxStep3.tsx';
import { Card } from '@/common/shadcn/ui/card.tsx';
import { cn } from '@/common/shadcn/lib/utils';

const ImportTransactions = () => {
  const { t } = useTranslation();

  const steps = [
    t('importTransactions.step0Label'),
    t('importTransactions.step1Label'),
    t('importTransactions.step2Label'),
    t('importTransactions.step3Label'),
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [completed, _setCompleted] = useState<{
    [k: number]: boolean;
  }>({});
  const [clipboardText, setClipboardText] = useState('');
  const [step1Result, setStep1Result] = useState<ImportTrxStep1Result | null>(
    null,
  );
  const [step2Result, setStep2Result] = useState<ImportTrxStep2Result | null>(
    null,
  );
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <ImportTrxStep0
            onNext={(clipboardText: string) => {
              setClipboardText(clipboardText);
              setCurrentStep(1);
            }}
          />
        );
      case 1:
        return (
          <ImportTrxStep1
            clipboardText={clipboardText}
            onNext={(result) => {
              setStep1Result(result);
              setCurrentStep(2);
            }}
          />
        );
      case 2:
        if (step1Result) {
          return (
            <ImportTrxStep2
              data={step1Result}
              onNext={(result) => {
                setStep2Result({
                  nrOfTrxImported: result.nrOfTrxImported,
                  accountName: result.accountName,
                });
                setCurrentStep(3);
              }}
            />
          );
        }
        break;
      case 3:
        return (
          <ImportTrxStep3
            nrOfTrxImported={step2Result?.nrOfTrxImported || 0}
            accountName={step2Result?.accountName || ''}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card className="m-4 border bg-card p-4 shadow-sm">
      <div className="flex flex-col justify-between">
        <PageHeader
          title={t('importTransactions.importTransactions')}
          subtitle={t('importTransactions.strapLine')}
        />
      </div>
      <div className="mb-4 mt-2 flex flex-wrap items-center gap-2 border-b pb-4">
        {steps.map((label, index) => (
          <div key={label} className="flex items-center gap-2">
            <button
              type="button"
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium',
                index === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : completed[index]
                    ? 'bg-muted text-muted-foreground'
                    : 'border border-border bg-background text-muted-foreground',
              )}
              onClick={() => {}}
              disabled
            >
              {index + 1}
            </button>
            <span
              className={cn(
                'text-sm',
                index === currentStep ? 'font-semibold' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
            {index < steps.length - 1 ? (
              <span className="mx-1 text-muted-foreground" aria-hidden>
                /
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mb-4">{renderStepContent(currentStep)}</div>
    </Card>
  );
};

export default ImportTransactions;
