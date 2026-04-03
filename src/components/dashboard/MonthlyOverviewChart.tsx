import { useAppTheme } from '@/theme';
import { ResponsivePie } from '@nivo/pie';
import {
  generateDefsForGradients,
  generateFillArrayForGradients,
} from '../../utils/nivoUtils.ts';
import { useMemo } from 'react';
import { ColorGradient } from '@/config';
import EmptyView from '../../components/EmptyView.tsx';
import { useFormatNumberAsCurrency } from '../../utils/textHooks.ts';

export interface ChartDataItem {
  id: string;
  type: string;
  value: number;
}

interface InternalChartDataItem extends ChartDataItem {
  color: string;
}

interface Props {
  data: ChartDataItem[];
}

function getColorGradientForCurrentAmount(
  currentAmount: number,
  remainingAmount: number,
): ColorGradient {
  const percentage =
    (currentAmount / (currentAmount + remainingAmount)) * 100;
  if (percentage < 75) return ColorGradient.LightGreen;
  if (percentage < 90) return ColorGradient.Orange;

  return ColorGradient.Red;
}

const MonthlyOverviewChart = ({ data }: Props) => {
  const theme = useAppTheme();
  const formatNumberAsCurrency = useFormatNumberAsCurrency();

  const chartData = useMemo((): InternalChartDataItem[] => {
    if (data.length === 0) return [];
    return data.map((item) => ({
      ...item,
      color:
        item.type == '1'
          ? ColorGradient.Dull
          : getColorGradientForCurrentAmount(
              item.value,
              data.findLast((di) => di.type == '1')?.value ?? 0,
            ),
    }));
  }, [data]);
  return (
    <div className="h-[240px] min-h-[160px] sm:h-[220px] md:h-[200px]">
      {chartData.length > 0 ? (
        <ResponsivePie
          data={chartData}
          margin={{ top: 20, right: 10, bottom: 20, left: 10 }}
          startAngle={-90}
          endAngle={90}
          innerRadius={0.5}
          padAngle={0.7}
          cornerRadius={3}
          arcLabelsTextColor={{
            from: 'color',
            modifiers: [['darker', 4]],
          }}
          activeOuterRadiusOffset={8}
          borderWidth={0}
          enableArcLinkLabels={false}
          arcLabel={'id'}
          valueFormat={(value) => formatNumberAsCurrency.invoke(value)}
          defs={generateDefsForGradients()}
          // @ts-expect-error could assume different structural identities
          fill={generateFillArrayForGradients()}
          arcLabelsSkipAngle={10}
          theme={theme.nivo}
          tooltip={(item) => (
            <div className="whitespace-nowrap bg-popover p-2 text-xs text-popover-foreground shadow-md">
              {item.datum.label}: <strong>{item.datum.formattedValue}</strong>
            </div>
          )}
        />
      ) : (
        <EmptyView />
      )}
    </div>
  );
};

export default MonthlyOverviewChart;
