import { useAppTheme } from '@/theme';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader.tsx';
import SetupStep0 from './SetupStep0.tsx';
import SetupStep1 from './SetupStep1.tsx';
import SetupStep2 from './SetupStep2.tsx';
import SetupStep3 from './SetupStep3.tsx';
import { useNavigate } from 'react-router-dom';
import { ROUTE_AUTH } from '../../providers/RoutesProvider.tsx';
import { useAuthStatus } from '@/hooks/auth';
import { useLoading } from '../../providers/LoadingProvider.tsx';
import { CURRENCIES } from '@/config/Currency.ts';
import { Card } from '@/common/shadcn/ui/card.tsx';
import { cn } from '@/common/shadcn/lib/utils';

const Setup = () => {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const loader = useLoading();
  const navigate = useNavigate();
  const authStatus = useAuthStatus(true);
  const steps = [
    t('setup.step0Label'),
    t('setup.step1Label'),
    t('setup.step2Label'),
    t('setup.step3Label'),
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [completed, _setCompleted] = useState<{
    [k: number]: boolean;
  }>({});

  const [usernameValue, setUsername] = useState('');
  const [emailValue, setEmail] = useState('');
  const [currencyValue, setCurrency] = useState(CURRENCIES.EUR);

  const goToAuth = () => {
    navigate(ROUTE_AUTH);
  };

  useEffect(() => {
    if (!authStatus.isPending && !authStatus.needsSetup) {
      goToAuth();
    }
  }, [authStatus]);

  useEffect(() => {
    if (authStatus.isPending) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [authStatus.isPending]);

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <SetupStep0
            onNext={(currency) => {
              setCurrency(currency);
              setCurrentStep(1);
            }}
          />
        );
      case 1:
        return (
          <SetupStep1
            onNext={(username, email) => {
              setUsername(username);
              setEmail(email);
              setCurrentStep(2);
            }}
          />
        );
      case 2:
        return (
          <SetupStep2
            username={usernameValue}
            email={emailValue}
            currency={currencyValue}
            onNext={() => setCurrentStep(3)}
          />
        );
      case 3:
        return <SetupStep3 onNext={() => goToAuth()} />;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="mx-auto max-w-md px-4">
        <div className="mt-10 flex flex-col items-center justify-center p-6">
          <img
            src={
              theme.palette.mode === 'dark'
                ? '/res/logo_light_transparentbg.png'
                : '/res/logo_dark_transparentbg.png'
            }
            width="60%"
            className="mb-5"
            alt=""
          />
        </div>
      </div>
      <Card className="m-4 mt-0 border bg-card p-4 shadow-sm">
        <div className="flex flex-col justify-between">
          <PageHeader
            title={t('setup.welcome')}
            subtitle={t('setup.welcomeStrapline')}
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
    </div>
  );
};

export default Setup;
