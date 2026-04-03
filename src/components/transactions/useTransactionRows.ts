import { useMemo } from 'react';
import { Transaction } from '@/common/api/trx';
import {
  convertUnixTimestampToDateString,
} from '@/utils/dateUtils';
import { formatNumberAsCurrency } from '@/utils/textUtils';
import type { TransactionGridRow } from './types';
import { getChipColorForAmount } from './transactionGridHelpers';

type TrxListData = {
  results: Transaction[];
};

export function useTransactionRows(trxData: TrxListData | undefined) {
  return useMemo(() => {
    if (!trxData) return [];
    const seenDates = new Set<string>();

    return trxData.results.map((result: Transaction): TransactionGridRow => {
      const dateKey = convertUnixTimestampToDateString(
        result.date_timestamp || 0,
      );
      const isFirstOfDay = !seenDates.has(dateKey);
      if (isFirstOfDay) {
        seenDates.add(dateKey);
      }

      return {
        id: result.transaction_id,
        date: {
          date_timestamp: result.date_timestamp,
          essential: result.is_essential,
          first: isFirstOfDay,
        },
        flow: {
          acc_from_name: result.account_from_name,
          acc_to_name: result.account_to_name,
        },
        description: {
          description: result.description,
          tags: result.tags ?? [],
        },
        category: result.category_name,
        entity: result.entity_name,
        value: {
          amount: formatNumberAsCurrency(result.amount),
          chipColor: getChipColorForAmount(result),
        },
        actions: result,
      };
    });
  }, [trxData]);
}
