import { useTranslation } from 'react-i18next';
import { useEffect, useReducer } from 'react';
import { useLoading } from '../../../providers/LoadingProvider.tsx';
import {
  AlertSeverity,
  useSnackbar,
} from '../../../providers/SnackbarProvider.tsx';
import { useGetInvestStats } from '@/hooks/invest';
import {
  AssetType,
  GetInvestStatsResponse,
  InvestAsset,
  MonthlySnapshot,
} from '@/common/api/invest';
import { Separator } from '@/common/shadcn/ui/separator.tsx';
import DashboardPieChart, {
  ChartDataItem,
} from '../../dashboard/DashboardPieChart.tsx';
import {
  useGetGradientColorForAssetType,
  useGetLocalizedAssetType,
} from '../InvestUtilHooks.ts';
import { ColorGradient } from '@/config';
import EmptyView from '../../../components/EmptyView.tsx';
import {
  formatNumberAsCurrency,
  formatNumberAsPercentage,
} from '../../../utils/textUtils.ts';
import AssetRoiList from './AssetRoiList.tsx';
import CombinedRoiByYearList, {
  CombinedRoiByYearData,
} from './CombinedRoiByYearList.tsx';
import PortfolioEvolutionChart from './PortfolioEvolutionChart.tsx';

type UiState = {
  isLoading: boolean;
  distributionByAssetClassData?: ChartDataItem[];
  distributionByAssetData?: ChartDataItem[];
  assets?: InvestAsset[];
  combinedRoiByYearData?: CombinedRoiByYearData[];
  monthlySnapshots?: MonthlySnapshot[];
};

const enum StateActionType {
  DataLoaded,
}

type StateAction = {
  type: StateActionType.DataLoaded;
  payload: {
    data: GetInvestStatsResponse;
    getLocalizedAssetName: (assetType: AssetType) => string;
    getGradientColorForAssetType: (assetType: AssetType) => ColorGradient;
  };
};

const createInitialState = (): UiState => {
  return {
    isLoading: true,
  };
};

const reduceState = (prevState: UiState, action: StateAction): UiState => {
  switch (action.type) {
    case StateActionType.DataLoaded: {
      const assetClassChartData =
        action.payload.data.current_value_distribution
          .filter((item) => item.percentage > 0)
          .map((item) => {
            return {
              id: action.payload.getLocalizedAssetName(item.type as AssetType),
              color: action.payload.getGradientColorForAssetType(
                item.type as AssetType,
              ),
              value: item.percentage,
              altValue: formatNumberAsCurrency(item.value),
            };
          });

      const assetChartData = action.payload.data.top_performing_assets.map(
        (item) => {
          return {
            id: item.name,
            value:
              (item.current_value / action.payload.data.total_current_value) *
              100,
            color: '',
            altValue: formatNumberAsCurrency(item.current_value),
          };
        },
      );

      const combinedRoiByYear = Object.entries(
        action.payload.data.combined_roi_by_year,
      ).map(([year, data]) => ({
        year: parseInt(year),
        ...data,
      }));
      return {
        ...prevState,
        isLoading: false,
        distributionByAssetClassData: assetClassChartData,
        distributionByAssetData: assetChartData,
        assets: action.payload.data.top_performing_assets,
        combinedRoiByYearData: combinedRoiByYear,
        monthlySnapshots: action.payload.data.monthly_snapshots,
      };
    }
  }
};

const InvestStats = () => {
  const loader = useLoading();
  const snackbar = useSnackbar();
  const { t } = useTranslation();

  const getLocalizedAssetTypeText = useGetLocalizedAssetType();
  const getGradientColorForAssetClass = useGetGradientColorForAssetType();

  const getInvestStatsRequest = useGetInvestStats();
  const [state, dispatch] = useReducer(reduceState, null, createInitialState);

  // Loading
  useEffect(() => {
    if (state.isLoading) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [state.isLoading]);

  // Error
  useEffect(() => {
    if (getInvestStatsRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [getInvestStatsRequest.isError]);

  // Success
  useEffect(() => {
    if (!getInvestStatsRequest.data) return;
    dispatch({
      type: StateActionType.DataLoaded,
      payload: {
        data: getInvestStatsRequest.data,
        getLocalizedAssetName: getLocalizedAssetTypeText.invoke,
        getGradientColorForAssetType: getGradientColorForAssetClass.invoke,
      },
    });
  }, [getInvestStatsRequest.data]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <SectionHeader title={t('investments.distribution')} />
      <div className="col-span-12 min-h-[10px] md:col-span-6">
        {state.distributionByAssetClassData &&
        state.distributionByAssetClassData.length > 0 ? (
          <DashboardPieChart
            data={state.distributionByAssetClassData ?? []}
            customPieProps={{
              valueFormat: (value) => formatNumberAsPercentage(value),
              margin: { top: 65, right: 65, bottom: 65, left: 65 },
            }}
          />
        ) : (
          <EmptyView />
        )}
        <p className="mt-2 block text-center text-base font-medium">
          {t('investments.assetClasses')}
        </p>
      </div>
      <div className="col-span-12 min-h-[100px] md:col-span-6">
        {state.distributionByAssetData &&
        state.distributionByAssetData.length > 0 ? (
          <DashboardPieChart
            data={state.distributionByAssetData ?? []}
            customPieProps={{
              valueFormat: (value) => formatNumberAsPercentage(value),
              margin: { top: 65, right: 65, bottom: 65, left: 65 },
            }}
          />
        ) : (
          <EmptyView />
        )}
        <p className="mt-2 block text-center text-base font-medium">
          {t('investments.asset')}
        </p>
      </div>
      <SectionHeader title={t('investments.returnsByAsset')} />
      <div className="col-span-12">
        <AssetRoiList list={state?.assets ?? []} />
      </div>
      <SectionHeader title={t('investments.returnsByAssetClass')} />
      <div className="col-span-12">
        <i>{t('common.soon')}...</i>
      </div>
      <SectionHeader title={t('investments.combinedPerformanceByYear')} />
      <div className="col-span-12">
        <CombinedRoiByYearList list={state?.combinedRoiByYearData ?? []} />
      </div>
      <SectionHeader title={t('investments.portfolioEvolution')} />
      <div className="col-span-12 h-[300px]">
        <PortfolioEvolutionChart data={state?.monthlySnapshots ?? []} />
      </div>
    </div>
  );
};

const SectionHeader = ({ title }: { title: string }) => {
  return (
    <div className="col-span-12 mt-2">
      <h2 className="text-lg font-bold">{title}</h2>
      <Separator className="mt-2" />
    </div>
  );
};

export default InvestStats;
