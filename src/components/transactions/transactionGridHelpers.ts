import { Transaction, TransactionType } from '@/common/api/trx';
import { inferTrxType } from '@/utils/transactionUtils';

export function getChipColorForAmount(trx: Transaction): string {
  switch (inferTrxType(trx)) {
    case TransactionType.Expense:
      return 'primary';
    case TransactionType.Income:
      return 'secondary';
    case TransactionType.Transfer:
    default:
      return 'default';
  }
}
