import { Button } from '@/common/shadcn/ui/button';
import { Input } from '@/common/shadcn/ui/input';
import { Label } from '@/common/shadcn/ui/label';
import { CirclePlus, Copy, Search } from 'lucide-react';
import type { ChangeEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/PageHeader';

type Props = {
  debouncedSearch: (value: string) => void;
  onAddTransaction: () => void;
  onImportTransactions: () => void;
  table: ReactNode;
};

export function TransactionsToolbar({
  debouncedSearch,
  onAddTransaction,
  onImportTransactions,
  table,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t('transactions.transactions')}
        subtitle={t('transactions.strapLine')}
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Button type="button" onClick={onAddTransaction}>
            <CirclePlus className="mr-2 size-4" aria-hidden />
            {t('transactions.addTransactionCTA')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onImportTransactions}
          >
            <Copy className="mr-2 size-4" aria-hidden />
            {t('transactions.importTransactionCTA')}
          </Button>
        </div>
        <div className="w-full min-w-[200px] lg:max-w-md lg:ml-auto">
          <Label htmlFor="search" className="sr-only">
            {t('common.search')}
          </Label>
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              id="search"
              className="pr-8"
              placeholder={t('common.search')}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                debouncedSearch(event.target.value);
              }}
            />
          </div>
        </div>
      </div>
      <div className="w-full min-w-0">{table}</div>
    </div>
  );
}
