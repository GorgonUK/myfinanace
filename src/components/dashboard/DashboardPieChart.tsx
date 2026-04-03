import type { CSSProperties } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAppTheme } from '@/theme';
import { cn } from '@/common/shadcn/lib/utils';
import { PieSvgProps, ResponsivePie, DefaultRawDatum } from '@nivo/pie';
import {
  generateDefsForGradients,
  generateFillArrayForGradients,
} from '../../utils/nivoUtils.ts';

import { formatNumberAsCurrency } from '../../utils/textUtils.ts';
import EmptyView from '../../components/EmptyView.tsx';

export interface ChartDataItem {
  id: string;
  color: string;
  value: number;
  altValue?: string;
}

interface Props {
  data: ChartDataItem[];
  className?: string;
  style?: CSSProperties;
  customPieProps?: Partial<PieSvgProps<DefaultRawDatum>>;
  linkLabelTruncateLimit?: number;
}

const DashboardPieChart = ({
  data,
  className,
  style,
  customPieProps,
  linkLabelTruncateLimit,
}: Props) => {
  const theme = useAppTheme();
  const matchesMdScreen = useMediaQuery(theme.breakpoints.down('md'));

  const truncateFromMiddle = (
    fullStr = '',
    strLen: number = linkLabelTruncateLimit ?? 20,
    middleStr = '...',
  ) => {
    if (fullStr.length <= strLen) return fullStr;
    const midLen = middleStr.length;
    const charsToShow = strLen - midLen;
    const frontChars = Math.ceil(charsToShow / 2);
    const backChars = Math.floor(charsToShow / 2);
    return (
      fullStr.substring(0, frontChars) +
      middleStr +
      fullStr.substring(fullStr.length - backChars)
    );
  };

  interface CustomDatum extends DefaultRawDatum {
    altValue?: string;
  }

  return (
    <div
      className={cn(
        'h-[400px] md:h-[300px] lg:h-[400px]',
        className,
      )}
      style={style}
    >
      {data && data.length > 0 ? (
        <ResponsivePie<CustomDatum>
          data={data}
          margin={
            matchesMdScreen
              ? { top: 20, right: 20, bottom: 20, left: 20 }
              : { top: 60, right: 60, bottom: 60, left: 60 }
          }
          animate={true}
          innerRadius={0.5}
          padAngle={0.7}
          cornerRadius={3}
          activeOuterRadiusOffset={8}
          borderWidth={0}
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsThickness={2}
          enableArcLinkLabels={!matchesMdScreen}
          enableArcLabels={matchesMdScreen}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{
            from: 'color',
            modifiers: [['darker', 4]],
          }}
          valueFormat={(value) => formatNumberAsCurrency(value)}
          defs={generateDefsForGradients()}
          // @ts-expect-error could assume different structural identities
          fill={generateFillArrayForGradients()}
          arcLinkLabel={(e) => truncateFromMiddle(e.id + '')}
          tooltip={(item) => (
            <div
              className="rounded border bg-white text-xs text-black shadow-sm"
              style={{ padding: theme.spacing(1) }}
            >
              {item.datum.label}: <strong>{item.datum.formattedValue}</strong>{' '}
              {item.datum.data.altValue && `(${item.datum.data.altValue})`}
            </div>
          )}
          theme={theme.nivo}
          {...customPieProps}
        />
      ) : (
        <EmptyView />
      )}
    </div>
  );
};

export default DashboardPieChart;
