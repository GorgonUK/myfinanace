import { CategoryExpensesIncomeEvolutionItem } from '@/common/api/stats';
import { ExpensesIncomeStatPeriod } from './ExpensesIncomeStats.tsx';
import { useMemo } from 'react';
import MyFinLineChart from '../../../components/MyFinLineChart.tsx';

type Props = {
  list: CategoryExpensesIncomeEvolutionItem[];
  period: ExpensesIncomeStatPeriod;
};

const ExpensesIncomeChart = (props: Props) => {
  const chartData = useMemo(() => {
    return [
      {
        id: 'value',
        data: props.list.toReversed().map((item) => ({
          x:
            props.period == ExpensesIncomeStatPeriod.Month
              ? `${item.month}/${item.year}`
              : item.year,
          y: item.value,
        })),
      },
    ];
  }, [props.list]);

  return (
    <div className="col-span-12 h-[420px]">
      <MyFinLineChart chartData={chartData} />
    </div>
  );
};

export default ExpensesIncomeChart;
