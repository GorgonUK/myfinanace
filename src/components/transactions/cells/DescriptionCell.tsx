import { Badge } from '@/common/shadcn/ui/badge.tsx';
import type { MyFinRenderCellParams } from '@/components/dashboard/Table/Types';
import { useTranslation } from 'react-i18next';
import { Tag } from '@/common/api/trx';
import type { TransactionGridRow } from '../types';

export function TransactionDescriptionCell({
  params,
}: {
  params: MyFinRenderCellParams;
}) {
  const { t } = useTranslation();
  const v = params.value as TransactionGridRow['description'];
  if (!v) return null;

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="flex flex-row items-center">
        {v.description ?? t('common.externalAccount')}
      </div>
      {v.tags.length > 0 ? (
        <ul className="m-0 flex list-none flex-row flex-wrap justify-start p-1">
          {v.tags.map((data: Tag) => (
            <li key={data.tag_id} className="w-auto p-1">
              <Badge variant="outline" className="text-primary">
                {data.name}
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
