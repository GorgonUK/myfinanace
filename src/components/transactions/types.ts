import type { Tag, Transaction } from '@/common/api/trx';

export type TransactionGridRow = {
  id: bigint;
  date: {
    date_timestamp: number | undefined;
    essential: number;
    first: boolean;
  };
  flow: {
    acc_from_name: string | null | undefined;
    acc_to_name: string | null | undefined;
  };
  description: {
    description: string | null | undefined;
    tags: Tag[];
  };
  category: string | null | undefined;
  entity: string | null | undefined;
  value: {
    amount: string;
    chipColor: string;
  };
  actions: Transaction;
};
