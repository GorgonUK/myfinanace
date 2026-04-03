import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import type { AppTheme } from './types.ts';

const ThemeContext = createContext<AppTheme | null>(null);

export function AppThemeProvider({
  theme,
  children,
}: {
  theme: AppTheme;
  children: ReactNode;
}) {
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme(): AppTheme {
  const t = useContext(ThemeContext);
  if (t == null) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }
  return t;
}
