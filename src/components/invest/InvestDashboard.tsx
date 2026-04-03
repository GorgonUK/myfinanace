import { useEffect, useReducer } from 'react';
import { useLoading } from '../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../providers/SnackbarProvider.tsx';
import { useTranslation } from 'react-i18next';
import { useGetInvestStats } from '@/hooks/invest';
import {
  AssetType,
  GetInvestStatsResponse,
  InvestAsset,
} from '@/common/api/invest';
import {
  formatNumberAsCurrency,
  formatNumberAsPercentage,
} from '../../utils/textUtils.ts';
import { getCurrentYear } from '../../utils/dateUtils.ts';
import DashboardPieChart, {
  ChartDataItem,
} from '../dashboard/DashboardPieChart.tsx';
import EmptyView from '../../components/EmptyView.tsx';
import { TFunction } from 'i18next';
import { ColorGradient } from '@/config';
import { useGetGradientColorForAssetType } from './InvestUtilHooks.ts';
import PercentageChip from '../../components/PercentageChip.tsx';
import { useFormatNumberAsCurrency } from '../../utils/textHooks.ts';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Card, CardContent } from '@/common/shadcn/ui/card.tsx';
import { Badge } from '@/common/shadcn/ui/badge.tsx';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/common/shadcn/ui/tooltip.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { CircleHelp } from 'lucide-react';
import { cn } from '@/common/shadcn/lib/utils';

type UiState = {
  currentValue: number;
  totalInvestedFormatted: string;
  currentValueFormatted: string;
  currentYearRoiValueFormatted: string;
  currentYearRoiPercentageFormatted: string;
  currentYearRoiPercentageValue: number;
  globalRoiValueFormatted: string;
  globalRoiPercentageFormatted: string;
  globalRoiPercentageValue: number;
  assetDistributionPieChartData?: ChartDataItem[];
  topPerformingAssets?: InvestAsset[];
} | null;

const enum StateActionType {
  DataLoaded,
}

type StateAction = {
  type: StateActionType.DataLoaded;
  payload: GetInvestStatsResponse & {
    t: TFunction<'translation', undefined>;
  } & { getGradientColorForAssetType: (assetType: AssetType) => ColorGradient };
};

const createInitialState = (): UiState => {
  return null;
};

