import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetInvestStats } from '@/hooks/invest';
import { Pencil } from 'lucide-react';
import { useFormatNumberAsCurrency } from '../../../utils/textHooks.ts';
import UpdateAssetValueDialog from './UpdateAssetValueDialog.tsx';
import { MonthlySnapshot } from '@/common/api/invest';
import MyFinStaticTable from '../../../components/MyFinStaticTable.tsx';
import type { MyFinColumnDef } from '@/components/dashboard/Table/Types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/common/shadcn/ui/sheet.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  assetId: bigint;
  assetName: string;
  highlightMonth?: number;
  highlightYear?: number;
};

type HistoryRow = MonthlySnapshot & { id: number };

const PAGE_SIZE = 10;

const AssetValueHistoryDrawer = ({
  isOpen,
  onClose,
  assetId,
  assetName,
  highlightMonth,
  highlightYear,
}: Props) => {
  const { t } = useTranslation();
  const formatCurrency = useFormatNumberAsCurrency();

  const { data: statsData, isFetching } = useGetInvestStats();

  const [editingSnapshot, setEditingSnapshot] = useState<MonthlySnapshot | null>(
    null,
  );
  const [paginationModel, setPaginationModel] = useState({
    pageSize: PAGE_SIZE,
    page: 0,
  });

  const { history, targetId, targetPage } = useMemo<{
    history: HistoryRow[];
    targetId: number | undefined;
    targetPage: number;
  }>(() => {
    if (!statsData?.monthly_snapshots) {
      return { history: [], targetId: undefined, targetPage: 0 };
    }

    const sortedHistory: HistoryRow[] = statsData.monthly_snapshots
      .filter((s) => s.asset_id === assetId)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      })
      .map((s, index: number) => ({
        ...s,
        id: index,
        highlight: s.month === highlightMonth && s.year === highlightYear,
      }));

    if (!highlightMonth || !highlightYear || sortedHistory.length === 0) {
      return { history: sortedHistory, targetId: undefined, targetPage: 0 };
    }

    const targetIndex = sortedHistory.findIndex(
      (s: HistoryRow) => s.month === highlightMonth && s.year === highlightYear,
    );

    if (targetIndex === -1) {
      return { history: sortedHistory, targetId: undefined, targetPage: 0 };
    }

    const page = Math.floor(targetIndex / PAGE_SIZE);
    return { history: sortedHistory, targetId: targetIndex, targetPage: page };
  }, [statsData, assetId, highlightMonth, highlightYear]);

  useEffect(() => {
    if (targetId !== undefined && paginationModel.page !== targetPage) {
      setPaginationModel((prev) => ({ ...prev, page: targetPage }));
    }
  }, [targetId, targetPage]);

  const handleEditClick = (snapshot: MonthlySnapshot) => {
    setEditingSnapshot(snapshot);
  };

  const handleEditClose = () => {
    setEditingSnapshot(null);
  };

  const columns: MyFinColumnDef[] = [
    {
      field: 'date',
      headerName: t('common.date'),
      flex: 1,
      renderCell: (params) => {
        const row = params.row as HistoryRow;
        return `${row.month}/${row.year}`;
      },
    },
    {
      field: 'value',
      headerName: t('common.value'),
      flex: 1,
      renderCell: (params) => {
        const row = params.row as HistoryRow;
        return formatCurrency.invoke(row.current_value);
      },
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      width: 70,
      renderCell: (params) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9"
          aria-label="edit"
          onClick={() =>
            handleEditClick(params.row as unknown as MonthlySnapshot)
          }
        >
          <Pencil className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-lg"
        >
          <SheetHeader className="space-y-0 text-left">
            <SheetTitle>{t('investments.valueHistory', { name: assetName })}</SheetTitle>
          </SheetHeader>
          <p className="text-muted-foreground text-sm">
            {t('investments.valueHistoryDescription')}
          </p>
          <MyFinStaticTable
            isRefetching={isFetching}
            rows={history}
            columns={columns}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            scrollToId={targetId}
          />
        </SheetContent>
      </Sheet>

      {editingSnapshot && (
        <UpdateAssetValueDialog
          isOpen={!!editingSnapshot}
          onSuccess={handleEditClose}
          onCanceled={handleEditClose}
          assetId={assetId}
          assetName={assetName}
          currentValue={editingSnapshot.current_value}
          month={editingSnapshot.month}
          year={editingSnapshot.year}
        />
      )}
    </>
  );
};

export default AssetValueHistoryDrawer;
