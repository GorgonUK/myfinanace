import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader.tsx';
import { useTranslation } from 'react-i18next';
import InvestDashboard from './InvestDashboard.tsx';
import InvestAssets from './assets/InvestAssets.tsx';
import InvestTransactions from './transactions/InvestTransactions.tsx';
import InvestStats from './stats/InvestStats.tsx';
import {
  ROUTE_INVEST_ASSETS,
  ROUTE_INVEST_DASHBOARD,
  ROUTE_INVEST_STATS,
  ROUTE_INVEST_TRANSACTIONS,
} from '../../providers/RoutesProvider.tsx';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/common/shadcn/ui/alert.tsx';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/common/shadcn/ui/tabs.tsx';
import { Card } from '@/common/shadcn/ui/card.tsx';

export enum InvestTab {
  Summary = 0,
  Assets = 1,
  Transactions = 2,
  Reports = 3,
}

const Invest = ({ defaultTab }: { defaultTab?: InvestTab }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [selectedTab, setSelectedTab] = useState<InvestTab>(defaultTab || 0);

  useEffect(() => {
    switch (selectedTab) {
      case InvestTab.Assets:
        navigate(ROUTE_INVEST_ASSETS);
        break;
      case InvestTab.Transactions:
        navigate(ROUTE_INVEST_TRANSACTIONS);
        break;
      case InvestTab.Reports:
        navigate(ROUTE_INVEST_STATS);
        break;
      case InvestTab.Summary:
      default:
        navigate(ROUTE_INVEST_DASHBOARD);
        break;
    }
  }, [selectedTab]);

  const renderTabContent = () => {
    switch (selectedTab) {
      case InvestTab.Summary:
        return <InvestDashboard />;
      case InvestTab.Assets:
        return <InvestAssets />;
      case InvestTab.Transactions:
        return <InvestTransactions />;
      case InvestTab.Reports:
        return <InvestStats />;
      default:
        return null;
    }
  };

  return (
    <Card className="m-4 border bg-card p-4 shadow-sm">
      <div className="flex flex-col justify-between">
        <PageHeader
          title={t('investments.investments')}
          subtitle={t('investments.strapLine')}
          titleChipText={'Beta'}
        />
        <Alert className="mb-2 border">
          <AlertTitle>{t('investments.betaAlertTitle')}</AlertTitle>
          <AlertDescription>
            {t('investments.betaAlertIntro')}{' '}
            <a
              href="https://myfinbudget.com/goto/wiki-investments"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-4"
            >
              {t('investments.betaAlertDocText')}
            </a>{' '}
            {t('investments.betaAlertPostDoc')}{' '}
            <a
              href="https://myfinbudget.com/goto/gh-discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-4"
            >
              {t('investments.betaAlertContactText')}
            </a>
            .
          </AlertDescription>
        </Alert>
      </div>
      <div className="mt-2 grid grid-cols-12 gap-4">
        <div className="col-span-12">
          <Tabs
            value={String(selectedTab)}
            onValueChange={(v) => setSelectedTab(Number(v) as InvestTab)}
          >
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
              <TabsTrigger value={String(InvestTab.Summary)}>
                {t('investments.summary')}
              </TabsTrigger>
              <TabsTrigger value={String(InvestTab.Assets)}>
                {t('investments.assets')}
              </TabsTrigger>
              <TabsTrigger value={String(InvestTab.Transactions)}>
                {t('investments.transactions')}
              </TabsTrigger>
              <TabsTrigger value={String(InvestTab.Reports)}>
                {t('investments.reports')}
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

export default Invest;
