import type { Theme as NivoTheme } from '@nivo/theming';
import { generateNivoTheme } from '@/utils/nivoUtils.ts';
import type { AppPalette, AppPaletteMode, AppTheme } from './types.ts';

const blue = {
  100: '#bbdefb',
  200: '#90caf9',
  300: '#64b5f6',
  400: '#42a5f5',
  500: '#2196f3',
};

const green = {
  200: '#a5d6a7',
  300: '#81c784',
  400: '#66bb6a',
  500: '#4caf50',
};

const grey: AppPalette['grey'] = {
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#eeeeee',
  300: '#e0e0e0',
  400: '#bdbdbd',
  500: '#9e9e9e',
  600: '#757575',
  700: '#616161',
  800: '#424242',
  900: '#212121',
};

const lightPalette: Omit<AppPalette, 'mode'> = {
  primary: {
    dark: blue[500],
    main: blue[400],
    light: blue[300],
    contrastText: '#ffffff',
  },
  secondary: {
    dark: green[400],
    main: green[300],
    light: green[200],
  },
  neutral: {
    dark: grey[700],
    main: grey[500],
    light: grey[100],
  },
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
  },
  text: {
    primary: '#0e141f',
    secondary: '#46505A',
    disabled: grey[500],
  },
  divider: 'rgba(14, 20, 31, 0.12)',
  warning: { main: '#ed6c02', light: '#ffb74d' },
  error: { main: '#ef5350' },
  success: { main: green[400] },
  grey,
};

const darkPalette: Omit<AppPalette, 'mode'> = {
  primary: {
    dark: blue[300],
    main: blue[200],
    light: blue[100],
    contrastText: '#1f2d3d',
  },
  secondary: {
    dark: green[500],
    main: green[400],
    light: green[200],
  },
  neutral: {
    dark: grey[700],
    main: grey[500],
    light: grey[100],
  },
  background: {
    default: '#1f2d3d',
    paper: '#253649',
  },
  text: {
    primary: grey[100],
    secondary: grey[400],
    disabled: grey[600],
  },
  divider: 'rgba(255, 255, 255, 0.12)',
  warning: { main: '#ffa726', light: '#ffcc80' },
  error: { main: '#ef5350' },
  success: { main: green[400] },
  grey,
};

const breakpointValues = { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } as const;

function spacing(multiplier: number): string {
  return `${8 * multiplier}px`;
}

/** Matches MUI default `breakpoints.down` max-width values. */
function breakpointDown(key: keyof typeof breakpointValues): string {
  const maxPx: Record<keyof typeof breakpointValues, number> = {
    xs: 444.95,
    sm: 599.95,
    md: 899.95,
    lg: 1199.95,
    xl: 1535.95,
  };
  return `(max-width:${maxPx[key]}px)`;
}

export function generateGlobalTheme(mode: AppPaletteMode): AppTheme {
  const base = mode === 'light' ? lightPalette : darkPalette;
  const palette: AppPalette = { mode, ...base };

  return {
    palette,
    shape: { borderRadius: 7 },
    spacing,
    breakpoints: {
      values: { ...breakpointValues },
      down: breakpointDown,
    },
    typography: {
      overline: {
        fontSize: '0.75rem',
        fontWeight: 400,
        letterSpacing: '0.08333em',
        textTransform: 'uppercase',
        lineHeight: 2.66,
        color: palette.text.secondary,
      },
      button: {
        fontWeight: 500,
        fontSize: '0.875rem',
        lineHeight: 1.75,
        letterSpacing: '0.02857em',
        textTransform: 'uppercase',
      },
    },
    nivo: generateNivoTheme(mode, palette) as NivoTheme,
    shadows: {
      elevation8:
        '0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)',
    },
  };
}
