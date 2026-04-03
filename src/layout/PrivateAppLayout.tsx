import { CircleUser, LogOut, Moon, Sun } from 'lucide-react';
import { useAppTheme } from '@/theme';
import { useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import MyFinSidebar from '@/components/MyFinSidebar.tsx';
import TopSummary from '@/components/TopSummary.tsx';
import { useLogout } from '@/hooks/auth';
import { ColorModeContext } from '@/providers/MyFinThemeProvider.tsx';
import { ROUTE_PROFILE } from '@/providers/RoutesProvider.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';

const PrivateAppLayout = () => {
  const colorMode = useContext(ColorModeContext);
  const theme = useAppTheme();
  const logout = useLogout();
  const navigate = useNavigate();

  function toggleUiMode() {
    colorMode.toggleColorMode();
  }

  function goToProfile() {
    navigate(ROUTE_PROFILE);
  }

  function doLogout() {
    logout();
  }

  return (
    <div className="flex">
      <MyFinSidebar />
      <main
        className="h-screen w-screen overflow-y-auto overflow-x-hidden"
      >
        <header className="border-b bg-background">
          <div className="flex justify-between p-4">
            <div className="flex justify-start">
              <TopSummary />
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-10"
                aria-label="toggle ui"
                type="button"
                onClick={toggleUiMode}
              >
                {theme.palette.mode === 'dark' ? (
                  <Sun className="size-6" />
                ) : (
                  <Moon className="size-6" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-10"
                aria-label="profile"
                type="button"
                onClick={goToProfile}
              >
                <CircleUser className="size-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-10"
                aria-label="logout"
                type="button"
                onClick={doLogout}
              >
                <LogOut className="size-6" />
              </Button>
            </div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default PrivateAppLayout;