const TopPerformerCard = (props: {
  isExpanded: boolean;
  index: number;
  assetType: string;
  assetName: string;
  percentage: number;
  value: number;
}) => {
  const { t } = useTranslation();
  const formatNumberAsCurrency = useFormatNumberAsCurrency();

  return (
    <Card
      className={cn(
        'transition-shadow hover:shadow-lg',
        props.index === 1 && 'rounded-t-lg',
        props.index === 3 && 'rounded-b-lg',
        props.isExpanded
          ? 'bg-background dark:bg-card'
          : 'bg-card',
      )}
    >
      <CardContent>
        <div className="flex justify-between rounded-none">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">
              {`#${props.index} | ${props.assetType} ${
                props.isExpanded
                  ? ''
                  : `| ${t('investments.percentageOfPortfolio', {
                      percentage: formatNumberAsPercentage(props.percentage),
                    })}`
              }`}
            </p>
            <p
              className={cn(
                'font-semibold',
                props.isExpanded ? 'text-2xl' : 'text-lg',
              )}
            >
              {props.assetName}
            </p>
            {props.isExpanded && (
              <p className="text-sm text-muted-foreground">
                {t('investments.percentageOfPortfolio', {
                  percentage: formatNumberAsPercentage(props.percentage),
                })}
              </p>
            )}
          </div>
          <div className="flex items-center">
            <Badge
              variant="outline"
              className={cn(
                props.value < 0
                  ? 'border-amber-500 text-amber-800 dark:text-amber-200'
                  : 'border-green-600 text-green-800 dark:text-green-200',
              )}
            >
              {formatNumberAsCurrency.invoke(props.value)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SummaryCard = (props: {
  title: string;
  absoluteValue: string;
  percentageValue?: number;
  helpKey?: string;
  helpAriaLabel?: string;
}) => {
  return (
    <Card className="h-[120px] bg-background dark:bg-card">
      <CardContent className="flex h-full flex-col justify-between p-4">
        <div className="flex items-center justify-center gap-1">
          <p className="text-sm text-muted-foreground">{props.title}</p>
          {props.helpKey ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground opacity-70"
                  aria-label={props.helpAriaLabel}
                >
                  <CircleHelp className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{props.helpKey}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <p className="text-2xl font-semibold">{props.absoluteValue}</p>
          {props.percentageValue ? (
            <PercentageChip
              percentage={Number(props.percentageValue)}
              className="mt-1 self-center"
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

const getLocalizedTextForAssetType = (
  t: TFunction<'translation', undefined>,
  key: AssetType,
): string => {
  switch (key) {
    case AssetType.Etf:
      return t('investments.etf');
    case AssetType.Crypto:
      return t('investments.crypto');
    case AssetType.InvestmentFunds:
      return t('investments.investmentFunds');
    case AssetType.Ppr:
      return t('investments.ppr');
    case AssetType.FixedIncome:
      return t('investments.fixedIncome');
    case AssetType.Stocks:
      return t('investments.stocks');
    case AssetType.IndexFunds:
      return t('investments.indexFunds');
    case AssetType.P2pLoans:
      return t('investments.p2pLoans');
    default:
      return '';
  }
};

const reduceState = (prevState: UiState, action: StateAction): UiState => {
  switch (action.type) {
    case StateActionType.DataLoaded: {
      const chartData = action.payload.current_value_distribution
        .filter((item) => item.percentage > 0)
        .map((item) => {
          return {
            id: getLocalizedTextForAssetType(
              action.payload.t,
              item.type as AssetType,
            ),
            color: action.payload.getGradientColorForAssetType(
              item.type as AssetType,
            ),
            value: item.percentage,
          };
        });

      return {
        ...prevState,
        currentValue: action.payload.total_current_value,
        totalInvestedFormatted: formatNumberAsCurrency(
          action.payload.total_currently_invested_value,
        ),
        currentValueFormatted: formatNumberAsCurrency(
          action.payload.total_current_value,
        ),
        currentYearRoiValueFormatted: formatNumberAsCurrency(
          action.payload.current_year_roi_value,
        ),
        currentYearRoiPercentageFormatted: formatNumberAsPercentage(
          action.payload.current_year_roi_percentage,
          true,
        ),
        currentYearRoiPercentageValue:
          action.payload.current_year_roi_percentage,
        globalRoiValueFormatted: formatNumberAsCurrency(
          action.payload.global_roi_value,
        ),
        globalRoiPercentageFormatted: formatNumberAsPercentage(
          action.payload.global_roi_percentage,
          true,
        ),
        globalRoiPercentageValue: action.payload.global_roi_percentage,
        assetDistributionPieChartData: chartData,
        topPerformingAssets: action.payload.top_performing_assets,
      };
    }
  }
};

const InvestDashboard = () => {
  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();
  const matchesLgScreen = useMediaQuery('(max-width: 1199px)');

  const getInvestStatsRequest = useGetInvestStats();
  const getGradientColorForAssetClass = useGetGradientColorForAssetType();

  const [state, dispatch] = useReducer(reduceState, t, createInitialState);

  useEffect(() => {
    if (getInvestStatsRequest.isFetching) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [getInvestStatsRequest.isFetching]);

  useEffect(() => {
    if (getInvestStatsRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [getInvestStatsRequest.isError]);

  useEffect(() => {
    if (!getInvestStatsRequest.data) return;
    dispatch({
      type: StateActionType.DataLoaded,
      payload: {
        ...getInvestStatsRequest.data,
        t,
        ...{
          getGradientColorForAssetType: getGradientColorForAssetClass.invoke,
        },
      },
    });
  }, [getInvestStatsRequest.data]);

  if (!state) return null;

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-5">
          {state.assetDistributionPieChartData &&
          state.assetDistributionPieChartData.length > 0 ? (
            <DashboardPieChart
              data={state.assetDistributionPieChartData}
              linkLabelTruncateLimit={10}
              customPieProps={{
                enableArcLabels: false,
                enableArcLinkLabels: !matchesLgScreen,
                margin: matchesLgScreen
                  ? { top: 10, right: 10, bottom: 10, left: 10 }
                  : { top: 50, right: 120, bottom: 50, left: 120 },
                valueFormat: (value) => formatNumberAsPercentage(value),
              }}
            />
          ) : (
            <EmptyView />
          )}
        </div>
        <div className="col-span-12 sm:col-span-7">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('investments.topPerformers')}
          </p>
          {[0, 1, 2].map(
            (index) =>
              state.topPerformingAssets?.[index] && (
                <TopPerformerCard
                  key={index}
                  isExpanded={index == 0}
                  index={index + 1}
                  assetType={getLocalizedTextForAssetType(
                    t,
                    state.topPerformingAssets[index].type,
                  )}
                  assetName={state.topPerformingAssets[index].name}
                  percentage={
                    (state.topPerformingAssets[index].current_value /
                      state.currentValue) *
                    100
                  }
                  value={state.topPerformingAssets[index].absolute_roi_value}
                />
              ),
          )}
        </div>
      </div>
      <div className="col-span-12 grid grid-cols-12 gap-4 text-center">
        <div className="col-span-12 sm:col-span-3">
          <SummaryCard
            title={t('investments.totalInvested')}
            absoluteValue={state.totalInvestedFormatted}
            helpKey={t('investments.summaryHelp.totalInvested')}
            helpAriaLabel={t('investments.summaryHelp.totalInvestedAriaLabel')}
          />
        </div>
        <div className="col-span-12 sm:col-span-3">
          <SummaryCard
            title={t('investments.currentValue')}
            absoluteValue={state.currentValueFormatted}
            helpKey={t('investments.summaryHelp.currentValue')}
            helpAriaLabel={t('investments.summaryHelp.currentValueAriaLabel')}
          />
        </div>
        <div className="col-span-12 sm:col-span-3">
          <SummaryCard
            title={`ROI ${getCurrentYear()}`}
            absoluteValue={state.currentYearRoiValueFormatted}
            percentageValue={state.currentYearRoiPercentageValue}
            helpKey={t('investments.summaryHelp.currentYearROI')}
            helpAriaLabel={t('investments.summaryHelp.currentYearROIAriaLabel')}
          />
        </div>
        <div className="col-span-12 sm:col-span-3">
          <SummaryCard
            title={t('investments.globalROI')}
            absoluteValue={state.globalRoiValueFormatted}
            percentageValue={state.globalRoiPercentageValue}
            helpKey={t('investments.summaryHelp.globalROI')}
            helpAriaLabel={t('investments.summaryHelp.globalROIAriaLabel')}
          />
        </div>
      </div>
    </div>
  );
};

export default InvestDashboard;
