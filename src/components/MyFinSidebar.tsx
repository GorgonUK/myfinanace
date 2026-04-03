import { useState } from 'react';
import { Menu, MenuItem, Sidebar, SubMenu } from 'react-pro-sidebar';
import { NavLink } from 'react-router-dom';
import {
  Bookmark,
  Building2,
  CreditCard,
  Donut,
  FolderOpen,
  LayoutDashboard,
  Lightbulb,
  LineChart,
  Menu as MenuIcon,
  SlidersHorizontal,
  Tag,
  Target,
  Wallet,
} from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAppTheme } from '@/theme';
import { colorAlpha } from '@/utils/colorAlpha';
import { useTranslation } from 'react-i18next';
import {
  ROUTE_ACCOUNTS,
  ROUTE_BUDGETS,
  ROUTE_CATEGORIES,
  ROUTE_DASHBOARD,
  ROUTE_ENTITIES,
  ROUTE_GOALS,
  ROUTE_INVEST,
  ROUTE_RULES,
  ROUTE_STATS,
  ROUTE_TAGS,
  ROUTE_TRX,
} from '../providers/RoutesProvider';

const MyFinSidebar = () => {
  const theme = useAppTheme();
  const matchesMdScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [isCollapsed, setCollapsed] = useState(matchesMdScreen);
  const { t } = useTranslation();

  function toggleSidebarCollapse() {
    setCollapsed(!isCollapsed);
  }

  return (
    <div>
      <Sidebar
        style={{ height: '100vh', top: 0, border: 0 }}
        backgroundColor={theme.palette.background.paper}
        collapsed={isCollapsed}
      >
        <Menu
          menuItemStyles={{
            button: {
              // the active class will be added automatically by react router
              // so we can use it to style the active menu item
              backgroundColor: theme.palette.background.paper,
              [`&.active`]: {
                backgroundColor: theme.palette.background.default,
              },
              '&:hover': {
                backgroundColor: colorAlpha(theme.palette.background.default, 0.3),
              },
            },
            subMenuContent: {
              backgroundColor: 'inherit',
              '&:hover': {
                backgroundColor: colorAlpha(theme.palette.background.default, 1.0),
              },
            },
          }}
        >
          <MenuItem
            icon={<MenuIcon className="size-5" strokeWidth={1.75} />}
            onClick={() => {
              toggleSidebarCollapse();
            }}
            style={{ textAlign: 'left', marginBottom: 10, marginTop: 20 }}
          >
            {' '}
            <img
              src={
                theme.palette.mode === 'dark'
                  ? '/res/logo_light_plain_transparentbg.png'
                  : '/res/logo_dark_transparentbg.png'
              }
              alt={t('sidebar.logoAlt')}
              style={{ width: '70%' }}
            />
          </MenuItem>
          <MenuItem
            icon={<LayoutDashboard className="size-5" strokeWidth={1.75} />}
            component={<NavLink to={ROUTE_DASHBOARD} />}
            style={{ marginTop: 35 }}
          >
            {' '}
            {t('sidebar.dashboard')}
          </MenuItem>
          <MenuItem
            icon={<CreditCard className="size-5" strokeWidth={1.75} />}
            component={<NavLink to={ROUTE_TRX} />}
          >
            {' '}
            {t('sidebar.transactions')}
          </MenuItem>
          <MenuItem
            icon={<Bookmark className="size-5" strokeWidth={1.75} />}
            component={<NavLink to={ROUTE_BUDGETS} />}
          >
            {' '}
            {t('sidebar.budgets')}
          </MenuItem>
          <MenuItem
            icon={<Wallet className="size-5" strokeWidth={1.75} />}
            component={<NavLink to={ROUTE_ACCOUNTS} />}
          >
            {' '}
            {t('sidebar.accounts')}
          </MenuItem>
          <MenuItem
            icon={<Donut className="size-5" strokeWidth={1.75} />}
            component={<NavLink to={ROUTE_INVEST} />}
          >
            {' '}
            {t('sidebar.investments')}
          </MenuItem>
          <MenuItem
            icon={<Target className="size-5" strokeWidth={1.75} />}
            component={<NavLink to={ROUTE_GOALS} />}
          >
            {' '}
            {t('sidebar.goals')}
          </MenuItem>
          <SubMenu
            label={t('sidebar.meta')}
            icon={<SlidersHorizontal className="size-5" strokeWidth={1.75} />}
          >
            <MenuItem
              icon={<FolderOpen className="size-5" strokeWidth={1.75} />}
              component={<NavLink to={ROUTE_CATEGORIES} />}
            >
              {' '}
              {t('sidebar.categories')}
            </MenuItem>
            <MenuItem
              icon={<Building2 className="size-5" strokeWidth={1.75} />}
              component={<NavLink to={ROUTE_ENTITIES} />}
            >
              {' '}
              {t('sidebar.entities')}
            </MenuItem>
            <MenuItem
              icon={<Tag className="size-5" strokeWidth={1.75} />}
              component={<NavLink to={ROUTE_TAGS} />}
            >
              {' '}
              {t('sidebar.tags')}
            </MenuItem>
            <MenuItem
              icon={<Lightbulb className="size-5" strokeWidth={1.75} />}
              component={<NavLink to={ROUTE_RULES} />}
            >
              {' '}
              {t('sidebar.rules')}
            </MenuItem>
          </SubMenu>
          <MenuItem
            icon={<LineChart className="size-5" strokeWidth={1.75} />}
            component={<NavLink to={ROUTE_STATS} />}
          >
            {' '}
            {t('sidebar.statistics')}
          </MenuItem>
          {/*<Divider />*/}
        </Menu>
      </Sidebar>
    </div>
  );
};

export default MyFinSidebar;
