import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAppTheme } from '@/theme';
import { LineSvgProps, ResponsiveLine } from '@nivo/line';
import { useMemo } from 'react';
import { useFormatNumberAsCurrency } from '../utils/textHooks.ts';
import EmptyView from './EmptyView.tsx';

type ChartDataItem = {
  id: string;
  data: {
    x: string | number;
    y: number;
  }[];
};

type Props = {
  chartData: ChartDataItem[];
  customLineProps?: Partial<LineSvgProps<never>>;
};

const MyFinLineChart = (props: Props) => {
  const theme = useAppTheme();
  const matchesMdScreen = useMediaQuery('(max-width: 900px)');
  const formatNumberAsCurrency = useFormatNumberAsCurrency();

  const sanitizedData = useMemo(() => {
    return props.chartData.map((series) => ({
      ...series,
      data: series.data.map((point) => ({
        ...point,
        y:
          typeof point.y === 'number' && Number.isFinite(point.y) ? point.y : 0,
      })),
    }));
  }, [props.chartData]);

  const hasPoints = sanitizedData.some((s) => s.data.length > 0);
  if (!hasPoints) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center">
        <EmptyView />
      </div>
    );
  }

  return (
    <ResponsiveLine
      data={sanitizedData as unknown as readonly never[]}
      margin={{ top: 5, right: 5, bottom: 50, left: 50 }}
      xScale={{ type: 'point' }}
      yScale={{
        type: 'linear',
        min: 'auto',
        max: 'auto',
        stacked: false,
        reverse: false,
      }}
      yFormat=" >-.2f"
      axisTop={null}
      axisRight={null}
      axisLeft={!matchesMdScreen ? {} : null}
      axisBottom={
        !matchesMdScreen
          ? {
              tickSize: 2,
              tickPadding: 3,
              tickRotation: -55,
              legendPosition: 'middle',
              truncateTickAt: 40,
            }
          : null
      }
      pointSize={5}
      enableArea={true}
      areaOpacity={0.1}
      pointColor={{ theme: 'background' }}
      pointBorderWidth={2}
      pointBorderColor={{ from: 'serieColor' }}
      pointLabel="data.yFormatted"
      pointLabelYOffset={-12}
      enableTouchCrosshair={true}
      useMesh={true}
      colors={() => theme.palette.primary.main}
      tooltip={(item) => (
        <div className="w-max bg-popover p-2 text-xs text-popover-foreground shadow-md">
          <div>
            {/*@ts-expect-error type error from nivo (?)*/}
            {String(item.point.data.x)}
            <br />
            <strong>
              {/*@ts-expect-error type error from nivo (?)*/}
              {formatNumberAsCurrency.invoke(Number(item.point.data.y))}
            </strong>
          </div>
        </div>
      )}
      theme={theme.nivo}
      {...props.customLineProps}
    />
  );
};

export default MyFinLineChart;
