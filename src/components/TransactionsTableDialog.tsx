import { Transaction, TransactionType } from '@/common/api/trx';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/common/shadcn/ui/dialog.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';
import {
  getDayNumberFromUnixTimestamp,
  getFullYearFromUnixTimestamp,
  getMonthShortStringFromUnixTimestamp,
} from '../utils/dateUtils.ts';
import { useGetTransactionsForCategoryInMonth } from '@/hooks/trx';
import { useEffect, useState } from 'react';
import { useLoading } from '../providers/LoadingProvider.tsx';
import { AlertSeverity, useSnackbar } from '../providers/SnackbarProvider.tsx';
import { useFormatNumberAsCurrency } from '../utils/textHooks.ts';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  categoryId: bigint;
  type: TransactionType;
  month: number;
  year: number;
};

function TransactionsTableDialog(props: Props) {
  const { t } = useTranslation();
  const loader = useLoading();
  const snackbar = useSnackbar();
  const [trxList, setTrxList] = useState<Transaction[]>([]);
  const formatNumberAsCurrency = useFormatNumberAsCurrency();
  const getTransactionsForCategoryInMonthRequest =
    useGetTransactionsForCategoryInMonth({
      month: props.month,
      year: props.year,
      cat_id: props.categoryId,
      type: props.type,
    });

  const headers = [
    t('common.date'),
    t('common.description'),
    t('common.account'),
    t('common.amount'),
  ];

  useEffect(() => {
    if (getTransactionsForCategoryInMonthRequest.isFetching) {
      loader.showLoading();
    } else {
      loader.hideLoading();
    }
  }, [getTransactionsForCategoryInMonthRequest.isFetching]);

  useEffect(() => {
    if (getTransactionsForCategoryInMonthRequest.isError) {
      snackbar.showSnackbar(
        t('common.somethingWentWrongTryAgain'),
        AlertSeverity.ERROR,
      );
    }
  }, [getTransactionsForCategoryInMonthRequest.isError]);

  useEffect(() => {
    if (getTransactionsForCategoryInMonthRequest.data) {
      setTrxList(getTransactionsForCategoryInMonthRequest.data);
    }
  }, [getTransactionsForCategoryInMonthRequest.data]);

  if (!getTransactionsForCategoryInMonthRequest.data) {
    return null;
  }

  const handleOnClose = () => {
    setTrxList([]);
    props.onClose();
  };

  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={(open) => !open && handleOnClose()}
    >
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
        </DialogHeader>
        <div className="rounded-md border">
          <table className="w-full min-h-[300px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {headers.map((item: string) => (
                  <th
                    key={encodeURI(item)}
                    className="px-3 py-2 text-left font-medium"
                  >
                    {item}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trxList.map((item: Transaction) => (
                <tr
                  key={encodeURI(item.transaction_id + '')}
                  className="border-b last:border-0"
                >
                  <td className="px-3 py-2 align-top">
                    {`${getDayNumberFromUnixTimestamp(item.date_timestamp || 0)}/${getMonthShortStringFromUnixTimestamp(item.date_timestamp || 0)}/${getFullYearFromUnixTimestamp(item.date_timestamp || 0)}`}
                  </td>
                  <td className="px-3 py-2 align-top">{item.description}</td>
                  <td className="px-3 py-2 align-top">
                    {item.account_from_name
                      ? item.account_from_name
                      : item.account_to_name}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {formatNumberAsCurrency.invoke(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleOnClose}>
            {t('common.goBack')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TransactionsTableDialog;
