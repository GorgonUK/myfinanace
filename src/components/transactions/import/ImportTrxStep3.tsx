import { ChevronsRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTE_TRX } from '../../../providers/RoutesProvider.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';

export type Props = {
  nrOfTrxImported: number;
  accountName: string;
};

const ImportTrxStep3 = (props: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const goToTransactions = () => {
    navigate(ROUTE_TRX);
  };

  return (
    <div className="mt-16 flex flex-col items-center justify-center">
      <h2 className="mb-4 text-lg font-bold">
        {t('importTransactions.step3Label')}
      </h2>
      <p className="text-base">
        {t('importTransactions.step3Text', {
          count: props.nrOfTrxImported,
          accountName: props.accountName,
        })}
      </p>
      <Button className="mt-4 w-fit gap-2" onClick={() => goToTransactions()}>
        {t('dashboard.seeTransactions')}
        <ChevronsRight className="size-5" />
      </Button>
    </div>
  );
};

export default ImportTrxStep3;
