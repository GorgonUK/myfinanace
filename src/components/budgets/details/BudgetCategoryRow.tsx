import { memo, useCallback, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { NumberFormatValues, NumericFormat } from 'react-number-format';
import { cssGradients } from '../../../utils/gradientUtils.ts';
import { BudgetCategory } from '@/common/api/budget';
import { ColorGradient } from '@/config';
import { getMonthsFullName } from '../../../utils/dateUtils.ts';
import { useFormatNumberAsCurrency } from '../../../utils/textHooks.ts';
import { formatNumberAsCurrency } from '../../../utils/textUtils.ts';
import CurrencyIcon from '../../../components/CurrencyIcon.tsx';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/common/shadcn/ui/card.tsx';
import { Badge } from '@/common/shadcn/ui/badge.tsx';
import { Separator } from '@/common/shadcn/ui/separator.tsx';
import { Input } from '@/common/shadcn/ui/input.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
import {
  Tooltip,
  TooltipContent as TooltipPopoverContent,
  TooltipTrigger,
} from '@/common/shadcn/ui/tooltip.tsx';
import { cn } from '@/common/shadcn/lib/utils';

type Props = {
  isOpen: boolean;
  month: number;
  year: number;
  isDebit: boolean;
  category: BudgetCategory;
  onCategoryClick: (category: BudgetCategory, isDebit: boolean) => void;
  onInputChange: (input: number) => void;
};

interface TooltipContentProps {
  category: BudgetCategory;
  isDebit: boolean;
  t: (key: string) => string;
  month: number;
  year: number;
}

const CategoryTooltipBody = memo(
  ({ category, isDebit, t, month, year }: TooltipContentProps) => {
    const formatNumberAsCurrency = useFormatNumberAsCurrency();
    return (
      <>
        <div className="mx-auto max-w-7xl px-4">
          <p className="mt-2 text-center text-sm">
            <strong>
              <em>{category.description || '-'}</em>
            </strong>
          </p>
          {category.exclude_from_budgets === 1 && (
            <Badge variant="secondary" className="mt-2 flex w-fit">
              {t('categories.excludedFromBudgets')}
            </Badge>
          )}
        </div>
        <Separator className="my-4" />
        <div className="mb-1 grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <p className="text-xs text-muted-foreground">
              {getMonthsFullName(month)} {year - 1}
            </p>
          </div>
          <div className="col-span-6 text-right">
            <Badge variant="secondary" className="text-xs font-normal">
              {formatNumberAsCurrency.invoke(
                isDebit
                  ? category.avg_same_month_previous_year_debit
                  : category.avg_same_month_previous_year_credit,
              )}
            </Badge>
          </div>
        </div>
        <div className="mb-1 grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <p className="text-xs text-muted-foreground">
              {t('budgetDetails.previousMonth')}
            </p>
          </div>
          <div className="col-span-6 text-right">
            <Badge variant="secondary" className="text-xs font-normal">
              {formatNumberAsCurrency.invoke(
                isDebit
                  ? category.avg_previous_month_debit
                  : category.avg_previous_month_credit,
              )}
            </Badge>
          </div>
        </div>
        <div className="mb-1 grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <p className="text-xs text-muted-foreground">
              {t('budgetDetails.12MonthAvg')}
            </p>
          </div>
          <div className="col-span-6 text-right">
            <Badge variant="secondary" className="text-xs font-normal">
              {formatNumberAsCurrency.invoke(
                isDebit
                  ? category.avg_12_months_debit
                  : category.avg_12_months_credit,
              )}
            </Badge>
          </div>
        </div>
        <div className="mb-1 grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <p className="text-xs text-muted-foreground">
              {t('budgetDetails.globalAverage')}
            </p>
          </div>
          <div className="col-span-6 text-right">
            <Badge variant="secondary" className="text-xs font-normal">
              {formatNumberAsCurrency.invoke(
                isDebit
                  ? category.avg_lifetime_debit
                  : category.avg_lifetime_credit,
              )}
            </Badge>
          </div>
        </div>
        <Card className="mt-2 w-full">
          <CardContent className="flex justify-center pt-4">
            <TooltipBottomCard category={category} isDebit={isDebit} />
          </CardContent>
        </Card>
      </>
    );
  },
);
CategoryTooltipBody.displayName = 'CategoryTooltipBody';

const TooltipBottomCard = ({
  category,
  isDebit,
}: {
  category: BudgetCategory;
  isDebit: boolean;
}) => {
  const { t } = useTranslation();
  let diff = 0;
  let textKey = '';
  if (isDebit) {
    diff =
      Number(category.current_amount_debit + '') -
      Number(category.planned_amount_debit + '');
    switch (true) {
      case diff > 0:
        textKey = 'budgetDetails.catRemainderDebitOver';
        break;
      case diff < 0:
        textKey = 'budgetDetails.catRemainderDebitUnder';
        break;
      default:
        textKey = t('budgetDetails.catRemainderDebitEqual', {
          amount: formatNumberAsCurrency(diff),
        });
        break;
    }
  } else {
    diff =
      Number(category.current_amount_credit + '') -
      Number(category.planned_amount_credit + '');
    switch (true) {
      case diff > 0:
        textKey = 'budgetDetails.catRemainderCreditOver';
        break;
      case diff < 0:
        textKey = 'budgetDetails.catRemainderCreditUnder';
        break;
      default:
        textKey = 'budgetDetails.catRemainderCreditEqual';
        break;
    }
  }

  let background = '';
  switch (true) {
    case isDebit && diff < 0:
    case !isDebit && diff > 0:
      background = cssGradients[ColorGradient.Green];
      break;
    case isDebit && diff > 0:
    case !isDebit && diff < 0:
      background = cssGradients[ColorGradient.Red];
      break;
    default:
      background = cssGradients[ColorGradient.Orange];
      break;
  }

  return (
    <div
      className="mx-auto max-w-7xl p-4 text-sm"
      style={{ background }}
    >
      <Trans
        i18nKey={textKey}
        values={{
          amount: formatNumberAsCurrency(Math.abs(diff)),
        }}
      />
    </div>
  );
};

function CategoryProgressBar({
  value,
  variant,
}: {
  value: number;
  variant: 'debit' | 'credit';
}) {
  const barBg =
    variant === 'debit'
      ? cssGradients[ColorGradient.Red]
      : cssGradients[ColorGradient.Green];
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: barBg,
        }}
      />
    </div>
  );
}

