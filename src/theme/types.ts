import type { CSSProperties } from 'react';
import type { Theme as NivoTheme } from '@nivo/theming';

export type AppPaletteMode = 'light' | 'dark';

/** Grey scale (Material-like keys) for legacy styling. */
export type GreyScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

export interface AppPalette {
  mode: AppPaletteMode;
  primary: {
    main: string;
    dark: string;
    light: string;
    contrastText: string;
  };
  secondary: {
    dark: string;
    main: string;
    light: string;
  };
  neutral: {
    dark: string;
    main: string;
    light: string;
  };
  background: {
    default: string;
    paper: string;
  };
  text: {
    primary: string;
    secondary: string;
    disabled?: string;
  };
  /** Border / subtle separators (MUI `palette.divider`). */
  divider: string;
  warning: { main: string; light: string };
  error: { main: string };
  success: { main: string };
  grey: GreyScale;
}

export interface AppTheme {
  palette: AppPalette;
  shape: { borderRadius: number };
  spacing: (multiplier: number) => string;
  breakpoints: {
    values: { xs: number; sm: number; md: number; lg: number; xl: number };
    down: (key: keyof AppTheme['breakpoints']['values']) => string;
  };
  typography: {
    overline: CSSProperties;
    button: CSSProperties;
  };
  nivo: NivoTheme;
  /** Box shadows — `elevation8` matches common MUI `theme.shadows[8]`. */
  shadows: { elevation8: string };
}
