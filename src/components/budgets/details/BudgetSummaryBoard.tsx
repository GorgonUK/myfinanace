import { cssGradients } from '../../../utils/gradientUtils.ts';
import { ColorGradient } from '@/config';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/common/shadcn/ui/badge.tsx';
import { useFormatNumberAsCurrency } from '../../../utils/textHooks.ts';

type Props = {
  isOpen: boolean;
  initialBalance: number;
  calculatedBalances: {
    plannedBalance: number;
    currentBalance: number;
    plannedIncome: number;
    plannedExpenses: number;
    currentIncome: number;
    currentExpenses: number;
  };
};

const TopSummaryLabelValue = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <h2 className="text-lg font-semibold text-white">{label}</h2>
      <Badge
        variant="secondary"
        className="border-white/30 bg-white/10 text-base text-white hover:bg-white/20"
      >
        {value}
      </Badge>
    </div>
  );
};

const BudgetSummaryBoard = (props: Props) => {
  const { t } = useTranslation();
  const formatNumberAsCurrency = useFormatNumberAsCurrency();

  return (
    <div
      className="w-full rounded-lg p-8 shadow-md"
      style={{ background: cssGradients[ColorGradient.Blue] }}
    >
      <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3 md:justify-between">
        <div className="flex flex-col gap-8">
          <TopSummaryLabelValue
            label={t(
              props.isOpen
                ? 'budgetDetails.estimatedExpenses'
                : 'budgetDetails.actualExpenses',
            )}
            value={formatNumberAsCurrency.invoke(
              props.isOpen
                ? props.calculatedBalances.plannedExpenses
                : props.calculatedBalances.currentExpenses,
            )}
          />
          <TopSummaryLabelValue
            label={t('budgetDetails.initialBalance')}
            value={formatNumberAsCurrency.invoke(props.initialBalance)}
          />
        </div>
        <div className="flex flex-col gap-8">
          <TopSummaryLabelValue
            label={t(
              props.isOpen
                ? 'budgetDetails.estimatedBalance'
                : 'budgetDetails.actualBalance',
            )}
            value={formatNumberAsCurrency.invoke(
              props.isOpen
                ? props.calculatedBalances.plannedBalance
                : props.calculatedBalances.currentBalance,
            )}
          />
          <TopSummaryLabelValue
            label={t('budgetDetails.status')}
            value={t(
              props.isOpen ? 'budgetDetails.opened' : 'budgetDetails.closed',
            )}
          />
        </div>
        <div className="flex flex-col gap-8">
          <TopSummaryLabelValue
            label={t(
              props.isOpen
                ? 'budgetDetails.estimatedIncome'
                : 'budgetDetails.actualIncome',
            )}
            value={formatNumberAsCurrency.invoke(
              props.isOpen
                ? props.calculatedBalances.plannedIncome
                : props.calculatedBalances.currentIncome,
            )}
          />
          <TopSummaryLabelValue
            label={t('budgetDetails.finalBalance')}
            value={formatNumberAsCurrency.invoke(
              props.initialBalance +
                (props.isOpen
                  ? props.calculatedBalances.plannedBalance
                  : props.calculatedBalances.currentBalance),
            )}
          />
        </div>
      </div>
    </div>
  );
};
export default BudgetSummaryBoard;
