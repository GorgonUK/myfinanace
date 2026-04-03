import type { ReactNode } from 'react';

/** Section label above dashboard panels (replaces MUI styled Typography). */
export function PanelTitle({ children }: { children: ReactNode }) {
  return (
    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
      {children}
    </p>
  );
}
