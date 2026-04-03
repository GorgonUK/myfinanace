import { Coffee } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EmptyView = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[200px] flex-1 flex-col items-center justify-center gap-2 py-8">
      <Coffee className="size-8 text-muted-foreground" />
      <p className="text-muted-foreground text-base">{t('common.tableInfoEmpty')}</p>
    </div>
  );
};

export default EmptyView;