function getCurrentCategoryValuePercentage(
  category: BudgetCategory,
  isDebit: boolean,
) {
  if (isDebit)
    return Math.min(
      Math.ceil(
        (category.current_amount_debit * 100) / category.planned_amount_debit,
      ),
      100,
    );
  return Math.min(
    Math.ceil(
      (category.current_amount_credit * 100) / category.planned_amount_credit,
    ),
    100,
  );
}

const BudgetCategoryRow = memo(function BudgetCategoryRow({
  isOpen,
  isDebit,
  month,
  year,
  category,
  onCategoryClick,
  onInputChange,
}: Props) {
  const { t } = useTranslation();

  const renderCategoryTooltip = useMemo(
    () => (
      <CategoryTooltipBody
        category={category}
        isDebit={isDebit}
        month={month}
        year={year}
        t={t}
      />
    ),
    [category, isDebit, month, year, t],
  );

  const handleCategoryClick = useCallback(() => {
    onCategoryClick(category, isDebit);
  }, [category, isDebit, onCategoryClick]);

  const handleInputChange = useCallback(
    (values: NumberFormatValues) => {
      const { floatValue } = values;
      onInputChange(floatValue ?? 0);
    },
    [onInputChange],
  );

  const pct = getCurrentCategoryValuePercentage(category, isDebit);

  return (
    <Card className="w-full py-2">
      <CardContent className="grid grid-cols-12 gap-4 p-4 pt-4">
        <div className="col-span-12 md:col-span-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="w-full cursor-pointer text-left text-base font-medium"
                onClick={handleCategoryClick}
              >
                {category.name}
              </button>
            </TooltipTrigger>
            <TooltipPopoverContent
              side="right"
              className="max-w-sm border bg-popover p-3 text-popover-foreground"
            >
              {renderCategoryTooltip}
            </TooltipPopoverContent>
          </Tooltip>
        </div>
        <div className="col-span-12 md:col-span-4">
          <Label htmlFor={`est-${category.category_id}-${isDebit ? 'd' : 'c'}`}>
            {t('budgetDetails.estimated')}
          </Label>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <CurrencyIcon />
            </span>
            <NumericFormat
              required
              disabled={!isOpen}
              onValueChange={handleInputChange}
              decimalScale={2}
              fixedDecimalScale
              thousandSeparator
              value={
                isDebit
                  ? category.planned_amount_debit
                  : category.planned_amount_credit
              }
              onFocus={(event) => {
                event.target.select();
              }}
              customInput={Input}
              className={cn('pl-10')}
              id={`est-${category.category_id}-${isDebit ? 'd' : 'c'}`}
            />
          </div>
        </div>
        <div className="col-span-12 md:col-span-4">
          <Label htmlFor={`cur-${category.category_id}-${isDebit ? 'd' : 'c'}`}>
            {t('budgetDetails.current')}
          </Label>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <CurrencyIcon />
            </span>
            <NumericFormat
              required
              disabled
              decimalScale={2}
              fixedDecimalScale
              thousandSeparator
              value={
                isDebit
                  ? category.current_amount_debit
                  : category.current_amount_credit
              }
              customInput={Input}
              className={cn('pl-10')}
              id={`cur-${category.category_id}-${isDebit ? 'd' : 'c'}`}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-0">
        <div className="w-full flex-1 space-y-2">
          {isDebit ? (
            <CategoryProgressBar value={pct} variant="debit" />
          ) : (
            <CategoryProgressBar value={pct} variant="credit" />
          )}
        </div>
      </CardFooter>
    </Card>
  );
});

export default BudgetCategoryRow;
