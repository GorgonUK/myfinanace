import { useGetTopSummaryValues } from '@/hooks/user';
import { useTranslation } from 'react-i18next';
import { useFormatNumberAsCurrency } from '../utils/textHooks.ts';

const TopSummary = () => {
  const { operatingFundsSum, investingSum, debtSum, netWorthSum } =
    useGetTopSummaryValues();
  const { t } = useTranslation();
  const formatNumberAsCurrency = useFormatNumberAsCurrency();

  return (
    <div className="hidden flex-row gap-4 md:flex">
      <div className="flex flex-col gap-0.5">
        <TopSummaryLabel value={t('topBar.operatingFunds')} />
        <TopSummaryAmount
          value={formatNumberAsCurrency.invoke(operatingFundsSum)}
        />
      </div>
      <div className="flex flex-col gap-0.5">
        <TopSummaryLabel value={t('topBar.investing')} />
        <TopSummaryAmount value={formatNumberAsCurrency.invoke(investingSum)} />
      </div>
      <div className="flex flex-col gap-0.5">
        <TopSummaryLabel value={t('topBar.debt')} />
        <TopSummaryAmount value={formatNumberAsCurrency.invoke(debtSum)} />
      </div>
      <div className="flex flex-col gap-0.5">
        <TopSummaryLabel value={t('topBar.netWorth')} />
        <TopSummaryAmount value={formatNumberAsCurrency.invoke(netWorthSum)} />
      </div>
    </div>
  );
};

type TopSummaryLabelValueProps = {
  value: string;
};

const TopSummaryLabel = (props: TopSummaryLabelValueProps) => {
  return <span className="text-muted-foreground text-xs">{props.value}</span>;
};

const TopSummaryAmount = (props: TopSummaryLabelValueProps) => {
  return (
    <div className="bg-card inline-flex w-fit rounded-lg border border-border">
      <span className="p-2 text-xs">{props.value}</span>
    </div>
  );
};

export default TopSummary;
