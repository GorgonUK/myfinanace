import { useTranslation } from 'react-i18next';
import { ChevronsRight } from 'lucide-react';
import { Button } from '@/common/shadcn/ui/button.tsx';

export type Props = {
  onNext: () => void;
};

const SetupStep3 = (props: Props) => {
  const { t } = useTranslation();

  return (
    <div className="p-1">
      <div className="flex flex-col gap-4">
        <p className="text-base">{t('setup.step3Description')}</p>

        <div className="mt-4 flex justify-center">
          <Button
            size="lg"
            className="gap-2"
            onClick={() => props.onNext()}
          >
            {t('login.signIn')}
            <ChevronsRight className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SetupStep3;
