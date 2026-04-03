import {
  createContext,
  type ReactNode,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from 'react';
import localStore from '@/common/data/localStore.ts';
import { AppThemeProvider } from '@/theme/ThemeContext.tsx';
import { generateGlobalTheme } from '@/theme/theme.ts';
import type { AppPaletteMode } from '@/theme/types.ts';
import { LoadingProvider } from './LoadingProvider.tsx';
import { SnackbarProvider } from './SnackbarProvider.tsx';
import { useTranslation } from 'react-i18next';
import { en, pt } from 'yup-locales';
import { setLocale as setYupLocale } from 'yup';
import dayjs from 'dayjs';
import 'dayjs/locale/pt.js';
import 'dayjs/locale/en.js';
import { UserContextProvider } from './UserProvider.tsx';
import { Loader2 } from 'lucide-react';

interface ColorModeContextType {
  toggleColorMode: () => void;
  setColorMode: (mode: AppPaletteMode) => void;
}
export const ColorModeContext = createContext({} as ColorModeContextType);

const MyFinThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<AppPaletteMode>(localStore.getUiMode());
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
        localStore.toggleUiMode();
      },
      setColorMode: (next: AppPaletteMode) => {
        setMode(next);
        localStore.setUiMode(next);
      },
    }),
    [],
  );

  const theme = useMemo(() => generateGlobalTheme(mode), [mode]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  const { i18n } = useTranslation();

  function setAppLocale(language: string) {
    switch (language) {
      case 'pt':
        setYupLocale(pt);
        dayjs.locale('pt');
        break;
      default:
        setYupLocale(en);
        dayjs.locale('en');
        break;
    }
  }

  useEffect(() => {
    const handleLanguageChange = () => {
      setAppLocale(i18n.language);
    };

    setAppLocale(i18n.language);
    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <AppThemeProvider theme={theme}>
        <UserContextProvider>
          <Suspense
            fallback={
              <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2
                  className="text-muted-foreground size-8 animate-spin"
                  aria-hidden
                />
              </div>
            }
          >
            <LoadingProvider>
              <SnackbarProvider>{children}</SnackbarProvider>
            </LoadingProvider>
          </Suspense>
        </UserContextProvider>
      </AppThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default MyFinThemeProvider;
