import { FolderOpen } from 'lucide-react';
import type { MyFinRenderCellParams } from '@/components/dashboard/Table/Types';
import { useTranslation } from 'react-i18next';

export function TransactionCategoryCell({
  params,
}: {
  params: MyFinRenderCellParams;
}) {
  const { t } = useTranslation();
  const name = params.value as string | null | undefined;

  return (
    <div className="flex flex-row items-center gap-2 p-2">
      <FolderOpen className="size-4 shrink-0 text-primary" />
      <span>{name ?? t('common.noCategory')}</span>
    </div>
  );
}
