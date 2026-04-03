import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import PrivateRoute from '@/components/PrivateRoute.tsx';
import {
  AccountsPage,
  BudgetDetailsPage,
  BudgetListPage,
  CategoriesPage,
  DashboardPage,
  EntitiesPage,
  GoalsPage,
  ImportTransactionsPage,
  InvestPage,
  InvestTab,
  LoginPage,
  ProfilePage,
  RecoverPasswordPage,
  RulesPage,
  SetupPage,
  StatsPage,
  StatTab,
  TagsPage,
  TransactionsPage,
} from '@/pages/index.ts';

export const ROUTE_AUTH = '/auth';
export const ROUTE_RECOVER_PASSWORD = '/recover-password';
export const ROUTE_DASHBOARD = '/dashboard';
export const ROUTE_PROFILE = '/profile';
export const ROUTE_TRX = '/transactions';
export const ROUTE_BUDGETS = '/budgets';
export const ROUTE_BUDGET_DETAILS = '/budget/:id';
export const ROUTE_BUDGET_NEW = '/budget/new';
export const ROUTE_ACCOUNTS = '/accounts';
export const ROUTE_CATEGORIES = '/categories';
export const ROUTE_ENTITIES = '/entities';
export const ROUTE_TAGS = '/tags';
export const ROUTE_IMPORT_TRX = '/transactions/import';
export const ROUTE_RULES = '/rules';
export const ROUTE_INVEST = '/invest';
export const ROUTE_INVEST_DASHBOARD = '/invest/dashboard';
export const ROUTE_INVEST_ASSETS = '/invest/assets';
export const ROUTE_INVEST_TRANSACTIONS = '/invest/transactions';
export const ROUTE_INVEST_STATS = '/invest/stats';
export const ROUTE_STATS = '/stats';
export const ROUTE_STATS_PATRIMONY_EVO = '/stats/patrimony';
export const ROUTE_STATS_PROJECTIONS = '/stats/projections';
export const ROUTE_STATS_EXPENSES = '/stats/expenses';
export const ROUTE_STATS_INCOME = '/stats/income';
export const ROUTE_STATS_YEAR_BY_YEAR = '/stats/year-by-year';
export const ROUTE_GOALS = '/goals';
export const ROUTE_SETUP = '/setup';

const RoutesProvider = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path={ROUTE_AUTH} element={<LoginPage />} />
        <Route
          path={ROUTE_RECOVER_PASSWORD}
          element={<RecoverPasswordPage />}
        />
        <Route path={ROUTE_SETUP} element={<SetupPage />} />
        <Route element={<PrivateRoute />}>
          <Route path={ROUTE_DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTE_PROFILE} element={<ProfilePage />} />
          <Route path={ROUTE_TRX} element={<TransactionsPage />} />
          <Route path={ROUTE_BUDGETS} element={<BudgetListPage />} />
          <Route path={ROUTE_BUDGET_DETAILS} element={<BudgetDetailsPage />} />
          <Route path={ROUTE_BUDGET_NEW} element={<BudgetDetailsPage />} />
          <Route path={ROUTE_ACCOUNTS} element={<AccountsPage />} />
          <Route path={ROUTE_CATEGORIES} element={<CategoriesPage />} />
          <Route path={ROUTE_ENTITIES} element={<EntitiesPage />} />
          <Route path={ROUTE_TAGS} element={<TagsPage />} />
          <Route path={ROUTE_IMPORT_TRX} element={<ImportTransactionsPage />} />
          <Route path={ROUTE_RULES} element={<RulesPage />} />
          <Route path={ROUTE_GOALS} element={<GoalsPage />} />
          <Route path={ROUTE_INVEST} element={<InvestPage />} />
          <Route
            path={ROUTE_INVEST_DASHBOARD}
            element={<InvestPage defaultTab={InvestTab.Summary} />}
          />
          <Route
            path={ROUTE_INVEST_ASSETS}
            element={<InvestPage defaultTab={InvestTab.Assets} />}
          />
          <Route
            path={ROUTE_INVEST_TRANSACTIONS}
            element={<InvestPage defaultTab={InvestTab.Transactions} />}
          />
          <Route
            path={ROUTE_INVEST_STATS}
            element={<InvestPage defaultTab={InvestTab.Reports} />}
          />
          <Route path={ROUTE_STATS} element={<StatsPage />} />
          <Route
            path={ROUTE_STATS_PATRIMONY_EVO}
            element={<StatsPage defaultTab={StatTab.PatrimonyEvolution} />}
          />
          <Route
            path={ROUTE_STATS_PROJECTIONS}
            element={<StatsPage defaultTab={StatTab.Projections} />}
          />
          <Route
            path={ROUTE_STATS_EXPENSES}
            element={<StatsPage defaultTab={StatTab.Expenses} />}
          />
          <Route
            path={ROUTE_STATS_INCOME}
            element={<StatsPage defaultTab={StatTab.Income} />}
          />
          <Route
            path={ROUTE_STATS_YEAR_BY_YEAR}
            element={<StatsPage defaultTab={StatTab.YearByYear} />}
          />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default RoutesProvider;
