import MyFinLineChart from '../../../components/MyFinLineChart.tsx';
import { ProjectionStatsItem } from '@/hooks/stats';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/common/shadcn/ui/checkbox.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';

type Props = {
  list: ProjectionStatsItem[];
};

const ProjectionsChart = (props: Props) => {
  const { t } = useTranslation();
  const [ignoreDebt, setIgnoreDebt] = useState(false);

  const chartData = useMemo(() => {
    return [
      {
        id: 'projected_balance',
        data: props.list.map((item) => ({
          x: `${item.month}/${item.year}`,
          y: ignoreDebt ? item.finalBalanceAssets : item.finalBalance,
        })),
      },
    ];
  }, [props.list, ignoreDebt]);

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <Checkbox
            id="ignore-debt"
            checked={ignoreDebt}
            onCheckedChange={(c) => setIgnoreDebt(c === true)}
          />
          <Label htmlFor="ignore-debt" className="cursor-pointer font-normal">
            {t('stats.ignoreDebt')}
          </Label>
        </div>
      </div>
      <div className="h-[420px]">
        <MyFinLineChart chartData={chartData} />
      </div>
    </div>
  );
};

export default ProjectionsChart;
