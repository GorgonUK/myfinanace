import { useEffect, useState } from 'react';

/**
 * MatchMedia hook (replaces MUI `useMediaQuery`).
 * Pass the same query string as `theme.breakpoints.down('md')` from `useAppTheme()`.
 */
export function useMediaQuery(query: string): boolean {
  const getMatches = () =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false;

  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    const m = window.matchMedia(query);
    const listener = () => setMatches(m.matches);
    listener();
    m.addEventListener('change', listener);
    return () => m.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
