import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/common/data/react-query.ts';
import { TooltipProvider } from '@/common/shadcn/ui/tooltip.tsx';
import MyFinThemeProvider from './providers/MyFinThemeProvider.tsx';
import RoutesProvider from './providers/RoutesProvider.tsx';
import './i18n.ts';

function App() {
  return (
    <MyFinThemeProvider>
      <TooltipProvider delayDuration={300}>
      <QueryClientProvider client={queryClient}>
        <RoutesProvider />
        {import.meta.env.DEV ? (
          <ReactQueryDevtools initialIsOpen={false} />
        ) : null}
      </QueryClientProvider>
      </TooltipProvider>
    </MyFinThemeProvider>
  );
}

export default App;
