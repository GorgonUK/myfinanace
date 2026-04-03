import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  ROUTE_STATS_EXPENSES,
  ROUTE_STATS_INCOME,
  ROUTE_STATS_PATRIMONY_EVO,
  ROUTE_STATS_PROJECTIONS,
  ROUTE_STATS_YEAR_BY_YEAR,
} from '../../providers/RoutesProvider.tsx';
import PageHeader from '../../components/PageHeader.tsx';
import PatrimonyEvolutionStats from './patrimony/PatrimonyEvolutionStats.tsx';
import ProjectionsStats from './projections/ProjectionsStats.tsx';
import ExpensesIncomeStats, {
  TrxType,
} from './expensesIncome/ExpensesIncomeStats.tsx';
import YearByYearStats from './yearByYear/YearByYearStats.tsx';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/common/shadcn/ui/tabs.tsx';
import { Card } from '@/common/shadcn/ui/card.tsx';

export enum StatTab {
  PatrimonyEvolution = 0,
  Projections = 1,
  Expenses = 2,
  Income = 3,
  YearByYear = 4,
}

const Stats = ({ defaultTab }: { defaultTab?: StatTab }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [selectedTab, setSelectedTab] = useState<StatTab>(defaultTab || 0);

  useEffect(() => {
    switch (selectedTab) {
      case StatTab.Projections:
        navigate(ROUTE_STATS_PROJECTIONS);
        break;
      case StatTab.Expenses:
        navigate(ROUTE_STATS_EXPENSES);
        break;
      case StatTab.Income:
        navigate(ROUTE_STATS_INCOME);
        break;
      case StatTab.YearByYear:
        navigate(ROUTE_STATS_YEAR_BY_YEAR);
        break;
      case StatTab.PatrimonyEvolution:
      default:
        navigate(ROUTE_STATS_PATRIMONY_EVO);
        break;
    }
  }, [selectedTab]);

  const renderTabContent = () => {
    switch (selectedTab) {
      case StatTab.PatrimonyEvolution:
        return <PatrimonyEvolutionStats />;
      case StatTab.Projections:
        return <ProjectionsStats />;
      case StatTab.Expenses:
        return <ExpensesIncomeStats trxType={TrxType.Expenses} />;
      case StatTab.Income:
        return <ExpensesIncomeStats trxType={TrxType.Income} />;
      case StatTab.YearByYear:
        return <YearByYearStats />;
      default:
        return null;
    }
  };

  return (
    <Card className="m-4 border bg-card p-4 shadow-sm">
      <div className="flex flex-col justify-between">
        <PageHeader title={t('stats.stats')} subtitle={t('stats.strapLine')} />
      </div>
      <div className="mt-2 grid grid-cols-12 gap-4">
        <div className="col-span-12">
          <Tabs
            value={String(selectedTab)}
            onValueChange={(v) => setSelectedTab(Number(v) as StatTab)}
          >
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
              <TabsTrigger value={String(StatTab.PatrimonyEvolution)}>
                {t('stats.netWorthEvolution')}
              </TabsTrigger>
              <TabsTrigger value={String(StatTab.Projections)}>
                {t('stats.projections')}
              </TabsTrigger>
              <TabsTrigger value={String(StatTab.Expenses)}>
                {t('stats.expenses')}
              </TabsTrigger>
              <TabsTrigger value={String(StatTab.Income)}>
                {t('stats.income')}
              </TabsTrigger>
              <TabsTrigger value={String(StatTab.YearByYear)}>
                {t('stats.yearByYear')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value={String(selectedTab)} className="mt-6">
              {renderTabContent()}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Card>
  );
};

export default Stats;
