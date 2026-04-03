import { useAppTheme } from '@/theme';
import { BarDatum, ResponsiveBar } from '@nivo/bar';
import { useTranslation } from 'react-i18next';
import { formatNumberAsCurrency } from '../../utils/textUtils.ts';
import {
  generateDefsForGradients,
  generateFillArrayForGradients,
} from '../../utils/nivoUtils.ts';
import { ColorGradient } from '@/config';
import { useMemo } from 'react';
import EmptyView from '../../components/EmptyView.tsx';

interface ChartDataItem {
  month: string;
  balance: number;
}

interface InternalChartDataItem extends ChartDataItem {
  color: string;
  actualBalance?: number;
}

interface Props {
  data: ChartDataItem[];
}

export type MonthByMonthChartDataItem = {
  month: string;
  balance: number;
};

const MonthlyOverviewChart = ({ data }: Props) => {
  const theme = useAppTheme();
  const { t } = useTranslation();

  const { showEmptyView, chartData, minValue, maxValue } = useMemo(() => {
    if (data.length === 0 || !data.some((d) => d.balance != 0)) {
      return {
        showEmptyView: true,
        chartData: [] as InternalChartDataItem[],
        minValue: 0,
        maxValue: 1,
      };
    }

    const absValues = data.map((d) => Math.abs(d.balance)).sort((a, b) => a - b);
    const mid = Math.floor(absValues.length / 2);
    const median =
      absValues.length % 2 === 0 && absValues.length > 0
        ? (absValues[mid - 1] + absValues[mid]) / 2
        : absValues[mid] || 0;
    const threshold = median * 5;

    const transformedData: InternalChartDataItem[] = data.map((item) => {
      const isCapped = Math.abs(item.balance) > threshold && threshold > 0;
      const displayValue = isCapped
        ? item.balance > 0
          ? threshold
          : -threshold
        : item.balance;

      return {
        month: item.month,
        balance: displayValue,
        actualBalance: isCapped ? item.balance : undefined,
        color: item.balance < 0 ? ColorGradient.Dull : ColorGradient.LightGreen,
      };
    });

    const displayValues = transformedData.map((d) => d.balance);
    const dataMin = Math.min(...displayValues);
    const dataMax = Math.max(...displayValues);
    const range = dataMax - dataMin;
    const padding =
      range === 0
        ? Math.max(Math.abs(dataMax) * 0.15, 1)
        : range * 0.15;

    return {
      showEmptyView: false,
      chartData: transformedData,
      minValue: dataMin < 0 ? dataMin - padding : 0,
      maxValue: dataMax + padding,
    };
  }, [data]);

  return (
    <>
      <div
        className={`h-[240px] min-h-[160px] sm:h-[220px] md:h-[200px] ${showEmptyView ? 'hidden' : 'block'}`}
      >
        <ResponsiveBar
          data={chartData as unknown as readonly BarDatum[]}
          keys={['balance']}
          indexBy="month"
          margin={{ top: 40, right: 0, bottom: 40, left: 0 }}
          valueScale={{ type: 'linear', min: minValue, max: maxValue }}
          indexScale={{ type: 'band', round: true }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: '',
            legendPosition: 'middle',
            legendOffset: 32,
            truncateTickAt: 0,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: '',
            legendPosition: 'middle',
            legendOffset: -40,
            truncateTickAt: 0,
          }}
          /*colors={getBarColor}*/
          label={(d) => {
            if (d.value === 0) return '';
            const actualBalance = (d.data as any).actualBalance;
            const isCapped = actualBalance !== undefined;
            const valueToShow = isCapped ? actualBalance : d.value;
            return formatNumberAsCurrency(valueToShow) + (isCapped ? '*' : '');
          }}
          labelTextColor={{
            from: 'color',
            modifiers: [['darker', 4]],
          }}
          labelSkipHeight={16}
          valueFormat={(value) => formatNumberAsCurrency(value)}
          markers={[
            {
              axis: 'y',
              value: 0,
              lineStyle: { stroke: theme.palette.divider, strokeWidth: 3 },
              legendOrientation: 'vertical',
            },
          ]}
          borderRadius={theme.shape.borderRadius as number}
          enableGridY={false}
          defs={generateDefsForGradients()}
          // @ts-expect-error could assume different structural identities
          fill={generateFillArrayForGradients()}
          theme={theme.nivo}
          tooltip={(item) => {
            const actualBalance = (item.data as any).actualBalance;
            const isCapped = actualBalance !== undefined;
            return (
              <div className="whitespace-nowrap bg-popover p-2 text-xs text-popover-foreground shadow-md">
                {isCapped ? (
                  <>
                    <strong>{formatNumberAsCurrency(actualBalance)}</strong>
                    <br />
                    <span className="text-[11px] italic text-muted-foreground">
                      {t('dashboard.chartValueAdjusted')}
                    </span>
                  </>
                ) : (
                  item.formattedValue
                )}
              </div>
            );
          }}
        />
      </div>
      <div
        className={`h-[240px] min-h-[160px] sm:h-[220px] md:h-[200px] ${showEmptyView ? 'flex items-center justify-center' : 'hidden'}`}
      >
        <EmptyView />
      </div>
    </>
  );
};

export default MonthlyOverviewChart;
